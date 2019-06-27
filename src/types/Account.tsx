interface IAccount {
    public_key: string;

    reward: number;
    balance: string;
    stake: number;

    is_contract: boolean;
    num_mem_pages: number;
    nonce?: number;
}

export { IAccount };
