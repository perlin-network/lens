export const enum Tag {
    TagNop,
    TagTransfer,
    TagContract,
    TagStake,
    TagBatch
}

interface ITransaction {
    id: string;

    creator: string;
    sender: string;

    parents: string[];

    nonce: number;
    depth: number;
    confidence: number;

    tag: Tag;
    payload?: any;

    status: string;

    creator_signature?: string;
    sender_signature?: string;
}

export { ITransaction };
