import { action, observable } from "mobx";
import { SmartBuffer } from "smart-buffer";
import * as Wabt from "wabt";
import { Perlin } from "../../Perlin";

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
        errorMessage: ""
    };

    @observable public logs = [] as string[];

    private memory: any;

    public async load(totalMemoryPages?: number) {
        if (!this.contract.textContent) {
            throw new Error("No contract code was available.");
            return;
        }
        await this.convertWabtToWasm(this.contract.textContent);
        console.log("contract deployed.");
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
            this.memory = memory;
        }
    }

    public async call(method: string, params: Buffer) {
        console.log("call...");
        this.logs = [];
        // @ts-ignore
        const buf = atob(
            (await perlin.getTransaction(this.contract.transactionId))
                .payload || ""
        );

        if (buf.length === 0) {
            throw new Error("No contract code was available.");
        }

        const payload = new Uint8Array(new ArrayBuffer(buf.length));
        for (let i = 0; i < buf.length; i++) {
            payload[i] = buf.charCodeAt(i);
        }

        const payloadView = new DataView(payload.buffer);
        const contractSpawnGasLimit = payloadView.getBigUint64(0, true);
        const contractSpawnPayloadSize = payloadView.getBigUint64(8, true);

        console.log(
            `To spawn the smart contract, a gas limit of ${contractSpawnGasLimit} PERLs was provided.`
        );
        console.log(
            `To spawn the smart contract, a ${contractSpawnPayloadSize}-byte payload was provided.`
        );

        const contractCode = new Uint8Array(
            payload.buffer,
            8 + 8 + Number(contractSpawnPayloadSize)
        );

        console.log(
            `The smart contracts code is ${contractCode.byteLength} bytes.`
        );

        let memory: any;

        let contractPayload = new Uint8Array(
            new ArrayBuffer(8 + 32 + 32 + 32 + 8)
        );
        const decoder = new TextDecoder();

        const imports = {
            env: {
                abort: () => {
                    console.log("abort called");
                },
                // todo: add send_transaction
                _payload_len: () => {
                    return contractPayload.length;
                },
                _payload: (ptr: any) => {
                    const plView = new Uint8Array(
                        memory.buffer,
                        ptr,
                        contractPayload.byteLength
                    );
                    plView.set(contractPayload);
                },
                _result: (pointer: any, len: any) => {
                    const result = decoder.decode(
                        new Uint8Array(memory.buffer, pointer, len)
                    );
                    console.log("Result:", result);
                    // this.logs.push(result);
                },
                _log: (pointer: any, len: any) => {
                    const logView = new Uint8Array(memory.buffer, pointer, len);
                    console.log(decoder.decode(logView));
                    this.logs.push(decoder.decode(logView));
                },
                _verify_ed25519: () => {
                    console.log("_verify_ed25519");
                },
                _hash_blake2b_256: () => {
                    console.log("_hash_blake2b_256");
                },
                _hash_sha256: () => {
                    console.log("_hash_sha256");
                },
                _hash_sha512: () => {
                    console.log("_hash_sha512");
                }
            }
        };

        const vm = await WebAssembly.instantiate(contractCode, imports);
        memory = vm.instance.exports.memory;
        const numMemoryPages =
            memory.buffer.byteLength / WEB_ASSEMBLY_PAGE_SIZE;
        const numLoadedMemoryPages =
            this.memory.byteLength / WEB_ASSEMBLY_PAGE_SIZE;

        if (numMemoryPages < numLoadedMemoryPages) {
            memory.grow(numLoadedMemoryPages - numMemoryPages);
        }
        const view = new Uint8Array(
            vm.instance.exports.memory.buffer,
            0,
            this.memory.length
        );
        view.set(this.memory);

        const invoke = (inputs: Buffer) => {
            // [round_idx, round_id, tx_id, tx_creator, balance, payload...]
            contractPayload = new Uint8Array(
                new ArrayBuffer(8 + 32 + 32 + 32 + 8 + inputs.byteLength)
            );
            const roundIdxView = new Uint8Array(contractPayload.buffer, 0, 8); // Round index.
            const roundIdView = new Uint8Array(contractPayload.buffer, 8, 32); // Round ID.
            // Transaction ID of contract call.
            const transactionIdView = new Uint8Array(
                contractPayload.buffer,
                8 + 32,
                32
            );
            // Transaction creators wallet address.
            const senderIdView = new Uint8Array(
                contractPayload.buffer,
                8 + 32 + 32,
                32
            );
            // Amount of money sent to the contract.
            const balanceView = new Uint8Array(
                contractPayload.buffer,
                8 + 32 + 32 + 32,
                8
            );
            // funcPayload
            const contractPayloadView = new Uint8Array(
                contractPayload.buffer,
                8 + 32 + 32 + 32 + 8
            );
            contractPayloadView.set(inputs);
            vm.instance.exports[`_contract_${method}`]();
        };
        invoke(params);
    }

    private async convertWabtToWasm(data: string): Promise<any> {
        const module = wabt.parseWat("", data);
        module.resolveNames();
        module.validate();
        return Promise.resolve(module.toBinary({ log: false }).buffer);
    }
}
