import { observable } from "mobx";
import * as Wabt from "wabt";
import { Perlin } from "../../Perlin";
import { SmartBuffer } from "smart-buffer";
import PayloadWriter from "src/payload/PayloadWriter";

declare const WebAssembly: any;

// @ts-ignore
const wabt = Wabt();

const perlin = Perlin.getInstance();

const watImportRegex = /\(import \"env" "_([a-zA-Z0-9_]+)" /g;

export default class ContractStore {
    public static getInstance(): ContractStore {
        if (ContractStore.singleton === undefined) {
            ContractStore.singleton = new ContractStore();
        }
        return ContractStore.singleton;
    }
    private static singleton: ContractStore;

    @observable public contract = {
        name: "",
        transactionId: "",
        textContent: "",
        errorMessage: ""
    };

    @observable public payload: any;
    @observable public wasmInstance: any;

    private wasmResolve: any;
    private wasmReject: any;

    private constructor() {
        // restrict access to constructor
    }

    public async onLoadContract() {
        console.log("deploy...");

        const buf = await this.assembleWasmWithWabt(this.contract.textContent);

        const p = new SmartBuffer();
        p.writeBuffer(Buffer.from(this.contract.transactionId, "hex"));
        p.writeBuffer(Buffer.from(perlin.publicKeyHex, "hex"));
        p.writeInt8(0);

        this.payload = p;
        const envList = this.fetchEnvironment();
        const ext = {};
        for (const env of envList) {
            switch (env) {
                case "log":
                    ext[`_${env}`] = (pointer: any, length: number) => {
                        // console.log(this.bytesToString(this.readPointer(pointer, length)));
                    };
                    break;
                case "result":
                    ext[`_${env}`] = async (pointer: any, length: number) => {
                        await this.writeState();
                        this.wasmResolve(this.readPointer(pointer, length));
                    };
                    break;
                case "send_transaction":
                    ext[`_${env}`] = async (
                        tag: number,
                        payload: any,
                        length: number
                    ) => {
                        console.log(
                            this.bytesToString(
                                this.readPointer(payload, length)
                            )
                        );
                    };
                    break;
            }
        }

        const { instance } = await WebAssembly.instantiate(buf, {
            env: this.environment(ext)
        });

        this.wasmInstance = instance;
        console.log("Deployed");
        if (localStorage.getItem("state")) {
            localStorage.removeItem("state");
        }
    }

    public async localInvoke(method: string, params: Buffer) {
        this.payload = params;
        return new Promise((resolve, reject) => {
            this.wasmReject = reject;
            this.wasmResolve = resolve;
            this.wasmInstance.exports[`_contract_${method}`]();
        });
    }

    private environment(imports: any) {
        return {
            _payload_len: () => this.payload.byteLength,
            _payload: (pointer: any) => {
                this.writeMemory(this.payload, pointer);
            },
            ...imports
        };
    }

    private writeMemory(buffer: any, offset: number = 0) {
        const memory = new Uint8Array(
            this.wasmInstance.exports.memory.buffer,
            offset,
            buffer.byteLength
        );
        buffer.forEach((value: any, index: any) => (memory[index] = value));
    }

    private bytesToString(bytes: any) {
        const buff = SmartBuffer.fromBuffer(new Buffer(bytes), "utf8");
        return buff.toString();
    }

    private async writeState() {
        const state = Buffer.from(this.wasmInstance.exports.memory.buffer);
        localStorage.setItem("state", state.toString());
    }

    private fetchEnvironment() {
        const envList = [];
        let match = watImportRegex.exec(this.contract.textContent);
        while (match !== null) {
            envList.push(match[1]);
            match = watImportRegex.exec(this.contract.textContent);
        }
        return envList;
    }

    private readPointer(pointer: any, length: any) {
        return new Uint8Array(
            this.wasmInstance.exports.memory.buffer,
            pointer,
            length
        );
    }

    private async assembleWasmWithWabt(data: string): Promise<ArrayBuffer> {
        const module = wabt.parseWat("", data);
        module.resolveNames();
        module.validate();
        return Promise.resolve(module.toBinary({ log: false }).buffer);
    }
}
