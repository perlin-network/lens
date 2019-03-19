interface IAccount {
    public_key: string;

    balance: number;
    stake: number;

    is_contract: boolean;
    num_mem_pages: number;
}

export { IAccount };
