// Transaction Tags

enum Tag {
    Nop = 0,
    Generic,
    CreateContract,
    Stake
}

const STORAGE_KEYS = {
    STORED_HOSTS: "storedHosts",
    CURRENT_HOST: "currentHost"
};

export { Tag, STORAGE_KEYS };
