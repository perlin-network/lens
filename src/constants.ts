// Transaction Tags

enum Tag {
    Nop = "nop",
    Transfer = "transfer",
    CreateContract = "create_contract",
    PlaceStake = "place_stake",
    WithdrawStake = "withdraw_stake"
}

const STORAGE_KEYS = {
    STORED_HOSTS: "storedHosts",
    CURRENT_HOST: "currentHost"
};
const DEFAULT_API_HOST = location.hostname + ":9000";

export { Tag, STORAGE_KEYS, DEFAULT_API_HOST };
