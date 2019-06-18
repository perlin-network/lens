import { Perlin } from "../../Perlin";
const perlin = Perlin.getInstance();

export interface INode {
    id: number;
    depth: number;
    type: string;
    round: number;
    parents: any[];
    children: any[];
    depthIndex: number;
    position: number[];
    txId?: string;
}

export class GraphStore {
    public static getInstance(): GraphStore {
        if (GraphStore.singleton === undefined) {
            GraphStore.singleton = new GraphStore();
        }
        return GraphStore.singleton;
    }

    private static singleton: GraphStore;

    public cameraSpeed = 1000;

    // renderQueue is ued to queue up render requeues
    private renderQueue: any[] = [];
    private renderLock = false;
    private subscriptions: any = [];
    private worker: Worker;
    private start: any;
    private prunnedRounds = {};

    constructor() {
        this.worker = new Worker(
            process.env.PUBLIC_URL + "/graph-store-worker.js"
        );

        // Receive messages from postMessage() calls in the Worker
        this.worker.onmessage = evt => {
            const { type, data } = JSON.parse(evt.data);

            if (type === "addRound") {
                const done = Date.now();
                console.log("generate nodes time:", done - this.start);
                if (this.prunnedRounds[data.roundNum]) {
                    return;
                }
                if (this.renderQueue.length || this.renderLock) {
                    this.renderQueue.push(data);
                    return;
                }

                this.notifySubscribers(type, data, this.renderFromQueue);
            } else {
                this.notifySubscribers(type, data);
            }
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
    public addRound = (
        accepted: number,
        rejected: number,
        maxDepth: number,
        roundNum: number,
        startId?: string,
        endId?: string
    ) => {
        this.start = Date.now();
        this.worker.postMessage({
            type: "addRound",
            accepted,
            rejected,
            maxDepth,
            roundNum,
            startId,
            endId,
            cameraSpeed: this.cameraSpeed
        });
    };

    public destroy() {
        this.worker.postMessage({
            type: "destroy"
        });
    }

    public pruneRound = (roundNum: number) => {
        this.prunnedRounds[roundNum] = true;
        this.worker.postMessage({ type: "pruneRound", roundNum });
    };

    private renderFromQueue = () => {
        const queueData = this.renderQueue.shift();
        this.renderLock = false;
        if (queueData) {
            // renderLock is used to prevent render when last item is rendered
            this.notifySubscribers("addRound", queueData, this.renderFromQueue);
        }
    };
    private notifySubscribers(
        type: string,
        data: any,
        cb?: (params?: any) => void
    ) {
        if (type === "addRound") {
            this.renderLock = true;
        }
        this.subscriptions[type] = this.subscriptions[type] || [];
        this.subscriptions[type].forEach((fn: any) => fn(data, cb));
    }
}
