export const STORAGE_KEYS = {
    STORED_HOSTS: "storedHosts",
    CURRENT_HOST: "currentHost",
    TRANSACTION_GRAPH_NODES_LIMIT: "transactionGraphNodeLimit",
    NETWORK_GRAPH_NODES_LIMIT: "networkGraphNodeLimit",
    SECRET_KEY: "secretKey"
};
export const DEFAULT_API_HOST =
    process.env.REACT_APP_DEFAULT_API_HOST ||
    `${location.protocol}//${location.hostname}:9000`;
export const DEFAULT_TRANSACTION_GRAPH_NODES_LIMIT = 500;
export const TX_FEE = 2;
export const DEFAULT_NETWORK_GRAPH_NODES_LIMIT = 500;
export const FAUCET_URL = "https://faucet.perlin.net";
