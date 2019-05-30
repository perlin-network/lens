import { Perlin } from "../../Perlin";
import { action, IObservableArray, observable } from "mobx";
const perlin = Perlin.getInstance();

const randomRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
interface INode {
    id: number;
    depth: number;
    type: string;
    parents: INode[];
}
export class GraphStore {
    public static getInstance(): GraphStore {
        if (GraphStore.singleton === undefined) {
            GraphStore.singleton = new GraphStore();
        }
        return GraphStore.singleton;
    }

    private static singleton: GraphStore;
    @observable public levels: any = {};
    @observable public nodes: INode[] = [];

    constructor() {
        // @ts-ignore
        perlin.onConsensusRound = window.generateLevel = this.generateLevel;
        // @ts-ignore
        perlin.onConsensusPrune = window.pruneLevel = this.pruneLevel;
    }

    @action
    private generateLevel = (
        accepted: number,
        rejected: number,
        maxDepth: number,
        round: number
    ) => {
        if (maxDepth > accepted + rejected) {
            console.error(
                "Max depth cannot be larger than the number of nodes"
            );
        }
        // adjusted for 0 starting index
        maxDepth -= 1;

        if (round && !this.levels[round - 1]) {
            this.generateLevel(1, 0, 1, 0);
        }

        const nodes: INode[] = [];
        const level: INode[][] = Array(maxDepth).fill(undefined);

        const addNode = (
            id: number,
            depth: number,
            type: string,
            parents: INode[] = []
        ) => {
            const node: INode = {
                id: round * 10 + id,
                type,
                depth,
                parents
            };

            level[depth] = level[depth] || [];
            level[depth].push(node);
            nodes.push(node);
            return node;
        };

        const getRandomDepth = () => {
            let depth;

            // make sure all depths are populated
            do {
                depth = randomRange(0, maxDepth - 1);
            } while (level[depth] && level.filter(item => !item).length);

            return depth;
        };

        for (let count = 1; count < accepted - 1; count++) {
            const depth = getRandomDepth();
            addNode(count, depth, "accepted");
        }

        for (let count = 0; count < rejected; count++) {
            const depth = getRandomDepth();
            addNode(count, depth, "rejected");
        }

        addNode(accepted + rejected, maxDepth, "critical");

        let parentLastLevel = [];
        if (this.levels[round - 1]) {
            parentLastLevel = this.levels[round - 1][
                this.levels[round - 1].length - 1
            ];
        }

        [parentLastLevel, ...level].reverse().reduce((curr, parents, index) => {
            curr.forEach((node: INode) => {
                const parentsCount = randomRange(1, parents.length);

                node.parents = parents
                    .filter((item: INode) => item.type !== "rejected")
                    .sort(() => 0.5 - Math.random())
                    .slice(0, parentsCount);
            });
            return parents;
        });

        this.levels[round] = level;
        this.nodes.push(...nodes);
    };

    @action
    private pruneLevel = (round: number) => {
        if (this.levels[round + 1]) {
            this.levels[round + 1][0].forEach(
                (node: INode) => (node.parents = [])
            );
        }
        delete this.levels[round];
    };
}
