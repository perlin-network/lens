import { Perlin } from "../../Perlin";
import { action, IObservableArray, observable } from "mobx";
const perlin = Perlin.getInstance();

const randomRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

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

            return node;
        };

        const getRandomDepth = () => {
            let depth;

            // make sure all depths are populated
            do {
                depth = randomRange(0, maxDepth - 1);
            } while (round[depth] && round.filter(item => !item).length);

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

        addNode(maxDepth, "critical");

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
                    while (count < parentsCount) {
                        const parentIndex = randomRange(0, parents.length - 1);

                        if (node.parents.indexOf(parents[parentIndex]) === -1) {
                            count++;
                            node.parents.push(parents[parentIndex]);
                            parents[parentIndex].children.push(node);
                        }
                    }
                });
            }

            return allParents;
        });

        this.rounds[roundNum] = round;
        // console.log("rounds", this.rounds);
        this.calculateNodes();
        this.notifySubscribers(this.nodes);
    };
    private calculateNodes() {
        let counter = 0;
        const nodes = Object.values(this.rounds).reduce(
            (acc: INode[], depth: any) => {
                const depthNodes = depth.flat(1);
                depthNodes.forEach((node: INode) => (node.id = counter++));

                acc.push(...depthNodes);
                return acc;
            },
            []
        );
        this.nodes = nodes as INode[];
    }

    private pruneRound = (roundNum: number) => {
        console.log("Prunning round", { roundNum });
        if (this.rounds[roundNum + 1]) {
            this.rounds[roundNum + 1][0].forEach(
                (node: INode) => (node.parents = [])
            );
        }
        delete this.rounds[roundNum];
        this.calculateNodes();
        // console.log("rounds", this.rounds);
        this.notifySubscribers(this.nodes);
    };
}
