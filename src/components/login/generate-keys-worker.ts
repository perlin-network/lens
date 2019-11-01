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

    const prefixLen = buf => {
        for (let i = 0; i < buf.length; i++) {
            const b = buf[i];
            if (b !== 0) {
                const bin = b.toString(2);
                // @ts-ignore
                return i * 8 + bin.match(/^0*/).length;
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
