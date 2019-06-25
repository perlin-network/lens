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
    depth: number;

    tag: Tag;

    status: string;
    payload?: string;
}

export { ITransaction };
