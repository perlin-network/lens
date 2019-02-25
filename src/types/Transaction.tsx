interface ITransaction {
    id: string;
    nonce: number;
    sender: string;
    tag: string;
    status: string;
    payload?: { amount: number };
    parents: string[];
    signature: string;
}

export { ITransaction };
