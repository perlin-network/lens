import { computed, observable } from "mobx";
import * as nacl from "tweetnacl";
import * as _ from "lodash";
import { ITransaction } from "./Transaction";
import { Tag } from "./constants";
import * as store from "store";

const DEFAULT_HOST = location.hostname + ":9000";

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

        try {
            tx.payload =
                (tx.payload && JSON.parse(atob(tx.payload))) ||
                "<error decoding>";
        } catch (error) {
            tx.payload = "<too large>";
        }

        return tx;
    }

    public static getStoredHosts(): string[] {
        const storedHosts = store.get("storedHosts");
        if (!storedHosts) {
            Perlin.setStoredHosts([]);
            return [];
        }
        return storedHosts;
    }

    public static setStoredHosts(hosts: string[]) {
        store.set("storedHosts", hosts);
    }

    public static getCurrentHost(): string {
        const currentHost = store.get("currentHost");
        if (!currentHost) {
            Perlin.setCurrentHost(DEFAULT_HOST);
            return DEFAULT_HOST;
        }
        return currentHost;
    }

    public static setCurrentHost(host: string) {
        store.set("currentHost", host);
    }

    private static singleton: Perlin;

    @observable public api = {
        host: Perlin.getCurrentHost(),
        token: ""
    };

    @observable public ledger = {
        public_key: "",
        address: "",
        peers: [] as string[],
        state: {}
    };

    @observable public stats = {
        consensusDuration: 0,
        numAcceptedTransactions: 0,
        numAcceptedTransactionsPerSecond: 0,
        uptime: "0s",
        cmdline: []
    };

    @observable public transactions = {
        recent: [] as ITransaction[]
    };

    public onPolledTransaction: (tx: ITransaction) => void;

    private keys: nacl.SignKeyPair;

    private constructor() {
        this.keys = nacl.sign.keyPair.fromSecretKey(
            Buffer.from(
                "6d6fe0c2bc913c0e3e497a0328841cf4979f932e01d2030ad21e649fca8d47fe71e6c9b83a7ef02bae6764991eefe53360a0a09be53887b2d3900d02c00a3858",
                "hex"
            )
        );

        this.init().catch(err => console.error(err));
    }

    public setAPIHost = (host: string) => {
        this.api.host = host;
    };

    public async transfer(recipient: string, amount: number): Promise<any> {
        const params = {
            tag: Tag.Stake,
            payload: btoa(
                JSON.stringify({
                    recipient,
                    amount
                })
            )
        };

        return await this.request("/transaction/send", params);
    }

    // @ts-ignore
    public async placeStake(amount: number): Promise<any> {
        const params = {
            tag: Tag.Stake,
            payload: btoa(
                JSON.stringify({
                    amount
                })
            )
        };

        return await this.request("/transaction/send", params);
    }

    // @ts-ignore
    public async withdrawStake(amount: number): Promise<any> {
        const params = {
            tag: Tag.Stake,
            payload: btoa(
                JSON.stringify({
                    amount: amount * -1
                })
            )
        };

        return await this.request("/transaction/send", params);
    }

    public async createSmartContract(contractFile: any): Promise<any> {
        const formData = new FormData();
        formData.append("uploadFile", contractFile);

        const response = await fetch(`http://${this.api.host}/contract/send`, {
            method: "post",
            headers: {
                "X-Session-Token": this.api.token
            },
            body: formData
        });

        return await response.json();
    }

    public async downloadContract(txID: string): Promise<void> {
        const params = {
            transaction_id: txID
        };

        // get the contract payload
        const contract = await this.request("/contract/get", params);

        if (contract.hasOwnProperty("code")) {
            // convert the contract.code into bytes
            const byteCharacters = atob(contract.code);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // convert bytes into a download dialog
            const blob = new Blob([byteArray], { type: "application/wasm" });
            const fileName: string = `${txID}.wasm`;
            const objectUrl: string = URL.createObjectURL(blob);
            const a: HTMLAnchorElement = document.createElement(
                "a"
            ) as HTMLAnchorElement;
            a.href = objectUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
        }
    }

    private async init() {
        try {
            await this.initSession();
            await this.initLedger();

            await this.pollTransactions();

            this.pollStatistics();
            this.pollAccountUpdates();
        } catch (err) {
            console.error(err);
        }
    }

    private async request(
        endpoint: string,
        body?: any,
        headers?: any
    ): Promise<any> {
        const response = await fetch(`http://${this.api.host}${endpoint}`, {
            method: "post",
            headers: {
                "X-Session-Token": this.api.token,
                ...headers
            },
            body: JSON.stringify(body)
        });

        return await response.json();
    }

    private async initLedger() {
        this.ledger = await this.request("/ledger/state", {});

        Object.keys(this.ledger.state).forEach(publicKey => {
            const account = this.ledger.state[publicKey];

            Object.keys(account.State).forEach(key => {
                account.State[key] = this.decodeInt64(
                    new Buffer(account.State[key], "base64")
                );
            });
        });

        this.transactions.recent = await this.requestRecentTransactions();
    }

    private async initSession() {
        const time = new Date().getTime();
        const auth = nacl.sign.detached(
            new Buffer(`perlin_session_init_${time}`),
            this.keys.secretKey
        );

        const response = await this.request("/session/init", {
            public_key: Buffer.from(this.keys.publicKey).toString("hex"),
            time_millis: time,
            signature: Buffer.from(auth).toString("hex")
        });

        this.api.token = response.token;

        console.log(`Session token: ${this.api.token}`);
    }

    private pollTransactions(event: string = "accepted") {
        const ws = new WebSocket(
            `ws://${this.api.host}/transaction/poll?event=${event}`,
            this.api.token
        );

        ws.onmessage = ({ data }) => {
            data = Perlin.parseWiredTransaction(
                JSON.parse(data),
                this.transactions.recent.length
            );
            this.transactions.recent.push(data);

            if (this.onPolledTransaction != null) {
                this.onPolledTransaction(data);
            }

            if (this.transactions.recent.length > 50) {
                this.transactions.recent.shift();
            }
        };
    }

    private decodeInt64(buffer: Buffer) {
        return (
            buffer[0] |
            (buffer[1] << 8) |
            (buffer[2] << 16) |
            (buffer[3] << 24) |
            (buffer[4] << 32) |
            (buffer[5] << 40) |
            (buffer[6] << 48) |
            (buffer[7] << 56)
        );
    }

    private pollAccountUpdates() {
        const ws = new WebSocket(
            `ws://${this.api.host}/account/poll`,
            this.api.token
        );

        ws.onmessage = ({ data }) => {
            data = JSON.parse(data);
            const account = this.ledger.state[data.account];
            if (account != null) {
                account.Nonce = data.nonce;

                Object.keys(data.updates).forEach(key => {
                    account.State[key] = this.decodeInt64(
                        new Buffer(data.updates[key], "base64")
                    );
                });
            } else {
                Object.keys(data.updates).forEach(key => {
                    data.updates[key] = this.decodeInt64(
                        new Buffer(data.updates[key], "base64")
                    );
                });

                this.ledger.state[data.account] = {
                    Nonce: data.nonce,
                    State: data.updates
                };
            }
        };
    }

    private async requestRecentTransactions(): Promise<ITransaction[]> {
        const recent = await this.request("/transaction/list", {});
        return _.map(recent, Perlin.parseWiredTransaction);
    }

    // @ts-ignore
    private async listTransactions(
        offset: number,
        limit: number
    ): Promise<any> {
        return await this.request("/transaction/list", { offset, limit });
    }

    // @ts-ignore
    private async getTransaction(id: string): Promise<any> {
        return await this.request("/transaction", id);
    }

    // @ts-ignore
    private async getAccount(id: string): Promise<any> {
        return await this.request("/account/get", id);
    }

    private pollStatistics() {
        setInterval(async () => {
            const response = await fetch(`http://${this.api.host}/debug/vars`);
            const data = await response.json();

            this.stats = {
                consensusDuration: data.wavelet.consensus_duration || 0,
                numAcceptedTransactions:
                    data.wavelet.num_accepted_transactions || 0,
                numAcceptedTransactionsPerSecond:
                    data.wavelet.num_accepted_transactions_per_sec || 0,
                uptime: data.wavelet.uptime || "0s",
                cmdline: data.cmdline || [""]
            };
        }, 1000);
    }
}

export { Perlin };
