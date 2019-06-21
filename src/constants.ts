export const STORAGE_KEYS = {
    STORED_HOSTS: "storedHosts",
    CURRENT_HOST: "currentHost",
    TRANSACTION_GRAPH_NODES_LIMIT: "transactionGraphNodeLimit",
    NETWORK_GRAPH_NODES_LIMIT: "networkGraphNodeLimit",
    SECRET_KEY: "secretKey"
};
export const DEFAULT_API_HOST = location.hostname + ":9000";
export const HTTPS = !!process.env.REACT_APP_HTTPS;
export const HTTP_PROTOCOL = HTTPS ? "https" : "http";
export const WS_PROTOCOL = HTTPS ? "wss" : "ws";
export const DEFAULT_TRANSACTION_GRAPH_NODES_LIMIT = 500;
export const DEFAULT_NETWORK_GRAPH_NODES_LIMIT = 500;
