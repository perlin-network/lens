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

class Perlin {
    @computed get recentTransactions() {
        return this.transactions.recent.slice();
    }

    public static getInstance(): Perlin {
        if (Perlin.singleton === undefined) {
            Perlin.singleton = new Perlin();
        }
        return Perlin.singleton;
    }

    public static parseTransferTransaction(b: Buffer) {
        const reader = new PayloadReader(Array.from(b));

        const tx = {
            recipient: Buffer.from(reader.readBytes()).toString("hex"),
            amount: reader.readUint64().toNumber()
        };

        return tx;
    }

    public static parseWiredTransaction(
        tx: ITransaction,
        index: number
    ): ITransaction {
        tx = _.extend(tx, { index });

        switch (tx.tag) {
            case Tag.CONTRACT:
                delete tx.payload;
                break;
            case Tag.TRANSFER:
                tx.payload = Perlin.parseTransferTransaction(
                    Buffer.from(tx.payload, "base64")
                );
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
        peers: [] as string[]
    };

    @observable public account: IAccount = {
        public_key: "",
        balance: 0,
        stake: 0,
        is_contract: false,
        num_mem_pages: 0
    };

    @observable public transactions = {
        recent: [] as ITransaction[]
    };

    public onTransactionCreated: (tx: ITransaction) => void;
    public onTransactionApplied: (tx: ITransaction) => void;

    private keys: nacl.SignKeyPair;

    private constructor() {
        this.keys = nacl.sign.keyPair.fromSecretKey(
            Buffer.from(
                "87a6813c3b4cf534b6ae82db9b1409fa7dbd5c13dba5858970b56084c4a930eb400056ee68a7cc2695222df05ea76875bc27ec6e61e8e62317c336157019c405",
                "hex"
            )
        );
        this.init().catch(err => console.error(err));
    }

    public get publicKeyHex(): string {
        return Buffer.from(this.keys.publicKey).toString("hex");
    }

    public prepareTransaction(tag: Tag, payload: Buffer): any {
        const buffer = new SmartBuffer();
        buffer.writeUInt8(tag);
        buffer.writeBuffer(payload);

        const signature = nacl.sign.detached(
            new Uint8Array(buffer.toBuffer()),
            this.keys.secretKey
        );

        const tx = {
            sender: this.publicKeyHex,
            tag,
            payload: payload.toString("hex"),
            signature: Buffer.from(signature).toString("hex")
        };

        return tx;
    }

    public async transfer(recipient: string, amount: number): Promise<any> {
        const payload = new PayloadWriter();
        payload.writeBuffer(Buffer.from(recipient, "hex"));
        payload.writeUint64(Long.fromNumber(amount, true));

        return await this.post(
            "/tx/send",
            this.prepareTransaction(Tag.TRANSFER, payload.buffer.toBuffer())
        );
    }

    public async placeStake(amount: number): Promise<any> {
        const payload = new PayloadWriter();
        payload.writeUint64(Long.fromNumber(amount, true));

        return await this.post(
            "/tx/send",
            this.prepareTransaction(Tag.STAKE, payload.buffer.toBuffer())
        );
    }

    public async withdrawStake(amount: number): Promise<any> {
        const payload = new PayloadWriter();
        payload.writeUint64(Long.fromNumber(-amount, true));

        return await this.post(
            "/tx/send",
            this.prepareTransaction(Tag.STAKE, payload.buffer.toBuffer())
        );
    }

    public async createSmartContract(bytes: ArrayBuffer): Promise<any> {
        const payload = new PayloadWriter();
        payload.writeBuffer(Buffer.from(bytes));

        return await this.post(
            "/tx/send",
            this.prepareTransaction(Tag.CONTRACT, payload.buffer.toBuffer())
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
            this.prepareTransaction(Tag.TRANSFER, payload.buffer.toBuffer())
        );
    }

    public async getAccount(id: string): Promise<IAccount> {
        const data = await this.getJSON(`/accounts/${id}`, {});

        const account: IAccount = {
            public_key: data.public_key,

            balance: data.balance,
            stake: data.stake,

            is_contract: data.is_contract,
            num_mem_pages: data.num_mem_pages
        };

        return account;
    }

    private async init() {
        try {
            await this.startSession();
            await this.initLedger();

            this.pollTransactionUpdates();

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
        this.ledger = await this.getJSON("/ledger", {});

        this.account = await this.getAccount(this.publicKeyHex);
        this.pollAccountUpdates(this.publicKeyHex);

        this.transactions.recent = await this.requestRecentTransactions();
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
        const url = new URL(`ws://${this.api.host}/tx/poll`);
        url.searchParams.append("token", this.api.token);

        const ws = new WebSocket(url.toString());

        ws.onmessage = async ({ data }) => {
            data = JSON.parse(data);

            const tx: ITransaction = {
                id: data.tx_id,
                timestamp: Date.parse(data.time).valueOf(),
                sender: data.sender_id,
                creator: data.creator_id,
                parents: data.parents,
                tag: data.tag,
                payload: data.payload,
                status: "new"
            };

            switch (data.event) {
                case "new":
                    this.transactions.recent.push(
                        Perlin.parseWiredTransaction(
                            tx,
                            this.transactions.recent.length
                        )
                    );

                    if (this.onTransactionCreated !== undefined) {
                        this.onTransactionCreated(tx);
                    }

                    if (this.transactions.recent.length > 50) {
                        this.transactions.recent.shift();
                    }
                    break;
                case "applied":
                    if (this.onTransactionApplied !== undefined) {
                        this.onTransactionApplied(tx);
                    }
                    break;
                case "failed":
                    console.log(data.error);
            }
        };
    }

    private pollAccountUpdates(id: string) {
        const url = new URL(`ws://${this.api.host}/accounts/poll`);
        url.searchParams.append("token", this.api.token);
        url.searchParams.append("id", id);

        const ws = new WebSocket(url.toString());

        ws.onmessage = ({ data }) => {
            data = JSON.parse(data);

            switch (data.event) {
                case "balance_updated":
                    this.account.balance = data.balance;
                case "stake_updated":
                    this.account.stake = data.stake;
                case "num_pages_updated":
                    this.account.num_mem_pages = data.num_pages;
            }
        };
    }

    // @ts-ignore
    private async listTransactions(
        offset: number = 0,
        limit: number = 0
    ): Promise<[]> {
        const output = await this.getJSON("/tx", { offset, limit });
        return output;
    }

    private async requestRecentTransactions(): Promise<ITransaction[]> {
        return _.map(
            await this.listTransactions(),
            Perlin.parseWiredTransaction
        );
    }

    // @ts-ignore
    private async getTransaction(id: string): Promise<any> {
        return await this.getJSON(`/tx/${id}`, {});
    }
}

export { Perlin };
