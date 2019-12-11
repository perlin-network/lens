export enum Tag {
    TagNop,
    TagTransfer,
    TagContract,
    TagStake,
    TagBatch
}

export interface ITransaction {
    id: string;
    sender: string;
    signature: string;
    tag: Tag;
    nonce: number;
    status: string;
    payload?: string;
}
