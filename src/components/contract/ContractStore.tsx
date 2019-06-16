import { action, observable } from "mobx";
import * as Wabt from "wabt";
import { Perlin } from "../../Perlin";
import { SmartBuffer } from "smart-buffer";
import PayloadWriter from "src/payload/PayloadWriter";

declare const WebAssembly: any;

// @ts-ignore
const wabt = Wabt();

const perlin = Perlin.getInstance();

const watImportRegex = /\(import \"env" "_([a-zA-Z0-9_]+)" /g;
const WEB_ASSEMBLY_PAGE_SIZE = 65536;

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
        errorMessage: "",
        logs: [] as string[]
    };

    @observable public payload: any;
    @observable public wasmInstance: any;

    private wasmResolve: any;
    private wasmReject: any;

    private constructor() {
        // restrict access to constructor
    }

    public async onLoadContract(totalMemoryPages?: number) {
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
                        const logMessage = this.bytesToString(
                            this.readPointer(pointer, length)
                        );
                        console.log(`Log : ${logMessage}`);
                        this.contract.logs.push(logMessage);
                    };
                    break;
                case "result":
                    ext[`_${env}`] = async (pointer: any, length: number) => {
                        console.log(
                            `Result : `,
                            this.readPointer(pointer, length)
                        );
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

        // load memory from the network
        if (totalMemoryPages && totalMemoryPages > 0) {
            console.log("load memory....");
            const memory = new Uint8Array(
                new ArrayBuffer(WEB_ASSEMBLY_PAGE_SIZE * totalMemoryPages)
            );
            for (let idx = 0; idx < totalMemoryPages; idx++) {
                const page = await perlin.getContractPage(
                    this.contract.transactionId,
                    idx
                );

                if (page.length === 0) {
                    continue;
                }

                for (let i = 0; i < WEB_ASSEMBLY_PAGE_SIZE; i++) {
                    memory[WEB_ASSEMBLY_PAGE_SIZE * idx + i] = page[i];
                }
            }
            await this.updateWasmState(memory);
        }
    }

    public async call(method: string, params: Buffer) {
        this.contract.logs = [];
        this.payload = params;

        return new Promise((resolve, reject) => {
            this.wasmReject = reject;
            this.wasmResolve = resolve;
            this.wasmInstance.exports[`_contract_${method}`]();
        });
    }

    private async updateWasmState(loadedMemory: any) {
        const numMemoryPages =
            this.wasmInstance.exports.memory.buffer.byteLength /
            WEB_ASSEMBLY_PAGE_SIZE;
        const numLoadedMemoryPages =
            loadedMemory.byteLength / WEB_ASSEMBLY_PAGE_SIZE;

        if (numMemoryPages < numLoadedMemoryPages) {
            this.wasmInstance.exports.memory.grow(
                numLoadedMemoryPages - numMemoryPages
            );
        }
    }

    private environment(imports: any) {
        return {
            abort: () => {
                console.log("abort called");
            },
            _round_id: (ptr: any, len: any) => {
                return 0;
            },
            _verify_ed25519: () => {
                console.log("something");
            },
            _hash_blake2b_256: () => {
                console.log("something");
            },
            _hash_sha256: () => {
                console.log("something");
            },
            _hash_sha512: () => {
                console.log("something");
            },
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
