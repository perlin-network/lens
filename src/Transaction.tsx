interface ITransaction {
    id: string;
    nonce: number;
    sender: string;
    tag: string;
    parents: string[];
    signature: string;
}

export {ITransaction};