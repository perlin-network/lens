import { action, computed, observable } from "mobx";
import * as storage from "./storage";
import * as nacl from "tweetnacl";
import { blake2b, blake2bHex } from "blakejs";
import * as _ from "lodash";
import { ITransaction, Tag } from "./types/Transaction";
import { FAUCET_URL } from "./constants";
import { SmartBuffer } from "smart-buffer";
import PayloadReader from "./payload/PayloadReader";
import { IAccount } from "./types/Account";
import ReconnectingWebSocket from "reconnecting-websocket";
import { Wavelet, Contract, TAG_TRANSFER } from "wavelet-client";
import JSBI from "jsbi";
import { consoleTestResultHandler } from "tslint/lib/test";
// @ts-ignore
window.useNativeBigIntsIfAvailable = true;

export enum NotificationTypes {
    Success = "success",
    Default = "default",
    Info = "info",
    Danger = "danger",
    Warning = "warning"
}
const controller = new AbortController();
const signal = controller.signal;

class Perlin {
    @computed get recentTransactions() {
        return this.transactions.recent.slice();
    }

    public get publicKeyHex(): string {
        return Buffer.from(this.keys.publicKey).toString("hex");
    }

    public get isLoggedIn(): boolean {
        try {
            if (this.publicKeyHex === null) {
                return false;
            }
            return storage.getSecretKey() !== null;
        } catch (e) {
            return false;
        }
    }

    public static getInstance(): Perlin {
        if (Perlin.singleton === undefined) {
            Perlin.singleton = new Perlin();
        }
        return Perlin.singleton;
    }

    public static parseTransactionPayload(data: ITransaction) {
        if (!data.payload) {
            return;
        }

        const buffer = Buffer.from(data.payload, "base64");
        const reader = new PayloadReader(Array.from(buffer));

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

    public lastFaucetFetch = 0;

    @observable public api = {
        host: storage.getCurrentHost(),
        ws: storage.getCurrentHost().replace(/^http/, "ws"),
        token: ""
    };

    @observable public ledger = {
        public_key: "",
        address: "",
        peers: [] as string[],
        round: {} as any,
        num_accounts: 0
    };

    @observable public notification: any;

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
        offset: 0,
        pageSize: 200
    };

    @observable public peers: string[] = [];
    @observable public numAccounts: number = 0;
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
    public keys: nacl.SignKeyPair;
    public onConsensusRound: (
        accepted: number,
        rejected: number,
        maxDepth: number,
        round: number,
        startId?: string,
        endId?: string
    ) => void;
    public onConsensusPrune: (round: number) => void;
    public client: any;

    private transactionDebounceIntv: number = 2200;
    private peerPollIntv: number = 10000;
    private interval: any;

    private constructor() {
        const secret = storage.getSecretKey();
        storage.watchCurrentHost(this.handleHostChange);

        if (secret) {
            this.login(secret);
        }
    }

    @action.bound
    public async login(hexString: string): Promise<any> {
        try {
            this.keys = Wavelet.loadWalletFromPrivateKey(hexString);
            await this.init();
            storage.setSecretKey(hexString);
        } catch (err) {
            this.keys = {} as nacl.SignKeyPair;
            throw err;
        }
    }

    @action.bound
    public logout() {
        storage.removeSecretKey();
        clearInterval(this.interval);
        controller.abort();
        window.location.reload();
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

    public notify(data: any) {
        this.notification = data;
    }
    public async transfer(
        recipient: string,
        amount: any,
        gasLimit: any = JSBI.BigInt(0),
        gasDeposit: any = JSBI.BigInt(0)
    ): Promise<any> {
        if (recipient.length !== 64) {
            throw new Error("Recipient must be a length-64 hex-encoded.");
        }
        return await this.client.transfer(
            this.keys,
            recipient,
            amount,
            gasLimit,
            gasDeposit
        );
    }

    public async placeStake(amount: number): Promise<any> {
        return await this.client.placeStake(this.keys, JSBI.BigInt(amount));
    }

    public async withdrawStake(amount: number): Promise<any> {
        return await this.client.withdrawStake(this.keys, JSBI.BigInt(amount));
    }

    public async withdrawReward(amount: number): Promise<any> {
        return await this.client.withdrawReward(this.keys, JSBI.BigInt(amount));
    }

    public async getPerls(address: string) {
        return await fetch(FAUCET_URL, {
            method: "POST",
            signal,
            body: JSON.stringify({
                address
            })
        }).then(response => {
            this.lastFaucetFetch = Date.now();
            return response.json();
        });
    }
    public async createSmartContract(
        bytes: ArrayBuffer,
        gasLimit: JSBI,
        gasDeposit: JSBI = JSBI.BigInt(0),
        params?: ArrayBuffer
    ): Promise<any> {
        return this.client.deployContract(
            this.keys,
            bytes,
            gasLimit,
            gasDeposit,
            params
        );
    }

    public async getContractCode(contractId: string): Promise<ArrayBuffer> {
        return this.client.getCode(contractId);
    }

    public async getContractPages(contractId: string, numPages: number) {
        return await this.client.getMemoryPages(contractId, numPages);
    }

    public async getAccount(id: string): Promise<IAccount> {
        const data = await this.client.getAccount(id);

        return {
            public_key: data.public_key,

            balance: data.balance.toString(),
            gas_balance: data.gas_balance.toString(),
            stake: data.stake,
            reward: data.reward,
            is_contract: data.is_contract,
            num_mem_pages: data.num_mem_pages,
            nonce: data.nonce
        };
    }

    // @ts-ignore
    public async getTransaction(id: string): Promise<any> {
        return await this.client.getTransaction(id);
    }

    public async getTableTransactions(offset?: number) {
        try {
            if (typeof offset !== "undefined") {
                this.transactions.offset = offset;
                this.transactions.recent = this.transactions.recent.slice(
                    0,
                    offset
                );
            }

            this.transactions.loading = true;
            const transactions = await this.requestRecentTransactions(
                this.transactions.offset,
                this.transactions.pageSize
            );

            const appliedTransactions = transactions.filter(
                tx => tx.status === "applied"
            );

            this.transactions = {
                ...this.transactions,
                recent: [...this.transactions.recent, ...appliedTransactions],
                hasMore: !!transactions.length,
                loading: false,
                offset: this.transactions.offset + transactions.length // offset is calculated using all types of tx (both applied and non-applied)
            };
        } catch (err) {
            console.log(err);
        }
    }

    public async pollAccountUpdates(
        id: string,
        target: any,
        cb?: (data: any) => void
    ) {
        return await this.client.pollAccounts(
            {
                onAccountUpdated: (data: any) => {
                    if (typeof target === "function") {
                        target = target();
                    }
                    switch (data.event) {
                        case "gas_balance_updated":
                            target.gas_balance = data.gas_balance.toString();
                            break;
                        case "balance_updated":
                            target.balance = data.balance.toString();
                            break;
                        case "stake_updated":
                            target.stake = data.stake;
                            break;
                        case "reward_updated":
                            target.reward = data.reward;
                            break;
                        case "num_pages_updated":
                            target.num_mem_pages = data.num_pages;
                    }
                    if (cb) {
                        cb(target);
                    }
                }
            },
            { id }
        );
    }
    private async init() {
        try {
            this.client = new Wavelet(this.api.host);

            await this.initLedger();
            await this.initPeers();

            this.pollTransactionUpdates();
            this.pollConsensusUpdates();
            this.pollMetricsUpdates();
        } catch (err) {
            this.notify({
                type: NotificationTypes.Danger,
                message: err.message
            });
            throw err;
        }
    }

    private async getResponse(
        endpoint: string,
        params?: any,
        headers?: any
    ): Promise<Response> {
        const url = new URL(`${this.api.host}${endpoint}`);
        Object.keys(params).forEach(key =>
            url.searchParams.append(key, params[key])
        );

        return await fetch(url.toString(), {
            method: "get",
            signal,
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
        const response = await fetch(`${this.api.host}${endpoint}`, {
            method: "post",
            signal,
            headers: {
                ...headers
            },
            body: JSON.stringify(body)
        });

        return await response.json();
    }

    private async initLedger() {
        this.ledger = await this.getLedger();
        this.peers = this.ledger.peers || [];
        this.numAccounts = this.ledger.num_accounts;

        this.initRound = this.ledger.round;

        this.account = await this.getAccount(this.publicKeyHex);
        this.pollAccountUpdates(this.publicKeyHex, this.account);
    }

    private async initPeers() {
        this.interval = setInterval(async () => {
            // only update peers
            const ledger = await this.getLedger();
            this.peers = ledger.peers || [];
            this.numAccounts = ledger.num_accounts;
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
        const pushTransactions = _.debounce(
            transactions => {
                this.getTableTransactions(0);
            },
            this.transactionDebounceIntv,
            {
                maxWait: 2 * this.transactionDebounceIntv
            }
        );
        this.client.pollTransactions(
            {
                onTransactionApplied: pushTransactions
            },
            { tag: TAG_TRANSFER, creator: this.publicKeyHex }
        );
    }

    private pollConsensusUpdates() {
        this.client.pollConsensus({
            onRoundEnded: (logs: any) => {
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
            },
            onRoundPruned: this.onConsensusPrune
        });
    }

    private pollMetricsUpdates() {
        const url = new URL(`${this.api.ws}/poll/metrics`);

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

    // @ts-ignore
    private async listTransactions(
        offset: number = 0,
        limit: number = 0
    ): Promise<ITransaction[] | undefined> {
        return await this.getJSON(`/tx?creator=${this.publicKeyHex}`, {
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
