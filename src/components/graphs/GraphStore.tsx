import { Perlin } from "../../Perlin";
import { action, IObservableArray, observable } from "mobx";
const perlin = Perlin.getInstance();

interface INode {
    id: number;
    depth: number;
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
    @observable public links: any = {};

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
        const nodes: INode[] = [];
        const level: INode[][] = Array(maxDepth).fill(undefined);

        for (let count = 0; count < accepted + rejected; count++) {
            let depth;

            // make sure all depths are populated
            do {
                depth = Math.floor(Math.random() * maxDepth);
            } while (level[depth] && level.filter(item => !item).length);

            const node: INode = {
                id: count,
                depth,
                parents: []
            };
            level[depth] = level[depth] || [];
            level[depth].push(node);
        }

        level
            .slice()
            .reverse()
            .reduce((parents, curr) => {
                curr.forEach((node: INode) => {
                    const parentsCount = Math.floor(
                        Math.random() * parents.length
                    );

                    node.parents = parents
                        .slice()
                        .sort(() => 0.5 - Math.random())
                        .slice(0, parentsCount);
                });
                return parents;
            });

        this.levels[round] = level;
    };

    @action
    private pruneLevel = (round: number) => {
        // this.levels[round] = undefined;
        delete this.levels[round];
    };
}
