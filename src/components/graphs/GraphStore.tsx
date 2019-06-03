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
    parents: INode[];
    children: INode[];
    globalDepth: number;
    depthPos: number[];
}

type Subscriber = (nodes: INode[]) => void;

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
    private subscriptions: Subscriber[] = [];
    private lastCritical: INode;

    constructor() {
        // @ts-ignore
        perlin.onConsensusRound = window.addRound = this.addRound;
        // @ts-ignore
        perlin.onConsensusPrune = window.pruneRound = this.pruneRound;
    }

    public subscribe(fn: Subscriber) {
        this.subscriptions.push(fn);
        return () => {
            this.subscriptions = this.subscriptions.filter(item => item !== fn);
        };
    }
    private notifySubscribers(nodes: INode[]) {
        this.subscriptions.forEach((fn: Subscriber) => fn(nodes));
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
        const numTx = accepted + rejected - 1;
        const { random: uniqueRandom } = uniqueRandomRange(0, numTx - 1);

        const depthSize = Math.ceil(numTx / maxDepth);
        const typeMap: any = {};
        let count = 0;

        while (count < rejected) {
            typeMap[uniqueRandom()] = "rejected";
            count++;
        }

        const round: any = {};
        const createNode = (index: number, type: string) => {
            let depthIndex = index % depthSize;

            let depth = index % maxDepth; // Math.floor(index / depthSize);

            if (type === "critical") {
                depth = depthSize > 1 ? maxDepth : maxDepth - 1;
                depthIndex = 0;
            }

            let lastCriticalDepth = 0;
            if (this.lastCritical) {
                lastCriticalDepth += this.lastCritical.globalDepth + 1;
            }
            const globalDepth = lastCriticalDepth + depth;

            const depthPos = getPos(
                depthIndex,
                Math.ceil(Math.sqrt(depthSize))
            );

            const node = this.addNode(
                depth,
                depthPos,
                type,
                roundNum,
                globalDepth
            );

            if (node.type === "critical") {
                this.lastCritical = node;
            }
            round[depth] = round[depth] || [];
            round[depth][depthIndex] = node;

            if (this.lastCritical && depth === 0) {
                node.parents.push(this.lastCritical);
                this.lastCritical.children.push(node);
            }

            const parentsLimit = node.type === "critical" ? depthSize : 2;
            let parentIndex = depthIndex;

            const { random } = uniqueRandomRange(0, depthSize);

            while (node.parents.length < parentsLimit) {
                const parent =
                    (round[depth - 1] || [])[parentIndex] ||
                    (round[depth - 2] || [])[parentIndex];

                if (parent && parent.type !== "rejected") {
                    if (
                        node.type === "critical" ||
                        parent.type === "critical" ||
                        !node.parents.length
                    ) {
                        parent.children.push(node);
                        node.parents.push(parent);
                    }
                }

                parentIndex = random();

                if (typeof parentIndex === "undefined") {
                    break;
                }
            }
        };

        for (let index = 0; index < numTx; index++) {
            createNode(index, typeMap[index] || "accepted");
        }

        createNode(numTx, "critical");

        this.rounds[roundNum] = numTx;

        console.log("Nodes #", this.nodes.length);
        this.notifySubscribers(this.nodes);
    };

    private resetNodeIds() {
        let counter = 0;
        this.nodes.forEach((node: INode) => (node.id = counter++));
    }

    private pruneRound = (roundNum: number, numTx: number) => {
        if (typeof this.rounds[roundNum] === "undefined") {
            return;
        }

        numTx = this.rounds[roundNum];
        console.log("Prunning round", { roundNum, numTx });

        delete this.rounds[roundNum];
        this.nodes.splice(0, numTx);
        console.log("Nodes after prunning #", this.nodes.length);
        this.resetNodeIds();
    };
}
