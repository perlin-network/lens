import { observable } from "mobx";
import * as Wabt from "wabt";
import { Perlin } from "../../Perlin";
import { TAG_TRANSFER } from "wavelet-client";
import { ITransaction } from "src/types/Transaction";

declare const WebAssembly: any;

// @ts-ignore
const wabt = Wabt();

const perlin = Perlin.getInstance();

const watImportRegex = /\(import \"env" "_([a-zA-Z0-9_]+)" /g;
const WEB_ASSEMBLY_PAGE_SIZE = 65536;

/*
 *   BigInt polyfill needed for Firefox (<68) and Safari
 *   source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
 */
function getUint64(dataview: any, byteOffset: any, littleEndian: any) {
    // split 64-bit number into two 32-bit (4-byte) parts
    const left = dataview.getUint32(byteOffset, littleEndian);
    const right = dataview.getUint32(byteOffset + 4, littleEndian);

    // combine the two 32-bit values
    const combined = littleEndian
        ? left + 2 ** 32 * right
        : 2 ** 32 * left + right;

    if (!Number.isSafeInteger(combined)) {
        console.warn(
            combined,
            "exceeds MAX_SAFE_INTEGER. Precision may be lost"
        );
    }

    return combined;
}
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

    public waveletContract: any;

    @observable public logs = [] as string[];

    public listenForApplied(tag: number, txId: string) {
        return new Promise<ITransaction>(async (resolve, reject) => {
            const poll = await perlin.client.pollTransactions(
                {
                    onTransactionApplied: (data: any) => {
                        const tx: ITransaction = {
                            id: data.tx_id,
                            sender: data.sender_id,
                            signature: data.signature,
                            nonce: data.nonce,
                            tag: data.tag,
                            status: data.event || "new"
                        };
                        resolve(tx);
                        poll.close();
                    },
                    onTransactionRejected: (data: any) => {
                        const message =
                            data.error || `Transaction was rejected`;
                        reject(new Error(message));
                        poll.close();
                    }
                },
                { tag, id: txId }
            );
        });
    }
}
