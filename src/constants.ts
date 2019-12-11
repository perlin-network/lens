export const STORAGE_KEYS = {
    STORED_HOSTS: "storedHosts",
    CURRENT_HOST: "host",
    TRANSACTION_GRAPH_NODES_LIMIT: "transactionGraphNodeLimit",
    NETWORK_GRAPH_NODES_LIMIT: "networkGraphNodeLimit",
    SECRET_KEY: "secretKey"
};
export const DEFAULT_API_HOST =
    process.env.REACT_APP_DEFAULT_API_HOST ||
    `${window.location.protocol}//${window.location.hostname}:9000`;
export const DEFAULT_TRANSACTION_GRAPH_NODES_LIMIT = 500;
export const DEFAULT_NETWORK_GRAPH_NODES_LIMIT = 500;
export const FAUCET_URL = "https://faucet.perlin.net";
