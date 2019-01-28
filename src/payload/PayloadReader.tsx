import {SmartBuffer} from "smart-buffer"
import * as Long from "long";

class PayloadReader {
    public buffer: SmartBuffer;

    constructor(buf: number[]) {
        this.buffer = SmartBuffer.fromBuffer(Buffer.from(buf));
    }

    public readBytes(): number[] {
        const buffer = this.buffer.readBuffer(this.buffer.readUInt32LE());
        return Array.prototype.slice.call(buffer, 0);
    }

    public readString(): string {
        return this.buffer.readBuffer(this.buffer.readUInt32LE()).toString();
    }

    public readByte(): number {
        return this.buffer.readUInt8();
    }

    public readUint16(): number {
        return this.buffer.readUInt16LE();
    }

    public readUint32(): number {
        return this.buffer.readUInt32LE();
    }

    public readUint64(): Long {
        return Long.fromBytesLE(Array.prototype.slice.call(this.buffer.readBuffer(8), 0));
    }
}


export default PayloadReader;