import * as Wabt from "wabt";
import ContractStore from "./ContractStore";
import { observable } from "mobx";
import { Perlin } from "../../Perlin";
import { SmartBuffer } from "smart-buffer";
import PayloadWriter from "src/payload/PayloadWriter";

declare const WebAssembly: any;

// @ts-ignore
const wabt = Wabt();

const contractStore = ContractStore.getInstance();
const perlin = Perlin.getInstance();

const watImportRegex = /\(import \"env" "_([a-zA-Z0-9_]+)" /g;

export default class ContractInstantiate {
    public static getInstance(): ContractInstantiate {
        if (ContractInstantiate.singleton === undefined) {
            ContractInstantiate.singleton = new ContractInstantiate();
        }
        return ContractInstantiate.singleton;
    }

    private static singleton: ContractInstantiate;

    @observable public payload: any;
    @observable public instance: any;

    private wasmResolve: any;
    private wasmReject: any;
    private state: Uint8Array;

    public async localDeploy() {
        console.log("deploy...");
        const buf = await this.assembleWasmWithWabt(
            contractStore.contract.textContent
        );

        this.payload = this.parametersToBytes([
            contractStore.contract.transactionId,
            perlin.account.public_key,
            this.Int32toBytes(0)
        ]);

        const envList = this.fetchEnv();
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
        this.instance = instance;
    }

    public async localInvoke(method: string, params: Buffer) {
        this.payload = params;
        return new Promise((resolve, reject) => {
            this.wasmReject = reject;
            this.wasmResolve = resolve;
            this.instance.exports[`_contract_${method}`]();
        });
    }

    private fetchEnv() {
        const envList = [];
        let match = watImportRegex.exec(contractStore.contract.textContent);
        while (match !== null) {
            envList.push(match[1]);
            match = watImportRegex.exec(contractStore.contract.textContent);
        }
        return envList;
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

    private bytesToString(bytes: any) {
        const buff = SmartBuffer.fromBuffer(new Buffer(bytes), "utf8");
        return buff.toString();
    }

    private readPointer(pointer: any, length: any) {
        return new Uint8Array(
            this.instance.exports.memory.buffer,
            pointer,
            length
        );
    }

    private parametersToBytes(parameters: any[]) {
        const writer = new PayloadWriter();
        parameters.forEach((value: any) => {
            writer.writeBytes(value);
        });
        return writer.toBuffer();
    }

    private writeMemory(buffer: any, offset: number = 0) {
        const memory = new Uint8Array(
            this.instance.exports.memory.buffer,
            offset,
            buffer.byteLength
        );
        buffer.forEach((value: any, index: any) => (memory[index] = value));
    }

    private Int64toBytes(num: any) {
        const arr = new ArrayBuffer(8);
        const view = new DataView(arr);
        view.setUint32(0, num, true);
        return new Uint8Array(arr);
    }

    private Int32toBytes(num: any) {
        const arr = new ArrayBuffer(4);
        const view = new DataView(arr);
        view.setUint32(0, num, true);
        return new Uint8Array(arr);
    }

    private async writeState() {
        const state = Buffer.from(this.instance.exports.memory.buffer);
        this.state = state;
    }

    private async assembleWasmWithWabt(data: string): Promise<ArrayBuffer> {
        const module = wabt.parseWat("", data);
        module.resolveNames();
        module.validate();
        return Promise.resolve(module.toBinary({ log: false }).buffer);
    }
}
