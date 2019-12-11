import {
    DEFAULT_TRANSACTION_GRAPH_NODES_LIMIT,
    DEFAULT_NETWORK_GRAPH_NODES_LIMIT,
    DEFAULT_API_HOST,
    STORAGE_KEYS
} from "./constants";
import eventsPlugin from "store/plugins/events";
import * as store from "store";

store.addPlugin(eventsPlugin);

const DEFAULT_STORED_HOSTS: string[] = [];

const setStoredHosts = (hosts: string[]) => {
    store.set(STORAGE_KEYS.STORED_HOSTS, hosts);
};

const getStoredHosts = (): string[] => {
    const storedHosts = store.get(STORAGE_KEYS.STORED_HOSTS);
    if (!storedHosts) {
        setStoredHosts(DEFAULT_STORED_HOSTS);
        return DEFAULT_STORED_HOSTS;
    }
    return storedHosts;
};

const removeStoredHost = (host: string) => {
    const storedHosts = getStoredHosts();
    const idx = storedHosts.indexOf(host);
    if (idx !== -1) {
        storedHosts.splice(idx, 1);
        setStoredHosts(storedHosts);
    }
};

const setSecretKey = (secretKey: string) => {
    store.set("secret", secretKey);
};

const getSecretKey = (): string | undefined => {
    const secret = store.get("secret");
    if (!secret) {
        return undefined;
    } else {
        return secret;
    }
};

const setCurrentHost = (host: string) => {
    const newHost = /^http/.test(host) ? host : "http://" + host;

    store.set(STORAGE_KEYS.CURRENT_HOST, newHost);
    const storedHosts = getStoredHosts();
    if (storedHosts.indexOf(newHost) === -1) {
        setStoredHosts(storedHosts.concat(newHost));
    }
};

const removeSecretKey = () => {
    store.remove("secret");
};

const getCurrentHost = (): string => {
    const currentHost = store.get(STORAGE_KEYS.CURRENT_HOST);

    if (!currentHost) {
        setCurrentHost(DEFAULT_API_HOST);
        return DEFAULT_API_HOST;
    }
    const newHost = /^http/.test(currentHost)
        ? currentHost
        : "http://" + currentHost;
    return newHost;
};

const watchCurrentHost = (cb: (newHost: string) => void) => {
    // @ts-ignore
    const watchId = store.watch(STORAGE_KEYS.CURRENT_HOST, cb);
    return () => {
        // @ts-ignore
        store.unwatch(watchId);
    };
};
const watchStoredHosts = (cb: (storedHosts: string[]) => void) => {
    // @ts-ignore
    const watchId = store.watch(STORAGE_KEYS.STORED_HOSTS, cb);
    return () => {
        // @ts-ignore
        store.unwatch(watchId);
    };
};

const getTransactionGraphNodeLimit = (): number => {
    const transactionGraphNodeLimit = store.get(
        STORAGE_KEYS.TRANSACTION_GRAPH_NODES_LIMIT
    );
    if (!transactionGraphNodeLimit) {
        setTransactionGraphNodeLimit(DEFAULT_TRANSACTION_GRAPH_NODES_LIMIT);
        return DEFAULT_TRANSACTION_GRAPH_NODES_LIMIT;
    }
    return transactionGraphNodeLimit;
};

const setTransactionGraphNodeLimit = (limit: number) => {
    store.set(STORAGE_KEYS.TRANSACTION_GRAPH_NODES_LIMIT, limit);
};

const getNetworkGraphNodeLimit = (): number => {
    const networkGraphNodeLimit = store.get(
        STORAGE_KEYS.NETWORK_GRAPH_NODES_LIMIT
    );
    if (!networkGraphNodeLimit) {
        setNetworkGraphNodeLimit(DEFAULT_NETWORK_GRAPH_NODES_LIMIT);
        return DEFAULT_NETWORK_GRAPH_NODES_LIMIT;
    }
    return networkGraphNodeLimit;
};

const setNetworkGraphNodeLimit = (limit: number) => {
    store.set(STORAGE_KEYS.NETWORK_GRAPH_NODES_LIMIT, limit);
};

export {
    setStoredHosts,
    getStoredHosts,
    removeStoredHost,
    setCurrentHost,
    getCurrentHost,
    watchCurrentHost,
    watchStoredHosts,
    getTransactionGraphNodeLimit,
    setTransactionGraphNodeLimit,
    getNetworkGraphNodeLimit,
    setNetworkGraphNodeLimit,
    setSecretKey,
    getSecretKey,
    removeSecretKey
};
