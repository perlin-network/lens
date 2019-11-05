// Worker.ts
import * as nacl from "tweetnacl";
import { blake2b } from "blakejs";

const ctx: Worker = self as any;

onmessage = evt => {
    const { type, ...data } = evt.data;
    switch (type) {
        case "generateKeys":
            generateNewKeys(data.c1);
            break;
    }
};

const generateNewKeys = (c1 = 8) => {
    let generatedKeys;
    let checksum;

    const prefixLen = (buf: Uint8Array) => {
        for (let i = 0; i < buf.length; i++) {
            const b = buf[i];
            if (b !== 0) {
                // b.toString(2) removes leading 0s; so we just see how many were removed
                const leadingZeros = 8 - b.toString(2).length;

                return i * 8 + leadingZeros;
            }
        }

        return buf.length * 8 - 1;
    };

    do {
        generatedKeys = nacl.sign.keyPair();

        const id = blake2b(generatedKeys.publicKey, undefined, 32);
        checksum = blake2b(id, undefined, 32);
    } while (prefixLen(checksum) < c1);

    ctx.postMessage({
        type: "newKeys",
        data: generatedKeys
    });
};
