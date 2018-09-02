import {computed, observable} from "mobx";
import * as nacl from "tweetnacl"
import * as _ from "lodash";
import {ITransaction} from "./Transaction";


class Perlin {
    public static parseWiredTransaction(tx: any, index: number): ITransaction {
        tx = _.extend(tx, {index});
        tx = _.merge(tx, tx.body);
        delete tx.body;

        tx.payload = tx.payload && JSON.parse(atob(tx.payload)) || ""

        return tx;
    }

    @observable public api = {
        host: "127.0.0.1:3902",
        token: ""
    };

    @observable public ledger = {
        public_key: "",
        address: "",
        peers: [] as string[],
        state: {}
    };

    @observable public stats = {
        ConsensusDuration: 0,
        NumAcceptedTransactions: 0,
        NumAcceptedTransactionsPerSecond: 0,
        Uptime: "0s",
        cmdline: []
    }

    @observable public transactions = {
        recent: [] as ITransaction[]
    }

    public onPolledTransaction: (tx: ITransaction) => void;

    private keys: nacl.SignKeyPair;

    constructor() {
        this.keys = nacl.sign.keyPair.fromSecretKey(Buffer.from("6d6fe0c2bc913c0e3e497a0328841cf4979f932e01d2030ad21e649fca8d47fe71e6c9b83a7ef02bae6764991eefe53360a0a09be53887b2d3900d02c00a3858", "hex"));

        this.init().catch(err => console.error(err));
    }

    public async transfer(recipient: string, amount: number): Promise<any> {
        const params = {
            tag: "transfer",
            payload: btoa(JSON.stringify(
                {
                    recipient, amount
                }
            ))
        }

        return await this.request("/transaction/send", params);
    }

    @computed get recentTransactions() {
        return this.transactions.recent.slice();
    }

    private async init() {
        try {
            await this.initSession();
            await this.initLedger();

            await this.pollTransactions();

            this.pollStatistics();
            this.pollAccountUpdates();
        } catch (err) {
            console.error(err)
        }
    }

    private async request(endpoint: string, body?: any, headers?: any): Promise<any> {
        const response = await fetch(`http://${this.api.host}${endpoint}`, {
            method: 'post',
            headers: {
                "X-Session-Token": this.api.token,
                ...headers
            },
            body: JSON.stringify(body)
        })

        return await response.json();
    }

    private async initLedger() {
        this.ledger = await this.request("/ledger/state", {});
        this.transactions.recent = await this.requestRecentTransactions();
    }

    private async initSession() {
        const time = new Date().getTime();
        const auth = nacl.sign.detached(new Buffer(`perlin_session_init_${time}`), this.keys.secretKey)

        const response = await this.request("/session/init", {
                "PublicKey": Buffer.from(this.keys.publicKey).toString('hex'),
                "TimeMillis": time,
                "Sig": Buffer.from(auth).toString('hex'),
            }
        );

        this.api.token = response.Token;

        console.log(`Session token: ${this.api.token}`);
    }

    private pollTransactions(event: string = "accepted") {
        const ws = new WebSocket(`ws://${this.api.host}/transaction/poll?event=${event}`, this.api.token)

        ws.onmessage = ({data}) => {
            data = Perlin.parseWiredTransaction(JSON.parse(data), this.transactions.recent.length)
            this.transactions.recent.push(data)

            if (this.onPolledTransaction != null) {
                this.onPolledTransaction(data);
            }

            if (this.transactions.recent.length > 50) {
                this.transactions.recent.shift()
            }
        }
    }

    private pollAccountUpdates() {
        const ws = new WebSocket(`ws://${this.api.host}/account/poll`, this.api.token)

        ws.onmessage = ({data}) => {
            data = JSON.parse(data)

            const account = this.ledger.state[data.account]
            if (account != null) {
                account.nonce = data.nonce;
                account.balance = data.balance;
            } else {
                delete data.account;
                this.ledger.state[data.account] = data;
            }
        }
    }

    private async requestRecentTransactions(): Promise<ITransaction[]> {
        const recent = await this.request("/transaction/list", {});
        return _.map(recent, Perlin.parseWiredTransaction);
    }

    // @ts-ignore
    private async listTransactions(offset: number, limit: number): Promise<any> {
        return await this.request("/transaction/list", {offset, limit})
    }

    private pollStatistics() {
        setInterval(async () => {
            const response = await fetch(`http://${this.api.host}/debug/vars`)
            const data = await response.json()

            this.stats = data;
        }, 250);
    }
}

export {Perlin};