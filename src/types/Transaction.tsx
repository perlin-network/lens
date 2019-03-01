export const enum Tag {
    NOP = 0,
    TRANSFER = 1,
    CONTRACT = 2,
    STAKE = 3
}

interface ITransaction {
    id: string;

    creator: string;
    sender: string;

    parents: string[];

    timestamp?: number;
    depth?: number;

    tag: Tag;
    payload?: any;

    status: string;

    creator_signature?: string;
    sender_signature?: string;
}

export { ITransaction };
