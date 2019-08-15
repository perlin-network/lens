interface IAccount {
    public_key: string;

    reward: number;
    balance: string;
    gas_balance?: string;
    stake: number;

    is_contract: boolean;
    num_mem_pages: number;
    nonce?: number;
}

export { IAccount };
