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
    const extracted: number[] = [];
    const info = {
        done: false,
        extracted
    };
    const random = () => {
        let value: number;

        while (!info.done) {
            value = randomRange(min, max);
            if (extracted.indexOf(value) === -1) {
                extracted.push(value);
                break;
            }
        }

        info.done = extracted.length > max - min;
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
    offset(index % width, width),
    offset(Math.floor(index / width), width)
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

    private addRound = (
        accepted: number,
        rejected: number,
        maxDepth: number,
        roundNum: number
    ) => {
        console.log("Adding round", { accepted, rejected, maxDepth, roundNum });
        if (maxDepth > accepted + rejected) {
            console.error(
                "Max depth cannot be larger than the number of nodes"
            );
        }
        // adjusted for 0 starting index
        maxDepth -= 1;

        const round: INode[][] = Array(maxDepth).fill(undefined);
        let nodeIndex = this.nodes.length;
        let numTx = 0;

        const addNode = (depth: number, type: string) => {
            const node: INode = {
                id: nodeIndex++,
                type,
                depth,
                round: roundNum,
                globalDepth: 0,
                depthPos: [0, 0],
                parents: [],
                children: []
            };

            round[depth] = round[depth] || [];
            round[depth].push(node);
            numTx++;

            this.nodes.push(node);
            return node;
        };

        const { info, random } = uniqueRandomRange(0, maxDepth);
        const getRandomDepth = () => {
            let depth;

            // make sure all depths are populated
            depth = random();
            if (typeof depth === "undefined") {
                depth = randomRange(0, maxDepth);
            }
            return depth;
        };

        for (let count = 0; count < accepted; count++) {
            const depth = getRandomDepth();
            addNode(depth, "accepted");
        }

        for (let count = 0; count < rejected; count++) {
            const depth = getRandomDepth();
            addNode(depth, "rejected");
        }

        addNode(maxDepth + 1, "critical");

        let parentLastRound: INode[] = [];
        if (this.rounds[roundNum - 1]) {
            const parentRound = this.rounds[roundNum - 1].round;
            parentLastRound = parentRound[parentRound.length - 1];
        }

        [parentLastRound, ...round].reverse().reduce((curr, allParents) => {
            const parents = allParents.filter(
                (item: INode) => item.type !== "rejected"
            );
            if (parents.length) {
                curr.forEach((node: INode, index) => {
                    const parentsCount = Math.min(
                        Math.ceil(randomRange(1, parents.length) * 0.33),
                        5
                    );
                    const parentCritical = parentLastRound[0];
                    const globalDepth =
                        ((parentCritical && parentCritical.globalDepth) || 0) +
                        node.depth;
                    node.globalDepth = globalDepth;
                    node.depthPos = getPos(
                        index,
                        Math.ceil(Math.sqrt(curr.length))
                    );

                    let count = 0;
                    const { random: uniqueRandom } = uniqueRandomRange(
                        0,
                        parents.length - 1
                    );

                    while (count < parentsCount) {
                        const parentIndex = uniqueRandom();
                        const parent = parents[parentIndex];
                        count++;
                        node.parents.push(parent);
                        parent.children.push(node);
                    }
                });
            }

            return allParents;
        });

        this.rounds[roundNum] = {
            round,
            numTx
        };

        console.log("Nodes #", this.nodes.length);
        this.notifySubscribers(this.nodes);
    };
    private calculateNodes() {
        let counter = 0;

        this.nodes.forEach((node: INode) => (node.id = counter++));
    }

    private pruneRound = (roundNum: number, numTx: number) => {
        if (!this.rounds[roundNum]) {
            return;
        }

        numTx = this.rounds[roundNum].numTx;
        console.log("Prunning round", { roundNum, numTx });

        delete this.rounds[roundNum];
        this.nodes.splice(0, numTx);
        console.log("Nodes #", this.nodes.length);
        this.calculateNodes();
    };
}
