import { SmartBuffer } from "smart-buffer";
import * as Long from "long";

class PayloadWriter {
    public buffer: SmartBuffer;

    constructor() {
        this.buffer = new SmartBuffer();
    }

    public writeBytes(buf: number[]) {
        this.buffer.writeUInt32LE(buf.length);
        this.buffer.writeBuffer(Buffer.from(buf));

        return this;
    }

    public writeBuffer(buf: Buffer) {
        this.buffer.writeUInt32LE(buf.length);
        this.buffer.writeBuffer(buf);

        return this;
    }

    public writeString(a: string) {
        this.buffer.writeUInt32LE(a.length);
        this.buffer.writeBuffer(Buffer.from(a));
    }

    public writeByte(a: number) {
        this.buffer.writeUInt8(a);
    }

    public writeUint16(a: number) {
        this.buffer.writeUInt16LE(a);
    }

    public writeUint32(a: number) {
        this.buffer.writeUInt32LE(a);
    }

    public writeUint64(a: Long) {
        this.buffer.writeBuffer(Buffer.from(a.toBytesLE()));
    }

    public toBytes(): number[] {
        return Array.prototype.slice.call(this.buffer.toBuffer(), 0);
    }

    public toBuffer(): Buffer {
        return this.buffer.toBuffer();
    }
}

export default PayloadWriter;
