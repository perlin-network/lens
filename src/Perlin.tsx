import { action, computed, observable } from "mobx";
import * as storage from "./storage";
import * as nacl from "tweetnacl";
import * as _ from "lodash";
import { ITransaction, Tag } from "./types/Transaction";
import PayloadWriter from "./payload/PayloadWriter";
import * as Long from "long";
import { SmartBuffer } from "smart-buffer";
import PayloadReader from "./payload/PayloadReader";
import { IAccount } from "./types/Account";
import ReconnectingWebSocket from "reconnecting-websocket";
// @ts-ignore
import * as JSONbig from "json-bigint";

class Perlin {
    @computed get recentTransactions() {
        return this.transactions.recent.slice();
    }

    public get publicKeyHex(): string {
        return Buffer.from(this.keys.publicKey).toString("hex");
    }

    public static getInstance(): Perlin {
        if (Perlin.singleton === undefined) {
            Perlin.singleton = new Perlin();
        }
        return Perlin.singleton;
    }

    public static parseTransferTransaction(b: Buffer) {
        const reader = new PayloadReader(Array.from(b));

        return {
            recipient: reader.buffer.readBuffer(32).toString("hex"),
            amount: reader.readUint64().toNumber()
        };
    }

    public static parseWiredTransaction(
        tx: ITransaction,
        index: number
    ): ITransaction {
        tx = _.extend(tx, { index });

        switch (tx.tag) {
            case Tag.TagContract:
                delete tx.payload;
                break;
            case Tag.TagTransfer:
                const payload = Perlin.parseTransferTransaction(
                    Buffer.from(tx.payload, "base64")
                );

                tx.payload = payload;
                break;
        }

        // By default, a transactions status is labeled as "new".
        if (tx.status === undefined) {
            tx.status = "new";
        }

        return tx;
    }

    private static singleton: Perlin;

    @observable public api = {
        host: storage.getCurrentHost(),
        token: ""
    };

    @observable public ledger = {
        public_key: "",
        address: "",
        peers: [] as string[],
        round: {} as any
    };

    @observable public account: IAccount = {
        public_key: "",
        balance: "0",
        stake: 0,
        is_contract: false,
        num_mem_pages: 0
    };

    @observable public transactions = {
        recent: [] as ITransaction[],
        loading: true,
        hasMore: true
    };

    @observable public peers: string[] = [];

    @observable public initRound: any;

    @observable public metrics = {
        acceptedMean: 0,
        receivedMean: 0
    };

    public onTransactionsCreated: (txs: ITransaction[]) => void;
    public onTransactionsRemoved: (numTx: number, noUpdate?: boolean) => void;
    public onTransactionApplied: (tx: ITransaction) => void;
    public onTransactionsUpdated: () => void;
    public onConsensusRound: (
        accepted: number,
        rejected: number,
        maxDepth: number,
        round: number,
        startId?: string,
        endId?: string
    ) => void;
    public onConsensusPrune: (round: number, numTx: number) => void;

    private keys: nacl.SignKeyPair;
    private transactionDebounceIntv: number = 2000;
    private peerPollIntv: number = 5000;
    private transactionMap: any = {};

    private constructor() {
        this.keys = nacl.sign.keyPair.fromSecretKey(
            Buffer.from(
                "87a6813c3b4cf534b6ae82db9b1409fa7dbd5c13dba5858970b56084c4a930eb400056ee68a7cc2695222df05ea76875bc27ec6e61e8e62317c336157019c405",
                "hex"
            )
        );
        this.init().catch(err => console.error(err));
    }

    public prepareTransaction(tag: Tag, payload: Buffer): any {
        const buffer = new SmartBuffer();
        buffer.writeBuffer(new Buffer(8));
        buffer.writeUInt8(tag);
        buffer.writeBuffer(payload);

        const signature = nacl.sign.detached(
            new Uint8Array(buffer.toBuffer()),
            this.keys.secretKey
        );

        return {
            sender: this.publicKeyHex,
            tag,
            payload: payload.toString("hex"),
            signature: Buffer.from(signature).toString("hex")
        };
    }

    public async transfer(recipient: string, amount: number): Promise<any> {
        if (recipient.length !== 64) {
            throw new Error("Recipient must be a length-64 hex-encoded.");
        }

        const payload = new PayloadWriter();
        payload.buffer.writeBuffer(Buffer.from(recipient, "hex"));
        payload.writeUint64(Long.fromNumber(amount, true));

        return await this.post(
            "/tx/send",
            this.prepareTransaction(Tag.TagTransfer, payload.buffer.toBuffer())
        );
    }

    public async placeStake(amount: number): Promise<any> {
        const payload = new PayloadWriter();
        payload.writeByte(1);
        payload.writeUint64(Long.fromNumber(amount, true));

        return await this.post(
            "/tx/send",
            this.prepareTransaction(Tag.TagStake, payload.buffer.toBuffer())
        );
    }

    public async withdrawStake(amount: number): Promise<any> {
        const payload = new PayloadWriter();
        payload.writeByte(0);
        payload.writeUint64(Long.fromNumber(amount, true));

        return await this.post(
            "/tx/send",
            this.prepareTransaction(Tag.TagStake, payload.buffer.toBuffer())
        );
    }

    public async createSmartContract(bytes: ArrayBuffer): Promise<any> {
        const payload = new PayloadWriter();
        payload.writeBuffer(Buffer.from(bytes));

        return await this.post(
            "/tx/send",
            this.prepareTransaction(Tag.TagStake, payload.buffer.toBuffer())
        );
    }

    public async getContractCode(contractId: string): Promise<string> {
        return await this.getText(
            `/contract/${contractId}`,
            {},
            {
                "Content-Type": "application/wasm"
            }
        );
    }

    public async getContractPage(
        contractId: string,
        pageIndex: number
    ): Promise<string> {
        return await this.getText(
            `/contract/${contractId}/page/${pageIndex}`,
            {}
        );
    }

    public async invokeContractFunction(
        contractID: string,
        amount: number,
        funcName: string,
        funcParams: Buffer
    ): Promise<any> {
        const payload = new PayloadWriter();
        payload.writeBuffer(Buffer.from(contractID, "hex"));
        payload.writeUint64(Long.fromNumber(amount, true));
        payload.writeString(funcName);
        payload.writeBuffer(funcParams);

        return await this.post(
            "/tx/send",
            this.prepareTransaction(Tag.TagTransfer, payload.buffer.toBuffer())
        );
    }

    public async getAccount(id: string): Promise<IAccount> {
        const dataStr = await this.getText(`/accounts/${id}`, {});

        const data = JSONbig.parse(dataStr);

        return {
            public_key: data.public_key,

            balance: data.balance.toString(),
            stake: data.stake,

            is_contract: data.is_contract,
            num_mem_pages: data.num_mem_pages
        };
    }

    // @ts-ignore
    public async getTransaction(id: string): Promise<any> {
        return await this.getJSON(`/tx/${id}`, {});
    }

    public async getTableTransactions(offset: number, limit: number) {
        try {
            const transactions = await this.requestRecentTransactions(
                offset,
                limit
            );

            this.transactions = {
                ...this.transactions,
                recent: [...this.transactions.recent, ...transactions],
                hasMore: !!transactions.length,
                loading: false
            };
        } catch (err) {
            console.log(err);
        }
    }

    private async init() {
        try {
            // await this.startSession();
            await this.initLedger();
            await this.initPeers();

            this.pollTransactionUpdates();
            this.pollConsensusUpdates();
            this.pollMetricsUpdates();

            storage.watchCurrentHost(this.handleHostChange);
        } catch (err) {
            console.error(err);
        }
    }

    private async getResponse(
        endpoint: string,
        params?: any,
        headers?: any
    ): Promise<Response> {
        const url = new URL(`http://${this.api.host}${endpoint}`);
        Object.keys(params).forEach(key =>
            url.searchParams.append(key, params[key])
        );

        return await fetch(url.toString(), {
            method: "get",
            headers: {
                "X-Session-Token": this.api.token,
                "Content-Type": "application/json",
                ...headers
            }
        });
    }

    private async getJSON(
        endpoint: string,
        params?: any,
        headers?: any
    ): Promise<any> {
        const response = await this.getResponse(endpoint, params, headers);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return await response.json();
    }

    private async getText(
        endpoint: string,
        params?: any,
        headers?: any
    ): Promise<string> {
        const response = await this.getResponse(endpoint, params, headers);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return await response.text();
    }

    private async getBuffer(
        endpoint: string,
        params?: any,
        headers?: any
    ): Promise<ArrayBuffer> {
        const response = await this.getResponse(endpoint, params, headers);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return await response.arrayBuffer();
    }

    private async post(
        endpoint: string,
        body?: any,
        headers?: any
    ): Promise<any> {
        const response = await fetch(`http://${this.api.host}${endpoint}`, {
            method: "post",
            headers: {
                "X-Session-Token": this.api.token,
                "Content-Type": "application/json",
                ...headers
            },
            body: JSON.stringify(body)
        });

        return await response.json();
    }

    private async initLedger() {
        this.ledger = await this.getLedger();
        this.peers = this.ledger.peers;

        this.initRound = this.ledger.round;

        this.account = await this.getAccount(this.publicKeyHex);
        this.pollAccountUpdates(this.publicKeyHex);
        this.getTableTransactions(0, 50);
    }

    private async initPeers() {
        // setInterval(async () => {
        /// only update peers
        const ledger = await this.getLedger();
        this.peers = ledger.peers;
        // }, this.peerPollIntv);
    }

    private async startSession() {
        const time = new Date().getTime();
        const auth = nacl.sign.detached(
            new Buffer(`perlin_session_init_${time}`),
            this.keys.secretKey
        );

        const response = await this.post("/session/init", {
            public_key: Buffer.from(this.keys.publicKey).toString("hex"),
            time_millis: time,
            signature: Buffer.from(auth).toString("hex")
        });

        this.api.token = response.token;

        console.log(`Session token: ${this.api.token}`);
    }

    @action.bound
    private handleHostChange(host: string) {
        this.api.host = host;
    }

    private pollTransactionUpdates(event: string = "accepted") {
        const url = new URL(
            `ws://${this.api.host}/poll/tx?sender=${this.publicKeyHex}`
        );
        url.searchParams.append("token", this.api.token);

        const ws = new ReconnectingWebSocket(url.toString());

        const pushTransactions = _.debounce(
            () => {
                const txLength = this.transactions.recent.length;
                this.transactions.recent = transactions;
                if (this.onTransactionsCreated !== undefined) {
                    this.onTransactionsCreated(transactions.slice(txLength));
                }
            },
            this.transactionDebounceIntv,
            {
                maxWait: 2 * this.transactionDebounceIntv
            }
        );

        const updateTransactions = _.debounce(
            () => {
                if (this.onTransactionsUpdated !== undefined) {
                    this.onTransactionsUpdated();
                }
            },
            this.transactionDebounceIntv,
            {
                maxWait: 2 * this.transactionDebounceIntv
            }
        );

        const transactions = [...this.transactions.recent];

        ws.onmessage = async ({ data }) => {
            data = JSON.parse(data);

            const tx: ITransaction = {
                id: data.tx_id,
                sender: data.sender_id,
                creator: data.creator_id,
                parents: data.parents,
                nonce: data.nonce,
                depth: data.depth,
                confidence: data.confidence,
                tag: data.tag,
                payload: data.payload,
                status: data.event
            };

            console.log(data.event, tx.id);
            switch (data.event) {
                case "new":
                case "applied":
                    const parsedTx = Perlin.parseWiredTransaction(
                        tx,
                        transactions.length
                    );

                    if (!this.transactionMap[parsedTx.id]) {
                        transactions.push(parsedTx);
                        this.transactionMap[parsedTx.id] = parsedTx;
                    } else {
                        const currentStatus = this.transactionMap[parsedTx.id]
                            .status;
                        if (currentStatus !== parsedTx.status) {
                            this.transactionMap[parsedTx.id].status =
                                parsedTx.status;
                            updateTransactions();
                        }

                        return;
                    }

                    pushTransactions();
                    break;
                case "failed":
                    console.log(data.error);
            }
        };
    }

    private pollConsensusUpdates() {
        const url = new URL(`ws://${this.api.host}/poll/consensus`);
        url.searchParams.append("token", this.api.token);

        const ws = new ReconnectingWebSocket(url.toString());

        ws.onmessage = ({ data }) => {
            data = JSON.parse(data);
            switch (data.event) {
                case "prune":
                    console.log("Prunning #", data.pruned_round_id);

                    if (this.onConsensusPrune) {
                        this.onConsensusPrune(
                            data.pruned_round_id,
                            data.num_tx
                        );
                    }
                    break;
                case "round_end":
                    console.log("Round end #", data.new_round);
                    if (this.onConsensusRound) {
                        this.onConsensusRound(
                            data.num_applied_tx,
                            data.num_rejected_tx,
                            data.round_depth,
                            data.new_round,
                            data.old_root,
                            data.new_root
                        );
                    }
            }
        };
    }

    private pollMetricsUpdates() {
        const url = new URL(`ws://${this.api.host}/poll/metrics`);
        url.searchParams.append("token", this.api.token);

        const ws = new ReconnectingWebSocket(url.toString());

        ws.onmessage = ({ data }) => {
            data = JSON.parse(data);

            this.metrics.acceptedMean = data["tps.accepted"];
            this.metrics.receivedMean = data["tps.received"];
        };
    }

    private async getLedger() {
        return await this.getJSON("/ledger", {});
    }

    private pollAccountUpdates(id: string) {
        const url = new URL(`ws://${this.api.host}/poll/accounts`);
        url.searchParams.append("token", this.api.token);
        url.searchParams.append("id", id);

        const ws = new ReconnectingWebSocket(url.toString());

        ws.onmessage = ({ data }) => {
            data = JSONbig.parse(data);

            if (data.account_id === id) {
                // TODO(kenta): temp fix
                switch (data.event) {
                    case "balance_updated":
                        this.account.balance = data.balance.toString();
                        break;
                    case "stake_updated":
                        this.account.stake = data.stake;
                        break;
                    case "num_pages_updated":
                        this.account.num_mem_pages = data.num_pages;
                }
            }
        };
    }

    // @ts-ignore
    private async listTransactions(
        offset: number = 0,
        limit: number = 0
    ): Promise<ITransaction[] | undefined> {
        return await this.getJSON("/tx", {
            offset,
            limit,
            sender: this.publicKeyHex
        });
    }

    private async requestRecentTransactions(
        offset: number,
        limit: number
    ): Promise<ITransaction[]> {
        return _.map(
            await this.listTransactions(offset, limit),
            Perlin.parseWiredTransaction
        );
    }
}

export { Perlin };
