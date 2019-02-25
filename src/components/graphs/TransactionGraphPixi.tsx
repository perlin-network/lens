import * as React from "react";
import { createRef } from "react";
import { Perlin } from "../../Perlin";
// @ts-ignore
import * as sizeMe from "react-sizeme";
import * as PIXI from "pixi.js";
import * as d3 from "d3";
import { when } from "mobx";
import { ITransaction } from "../../Transaction";

const perlin = Perlin.getInstance();

const trans_tooltip = new PIXI.Text("", {
    fontFamily: "Montserrat,HKGrotesk,Roboto",
    fontSize: 12,
    fill: "white",
    align: "left"
});
trans_tooltip.text = "Transaction:";
var trans_tooltip_amount = new PIXI.Text("", {
    fontFamily: "Montserrat,HKGrotesk,Roboto",
    fontSize: 16,
    fill: "white",
    align: "left"
});

class Graph extends React.Component<{ size: any }, {}> {
    private networkGraphRef: React.RefObject<any> = createRef();

    private renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;

    private store: Map<string, number> = new Map([]);
    private nodes: any[] = [];
    private links: any[] = [];

    public updateDimensions() {
        if (this.renderer != null) {
            const parent = this.renderer.view.parentNode;

            // @ts-ignore
            this.renderer.resize(parent.clientWidth, parent.clientHeight);
        }
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions.bind(this));
    }

    public componentDidMount() {
        window.addEventListener("resize", this.updateDimensions.bind(this));

        const width = this.props.size.width;
        const height = this.props.size.height || 400;

        const stage = new PIXI.Container();
        this.renderer = PIXI.autoDetectRenderer({
            width,
            height,
            transparent: true,
            antialias: true
        });

        const links = new PIXI.Graphics();
        stage.addChild(links);

        this.networkGraphRef.current.appendChild(this.renderer.view);

        d3.select(this.renderer.view).call(
            d3.zoom().on("zoom", () => {
                stage.scale.set(d3.event.transform.k);
                stage.position.set(d3.event.transform.x, d3.event.transform.y);
            })
        );

        const simulation = d3
            .forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links).id((d: any) => d.id))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("charge", d3.forceManyBody().strength(-100))
            .force("collision", d3.forceCollide().radius(3))
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .alphaTarget(1);

        const render = () => {
            this.nodes.forEach(node => {
                const { x, y, gfx } = node;
                gfx.position = new PIXI.Point(x, y);
            });

            links.clear();
            links.alpha = 0.6;

            this.links.forEach(link => {
                const { source, target } = link;

                links.lineStyle(3, 0x57305e);
                links.moveTo(source.x, source.y);
                links.lineTo(target.x, target.y);
            });

            links.endFill();
            this.renderer.render(stage);
        };

        const update = () => {
            simulation.nodes(this.nodes).on("tick", render);

            // @ts-ignore
            simulation.force("link").links(this.links);

            simulation.alpha(1).restart();
        };

        when(
            () => perlin.transactions.recent.length > 0,
            () => {
                const recent = perlin.transactions.recent;
                stage.addChild(trans_tooltip);
                stage.addChild(trans_tooltip_amount);

                recent.forEach((tx: ITransaction, index: number) => {
                    const node = getInteractiveNode(tx);
                    stage.addChild(node.gfx);
                    this.nodes.push(node);
                    this.store.set(tx.id, index);
                });

                recent.forEach((tx: ITransaction) => {
                    if (tx.parents != null) {
                        tx.parents.forEach(parent => {
                            if (this.store.get(parent) !== undefined) {
                                this.links.push({
                                    source: parent,
                                    target: tx.id
                                });
                            }
                        });
                    }
                });

                update();
            }
        );

        perlin.onPolledTransaction = (tx: ITransaction) => {
            if (this.nodes.length === 50) {
                const popped: any = this.nodes.shift();
                popped.gfx.destroy();

                this.links = this.links.filter(
                    l => l.source.id !== popped.id && l.target.id !== popped.id
                );
            }
            const node = getInteractiveNode(tx);
            stage.addChild(node.gfx);
            this.nodes.push(node);
            this.store.set(tx.id, 1);

            if (tx.parents != null) {
                tx.parents.forEach(parent => {
                    if (this.store.get(parent) !== undefined) {
                        this.links.push({
                            source: parent,
                            target: tx.id
                        });
                    }
                });
            }

            update();
        };
    }

    public render() {
        return (
            <div
                style={{ width: "100%", height: 400, marginBottom: 0 }}
                ref={this.networkGraphRef}
            />
        );
    }
}

function getInteractiveNode(tx: ITransaction) {
    const node = {
        id: tx.id,
        payload: tx.payload.amount,
        gfx: new PIXI.Graphics()
    };

    var node_size = node.payload == undefined ? 1 : get_node_size(node.payload);
    node.gfx.lineStyle(1, 0xffffff);
    node.gfx.beginFill(0x7667cb);
    node.gfx.drawCircle(0, 0, node_size);

    if (node.payload != undefined) {
        node.gfx.interactive = true;
        node.gfx.buttonMode = true;
        node.gfx.hitArea = new PIXI.Circle(0, 0, node_size);

        //on node mouseover
        node.gfx.on("mouseover", function() {
            node.gfx.lineStyle(5, 0xffffff);
            node.gfx.drawCircle(0, 0, node_size);

            trans_tooltip_amount.text = node.payload + " PERLs";
            trans_tooltip_amount.x = node.gfx.x + (node_size + 15);
            trans_tooltip_amount.y = node.gfx.y;

            trans_tooltip.x = node.gfx.x + (node_size + 15);
            trans_tooltip.y = node.gfx.y - 15;

            trans_tooltip.visible = true;
            trans_tooltip_amount.visible = true;
        });

        //on node mouseout
        node.gfx.on("mouseout", function() {
            node.gfx.lineStyle(0, 0xffffff);
            node.gfx.drawCircle(0, 0, node_size);
            trans_tooltip.visible = false;
            trans_tooltip_amount.visible = false;
        });
    }

    return node;
}

// TODO: allocate node sizes based on the overall payload distribution, updated with every added transaction
function get_node_size(payload: number): number {
    return Math.log(payload) + 5;
}

const TransactionGraphPixi = sizeMe()(Graph);

export { TransactionGraphPixi };
