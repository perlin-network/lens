import * as React from "react";
import { createRef } from "react";
import { Perlin } from "../../Perlin";
// @ts-ignore
import { withSize } from "react-sizeme";
import * as PIXI from "pixi.js";
import * as d3 from "d3";
import { when } from "mobx";
import { ITransaction } from "../../types/Transaction";
import styled from "styled-components";
import Tooltip from "./Tooltip";

const perlin = Perlin.getInstance();

const transTooltip = {
    text: "",
    title: "",
    x: 0,
    y: 0,
    visible: false,
    status: ""
};

const Wrapper = styled.div`
    position: relative;

    .graph-container {
        width: 100%;
        height: 300px;
        margin-bottom: 0;
    }
`;

class TGraph extends React.Component<{ size: any }, {}> {
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
        const height = this.props.size.height || 300;

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
            .force("charge", d3.forceManyBody().strength(-50))
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

            this.links.forEach(link => {
                const { source, target } = link;
                links.lineStyle(1, 0x4038bd);
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

        const mouseHandleUpdate = (isMouseOver: boolean) => {
            if (isMouseOver) {
                render();
                simulation.stop();
            } else {
                simulation.restart();
            }
            this.forceUpdate();
        };

        when(
            () => perlin.transactions.recent.length > 0,
            () => {
                const recent = perlin.transactions.recent;

                recent.forEach((tx: ITransaction, index: number) => {
                    const node = getInteractiveNode(tx, mouseHandleUpdate);
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

        perlin.onTransactionCreated = (tx: ITransaction) => {
            if (this.nodes.length === 50) {
                const popped: any = this.nodes.shift();
                popped.gfx.destroy();

                this.links = this.links.filter(
                    l => l.source.id !== popped.id && l.target.id !== popped.id
                );
            }
            const node = getInteractiveNode(tx, mouseHandleUpdate);
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
            <Wrapper>
                <div className="graph-container" ref={this.networkGraphRef} />
                <Tooltip {...transTooltip} />
            </Wrapper>
        );
    }
}

function getInteractiveNode(
    tx: ITransaction,
    update: (isMouseOver: boolean) => void
) {
    const node = {
        id: tx.id,
        payload: tx.payload ? tx.payload.amount : undefined,
        gfx: new PIXI.Graphics()
    };

    const nodeSize = node.payload === undefined ? 6 : getNodeSize(node.payload);

    node.gfx.beginFill(0x4a41d1);
    node.gfx.lineStyle(1, 0x0c122b);
    node.gfx.drawCircle(0, 0, nodeSize);

    if (node.payload !== undefined) {
        node.gfx.interactive = true;
        node.gfx.buttonMode = true;
        node.gfx.hitArea = new PIXI.Circle(0, 0, nodeSize);

        // on node mouseover
        node.gfx.on("mouseover", () => {
            const {
                tx: transformedX,
                ty: transformedY
            } = node.gfx.transform.worldTransform;
            const { a: scale } = node.gfx.transform.worldTransform;

            node.gfx.lineStyle(1, 0xffffff);
            node.gfx.drawCircle(0, 0, nodeSize);

            transTooltip.x = transformedX;
            transTooltip.y = transformedY - (node.gfx.height / 2) * scale;

            transTooltip.title = "Transaction";
            transTooltip.text = node.payload + " PERLs";
            transTooltip.visible = true;
            transTooltip.status = tx.status;

            update(true);
        });

        // on node mouseout
        node.gfx.on("mouseout", () => {
            node.gfx.clear();
            node.gfx.lineStyle(1, 0x0c122b);
            node.gfx.beginFill(0x4a41d1);
            node.gfx.drawCircle(0, 0, nodeSize);

            transTooltip.visible = false;
            update(false);
        });
    }

    return node;
}

// TODO: allocate node sizes based on the overall payload distribution, updated with every added transaction
function getNodeSize(payload: number): number {
    return Math.log(payload) + 6;
}

const TransactionGraphPixi = withSize()(TGraph);

export { TransactionGraphPixi };
