import { Perlin } from "../../Perlin";
const perlin = Perlin.getInstance();

const randomRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
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
        const nodes: INode[] = [];

        const addNode = (depth: number, type: string) => {
            const node: INode = {
                id: 0,
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

            nodes.push(node);
            return node;
        };

        const { info, random } = uniqueRandomRange(0, maxDepth);
        const getRandomDepth = () => {
            let depth;

            // make sure all depths are populated
            depth = random() || randomRange(0, maxDepth);

            // const {depth, extracted, done} = uniqueRandomRange(0, maxDepth - 1);
            return depth;
        };

        for (let count = 0; count < accepted - 1; count++) {
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
            const parentRound = this.rounds[roundNum - 1];
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

                    const globalDepth =
                        ((parentLastRound[0] &&
                            parentLastRound[0].globalDepth) ||
                            0) +
                        node.depth +
                        1;
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
                        count++;
                        node.parents.push(parents[parentIndex]);
                        parents[parentIndex].children.push(node);
                    }
                });
            }

            return allParents;
        });

        this.rounds[roundNum] = round;
        this.nodes.push(...nodes);
        // console.log("rounds", this.rounds);
        this.calculateNodes();
        console.log(this.nodes);
        this.notifySubscribers(this.nodes);
    };
    private calculateNodes() {
        let counter = 0;
        // const nodes = Object.values(this.rounds).reduce(
        //     (acc: INode[], depth: any) => {
        //         const depthNodes = depth.flat(1);
        //         acc.push(...depthNodes);
        //         return acc;
        //     },
        //     []
        // ) as INode[];

        this.nodes.forEach((node: INode) => (node.id = counter++));

        // this.nodes = nodes;
    }

    private pruneRound = (roundNum: number, numTx: number) => {
        if (!this.rounds[roundNum]) {
            return;
        }
        console.log("Prunning round", { roundNum });
        // if (this.rounds[roundNum + 1]) {
        //     this.rounds[roundNum + 1][0].forEach(
        //         (node: INode) => (node.parents = [])
        //     );
        // }
        numTx = this.rounds[roundNum].flat(2).length;
        delete this.rounds[roundNum];
        this.nodes.splice(0, numTx);
        this.calculateNodes();
        console.log(this.nodes);
        // console.log("rounds", this.rounds);
        this.notifySubscribers(this.nodes);
    };
}
