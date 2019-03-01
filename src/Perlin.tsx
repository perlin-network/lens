import { action, computed, observable } from "mobx";
import * as storage from "./storage";
import * as nacl from "tweetnacl";
import * as _ from "lodash";
import { ITransaction, Tag } from "./types/Transaction";
import PayloadWriter from "./payload/PayloadWriter";
import * as Long from "long";
import { SmartBuffer } from "smart-buffer";

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

    public static parseWiredTransaction(tx: any, index: number): ITransaction {
        tx = _.extend(tx, { index });

        if (tx.tag === Tag.CONTRACT) {
            tx.payload = undefined;
        }

        // By default, a transactions status is labeled as "new".
        if (tx.status === null) {
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

    @observable public account = {
        public_key: "",
        balance: 0,
        stake: 0,
        is_contract: false,
        num_pages: 0
    };

    @observable public transactions = {
        recent: [] as ITransaction[]
    };

    public onPolledTransaction: (tx: ITransaction) => void;

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

    public async createSmartContract(contractFile: Blob): Promise<any> {
        const reader = new FileReader();

        const bytes: ArrayBuffer = await new Promise((resolve, reject) => {
            reader.onerror = () => {
                reader.abort();
                reject(new DOMException("Failed to parse contract file."));
            };

            reader.onload = () => {
                resolve(reader.result as any);
            };

            reader.readAsArrayBuffer(contractFile);
        });

        const payload = new PayloadWriter();
        payload.writeBuffer(Buffer.from(bytes));

        return await this.post(
            "/tx/send",
            this.prepareTransaction(Tag.CONTRACT, payload.buffer.toBuffer())
        );
    }

    public async downloadContract(id: string): Promise<void> {
        // Download the contracts code.
        const contract = await this.get(`/contract/${id}`, {});

        // Parse the contracts code into a byte buffer.
        const buf = new Uint8Array(contract);

        // Construct a blob out of the byte buffer and have the file downloaded.
        const blob = new Blob([buf], { type: "application/wasm" });
        const href: string = URL.createObjectURL(blob);

        const a: HTMLAnchorElement = document.createElement(
            "a"
        ) as HTMLAnchorElement;
        a.href = href;
        a.download = `${id}.wasm`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(href);
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

    private async get(
        endpoint: string,
        params?: any,
        headers?: any
    ): Promise<any> {
        const url = new URL(`http://${this.api.host}${endpoint}`);
        Object.keys(params).forEach(key =>
            url.searchParams.append(key, params[key])
        );

        const response = await fetch(url.toString(), {
            method: "get",
            headers: {
                "X-Session-Token": this.api.token,
                "Content-Type": "application/json",
                ...headers
            }
        });

        return await response.json();
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
        this.ledger = await this.get("/ledger", {});

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

            switch (data.event) {
                case "new":
                    const tx: ITransaction = {
                        id: data.tx_id,
                        sender: data.sender_id,
                        creator: data.creator_id,
                        parents: data.parents,
                        tag: data.tag,
                        payload: data.payload,
                        status: "new"
                    };

                    this.transactions.recent.push(
                        Perlin.parseWiredTransaction(
                            tx,
                            this.transactions.recent.length
                        )
                    );

                    if (this.onPolledTransaction !== null) {
                        this.onPolledTransaction(tx);
                    }

                    if (this.transactions.recent.length > 50) {
                        this.transactions.recent.shift();
                    }
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
                    this.account.num_pages = data.num_pages;
            }
        };
    }

    // @ts-ignore
    private async listTransactions(
        offset: number = 0,
        limit: number = 0
    ): Promise<any> {
        return await this.get("/tx", { offset, limit });
    }

    private async requestRecentTransactions(): Promise<ITransaction[]> {
        return _.map(
            await this.listTransactions(),
            Perlin.parseWiredTransaction
        );
    }

    // @ts-ignore
    private async getTransaction(id: string): Promise<any> {
        return await this.get(`/tx/${id}`, {});
    }

    // @ts-ignore
    private async getAccount(id: string): Promise<any> {
        return await this.get(`/accounts/${id}`, {});
    }
}

export { Perlin };
