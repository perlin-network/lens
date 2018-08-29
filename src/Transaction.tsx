interface ITransaction {
    nonce: number;
    sender: string;
    tag: string;
    payload: any;
    parents: string[];
    signature: string;
}

export {ITransaction};