import { Perlin } from "../../Perlin";
const perlin = Perlin.getInstance();

const randomRange = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
// @ts-ignore
const uniqueRandomRange = (window.uniqueRandomRange = (
    min: number,
    max: number
) => {
    if (min > max) {
        throw new Error(`Invalid random ranges ${min} - ${max}`);
    }
    const extracted: any = {};
    let extractedCount = 0;
    const info = {
        done: false,
        extracted
    };
    const random = (overrideMin: number = min, overrideMax: number = max) => {
        let value: number;

        while (!info.done) {
            value = randomRange(overrideMin, overrideMax);
            if (!extracted[value]) {
                extracted[value] = true;
                extractedCount++;
                break;
            }
        }

        info.done = extractedCount > max - min;
        // @ts-ignore
        return value;
    };

    return {
        random,
        info
    };
});

const offset = (index: number, width: number) => index - Math.floor(width / 2);
const getPos = (index: number, width: number) => [
    index % width,
    Math.floor(index / width)
];
export interface INode {
    id: number;
    depth: number;
    type: string;
    round: number;
    parents: number[];
    children: number[];
    globalDepth: number;
    depthPos: number[];
}

export class GraphStore {
    public static getInstance(): GraphStore {
        if (GraphStore.singleton === undefined) {
            GraphStore.singleton = new GraphStore();
        }
        return GraphStore.singleton;
    }

    private static singleton: GraphStore;

    public rounds: any = {};
    public nodes: INode[] = [];
    private subscriptions: any = [];
    private lastCritical: INode;
    private worker: Worker;

    constructor() {
        this.worker = new Worker(
            process.env.PUBLIC_URL + "/graph-store-worker.js"
        );

        // Receive messages from postMessage() calls in the Worker
        this.worker.onmessage = evt => {
            const { type, data } = JSON.parse(evt.data);
            this.notifySubscribers(type, data);
        };

        // @ts-ignore
        perlin.onConsensusRound = window.addRound = this.addRound;
        // @ts-ignore
        perlin.onConsensusPrune = window.pruneRound = this.pruneRound;
    }

    public subscribe(type: string, fn: any) {
        this.subscriptions[type] = this.subscriptions[type] || [];
        this.subscriptions[type].push(fn);
        return () => {
            this.subscriptions[type] = this.subscriptions[type].filter(
                (item: any) => item !== fn
            );
        };
    }
    private notifySubscribers(type: string, data: any) {
        this.subscriptions[type] = this.subscriptions[type] || [];
        this.subscriptions[type].forEach((fn: any) => fn(data));
    }

    private addNode = (
        depth: number,
        depthPos: number[],
        type: string,
        round: number,
        globalDepth: number
    ) => {
        const node: INode = {
            id: this.nodes.length,
            type,
            depth,
            round,
            globalDepth,
            depthPos,
            parents: [],
            children: []
        };

        this.nodes.push(node);
        return node;
    };

    private addRound = (
        accepted: number,
        rejected: number,
        maxDepth: number,
        roundNum: number
    ) => {
        this.worker.postMessage({
            type: "addRound",
            accepted,
            rejected,
            maxDepth,
            roundNum
        });
    };

    private pruneRound = (roundNum: number, numTx: number) => {
        this.worker.postMessage({ type: "pruneRound", roundNum });
    };
}
