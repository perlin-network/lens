import { DEFAULT_API_HOST, STORAGE_KEYS } from "./constants";
import * as eventsPlugin from "store/plugins/events";
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

const setCurrentHost = (host: string) => {
    store.set(STORAGE_KEYS.CURRENT_HOST, host);
    const storedHosts = getStoredHosts();
    if (storedHosts.indexOf(host) === -1) {
        setStoredHosts(storedHosts.concat(host));
    }
};

const getCurrentHost = (): string => {
    const currentHost = store.get(STORAGE_KEYS.CURRENT_HOST);
    if (!currentHost) {
        setCurrentHost(DEFAULT_API_HOST);
        return DEFAULT_API_HOST;
    }
    return currentHost;
};

const watchCurrentHost = (cb: (newHost: string) => void) => {
    // @ts-ignore
    const watchId = store.watch(STORAGE_KEYS.CURRENT_HOST, cb);
    return () => {
        // @ts-ignore
        store.unwatch(watchId);
    };
};
const watchStoredHosts = (cb: (storedHosts: string) => void) => {
    // @ts-ignore
    const watchId = store.watch(STORAGE_KEYS.STORED_HOSTS, cb);
    return () => {
        // @ts-ignore
        store.unwatch(watchId);
    };
};

export {
    setStoredHosts,
    getStoredHosts,
    removeStoredHost,
    setCurrentHost,
    getCurrentHost,
    watchCurrentHost,
    watchStoredHosts
};
