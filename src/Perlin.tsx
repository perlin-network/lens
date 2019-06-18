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
        reward: 0,
        stake: 0,
        is_contract: false,
        num_mem_pages: 0
    };

    @observable public transactions = {
        recent: [] as ITransaction[],
        loading: true,
        hasMore: true,
        page: 0,
        pageSize: 200
    };

    @observable public peers: string[] = [];

    @observable public initRound: any;

    @observable public metrics = {
        accepted: undefined,
        downloaded: undefined,
        gossiped: undefined,
        received: undefined
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
    public onConsensusPrune: (round: number) => void;

    private keys: nacl.SignKeyPair;
    private transactionDebounceIntv: number = 2200;
    private peerPollIntv: number = 10000;

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

    public async transfer(
        recipient: string,
        amount: number,
        gasLimit: number = 0
    ): Promise<any> {
        if (recipient.length !== 64) {
            throw new Error("Recipient must be a length-64 hex-encoded.");
        }

        const payload = new PayloadWriter();
        payload.buffer.writeBuffer(Buffer.from(recipient, "hex"));
        payload.writeUint64(Long.fromNumber(amount, true));
        payload.writeUint64(Long.fromNumber(gasLimit, true));

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

    public async withdrawReward(amount: number): Promise<any> {
        const payload = new PayloadWriter();
        payload.writeByte(2);
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
            reward: data.reward,
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
            this.transactions.loading = true;
            const transactions = await this.requestRecentTransactions(
                offset,
                limit
            );

            const appliedTransactions = transactions.filter(
                tx => tx.status === "applied"
            );

            this.transactions = {
                ...this.transactions,
                recent: [...this.transactions.recent, ...appliedTransactions],
                hasMore: !!transactions.length,
                loading: false,
                page: this.transactions.page + 1
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
    }

    private async initPeers() {
        setInterval(async () => {
            /// only update peers
            const ledger = await this.getLedger();
            this.peers = ledger.peers;
        }, this.peerPollIntv);
    }

    private async startSession() {
        const time = Date.now();
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

        const ws = new ReconnectingWebSocket(url.toString());

        const pushTransactions = _.debounce(
            transactions => {
                this.transactions.recent = [
                    ...transactions,
                    ...lastTransactions
                ].slice(0, this.transactions.pageSize);

                this.transactions.page = 1;
                this.transactions.hasMore = true;
                lastTransactions = this.transactions.recent;
            },
            this.transactionDebounceIntv,
            {
                maxWait: 2 * this.transactionDebounceIntv
            }
        );

        let lastTransactions: ITransaction[] = this.transactions.recent;
        ws.onmessage = async ({ data }) => {
            if (!data) {
                return;
            }
            const logs = JSON.parse(data);
            const transactions: ITransaction[] = [];

            logs.forEach((item: any) => {
                const tx: ITransaction = {
                    id: item.tx_id,
                    sender: item.sender_id,
                    creator: item.creator_id,
                    depth: item.depth,
                    tag: item.tag,
                    status: item.event || "new"
                };

                switch (item.event) {
                    case "new":
                    case "applied":
                        transactions.unshift(tx);
                        pushTransactions(transactions);
                        break;
                }
            });
        };
    }

    private pollConsensusUpdates() {
        const url = new URL(`ws://${this.api.host}/poll/consensus`);

        const ws = new ReconnectingWebSocket(url.toString());

        ws.onmessage = ({ data }) => {
            const logs = JSON.parse(data);

            switch (logs.event) {
                case "prune":
                    console.log("Prunning #", logs.pruned_round_id);

                    if (this.onConsensusPrune) {
                        this.onConsensusPrune(logs.pruned_round_id);
                    }
                    break;
                case "round_end":
                    this.initRound = {
                        applied: logs.num_applied_tx,
                        rejected: logs.num_rejected_tx,
                        depth: logs.round_depth,
                        start_id: logs.old_root,
                        end_id: logs.new_root
                    };
                    if (this.onConsensusRound) {
                        this.onConsensusRound(
                            logs.num_applied_tx,
                            logs.num_rejected_tx,
                            logs.round_depth,
                            logs.new_round,
                            logs.old_root,
                            logs.new_root
                        );
                    }
            }
        };
    }

    private pollMetricsUpdates() {
        const url = new URL(`ws://${this.api.host}/poll/metrics`);

        const ws = new ReconnectingWebSocket(url.toString());

        ws.onmessage = ({ data }) => {
            const logs = JSON.parse(data);

            this.metrics.accepted = logs["tps.accepted"];
            this.metrics.received = logs["tps.received"];
            this.metrics.gossiped = logs["tps.gossiped"];
            this.metrics.downloaded = logs["tps.downloaded"];
        };
    }

    private async getLedger() {
        return await this.getJSON("/ledger", {});
    }

    private pollAccountUpdates(id: string) {
        const url = new URL(`ws://${this.api.host}/poll/accounts`);
        url.searchParams.append("id", id);

        const ws = new ReconnectingWebSocket(url.toString());

        ws.onmessage = ({ data }) => {
            if (!data) {
                return;
            }

            const logs = JSONbig.parse(data);

            logs.forEach((item: any) => {
                if (item.account_id === id) {
                    // TODO(kenta): temp fix
                    switch (item.event) {
                        case "balance_updated":
                            this.account.balance = item.balance.toString();
                            break;
                        case "stake_updated":
                            this.account.stake = item.stake;
                            break;
                        case "reward_updated":
                            this.account.reward = item.reward;
                            break;
                        case "num_pages_updated":
                            this.account.num_mem_pages = item.num_pages;
                    }
                }
            });
        };
    }

    // @ts-ignore
    private async listTransactions(
        offset: number = 0,
        limit: number = 0
    ): Promise<ITransaction[] | undefined> {
        return await this.getJSON(`/tx?sender=${this.publicKeyHex}`, {
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
