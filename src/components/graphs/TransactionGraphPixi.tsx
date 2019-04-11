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
import { withRouter, RouteComponentProps } from "react-router-dom";
import { getTransactionGraphNodeLimit } from "../../storage";

const perlin = Perlin.getInstance();

const transTooltip = {
    text: "",
    title: "",
    x: 0,
    y: 0,
    visible: false,
    status: ""
};

const nodeLimit: number = getTransactionGraphNodeLimit();

const Wrapper = styled.div`
    position: relative;

    .graph-container {
        width: 100%;
        height: 300px;
        margin-bottom: 0;
    }
`;
interface ITGraphProps extends RouteComponentProps {
    size: any;
}
class TGraph extends React.Component<ITGraphProps, {}> {
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

        const isNodeInViewport = (node: any, offset = 30) => {
            const scale = stage.scale.x;

            if (simulation.alpha() > 2) {
                return false;
            }

            const leftBound = (0 - stage.x - offset) / scale;
            const topBound = (0 - stage.y - offset) / scale;
            const rightBound = (width - stage.x + offset) / scale;
            const bottomBound = (height - stage.y + offset) / scale;

            return (
                node.x >= leftBound &&
                node.y >= topBound &&
                node.x <= rightBound &&
                node.y <= bottomBound
            );
        };
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
                render();
            })
        );

        const simulation = d3
            .forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links).id((d: any) => d.id))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force(
                "charge",
                d3
                    .forceManyBody()
                    .distanceMax(100)
                    .strength(-2000)
            )
            // .force("collision", d3.forceCollide().radius(0.1))
            // .force("x", d3.forceX())
            // .force("y", d3.forceY())
            .alphaDecay(0.1)
            .alphaTarget(0);

        const render = () => {
            this.nodes.forEach(node => {
                const { x, y, gfx } = node;
                gfx.position = new PIXI.Point(x, y);

                const offset = 22 * (stage.scale.x * (stage.scale.x * 0.3));
                gfx.visible = isNodeInViewport(gfx.position, offset);
            });

            links.clear();

            this.links
                .filter(({ source, target }) => {
                    // increase the in view offset at closer zooms to avoid link clipping which have both end outside the view
                    const offset = 100 * (stage.scale.x * stage.scale.x);
                    return (
                        isNodeInViewport(source, offset) ||
                        isNodeInViewport(target, offset)
                    );
                })
                .forEach(link => {
                    const { source, target } = link;
                    links.lineStyle(1, 0x4038bd);
                    links.moveTo(source.x, source.y);

                    const { offsetX, offsetY } = getLineOffset(source, target);
                    links.quadraticCurveTo(
                        offsetX,
                        offsetY,
                        target.x,
                        target.y
                    );
                });

            links.endFill();
            this.renderer.render(stage);
        };

        const update = (alpha = 2.5) => {
            simulation.nodes(this.nodes).on("tick", render);

            // @ts-ignore
            simulation.force("link").links(this.links);

            simulation.alpha(alpha).restart();
            console.log("Transaction Graph nodes #", this.nodes.length);
        };

        const mouseHandleUpdate = () => {
            render();
            this.forceUpdate();
        };

        when(
            () => perlin.transactions.recent.length > 0,
            () => {
                const recent = perlin.transactions.recent.slice(0, nodeLimit);

                recent.forEach((tx: ITransaction, index: number) => {
                    const node = getInteractiveNode(
                        tx,
                        mouseHandleUpdate,
                        this.props
                    );
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
        const pruneNodes = (numTx: number, noUpdate = false) => {
            const popped: any = this.nodes.splice(0, numTx);
            popped.forEach((node: any) => {
                node.gfx.destroy();
                this.store.delete(node.id);
            });

            this.links = this.links.filter(
                l =>
                    !popped.find(
                        (node: any) =>
                            node.id === l.source.id || node.id === l.target.id
                    )
            );

            if (!noUpdate) {
                update(3);
            }
        };

        // perlin.onTransactionsRemoved will be used when prunning from server
        perlin.onTransactionsRemoved = (numTx: number) => {
            // there's no need to prune the graph node if they've already capped to nodeLimit
            if (perlin.transactions.recent.length < nodeLimit) {
                pruneNodes(
                    this.nodes.length - perlin.transactions.recent.length
                );
            }
        };

        perlin.onTransactionsCreated = (txs: ITransaction[]) => {
            // graph node should be capped to nodeLimit;
            const nextLength = this.nodes.length + txs.length;

            if (nextLength > nodeLimit) {
                const pruneLength = nextLength - nodeLimit;
                pruneNodes(pruneLength, true);
            }

            txs.slice(-nodeLimit).forEach((tx: ITransaction) => {
                const node = getInteractiveNode(
                    tx,
                    mouseHandleUpdate,
                    this.props
                );
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
            });

            update(3);
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

function getLineOffset(source: any, target: any) {
    const midpointX = (source.x + target.x) / 2;
    const midpointY = (source.y + target.y) / 2;

    const dx = target.x - source.x;
    const dy = target.y - source.y;

    const normalise = Math.sqrt(dx * dx + dy * dy);

    const offset = normalise * 0.2;
    const offsetX = midpointX + offset * (dy / normalise);
    const offsetY = midpointY - offset * (dx / normalise);

    return { offsetX, offsetY };
}

function getInteractiveNode(
    tx: ITransaction,
    mouseUpdate: () => void,
    props: ITGraphProps
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

            const circle = new PIXI.Graphics();
            const glow = new PIXI.Graphics();

            glow.beginFill(0x3326ff);
            glow.drawCircle(0, 0, nodeSize);
            glow.filters = [new PIXI.filters.BlurFilter(nodeSize * scale)];

            node.gfx.addChild(glow);
            node.gfx.addChild(circle);

            circle.beginFill(0x4a41d1);
            circle.lineStyle(1, 0xffffff);
            circle.drawCircle(0, 0, nodeSize);

            transTooltip.x = transformedX;
            transTooltip.y = transformedY - (node.gfx.height / 2) * scale;

            transTooltip.title = "Transaction";
            transTooltip.text = node.payload + " PERLs";
            transTooltip.visible = true;
            transTooltip.status = tx.status;

            mouseUpdate();
        });

        node.gfx.on("click", () => {
            console.log("TODO: go to transaction page");
            props.history.push("/transactions/" + node.id);
        });

        // on node mouseout
        node.gfx.on("mouseout", () => {
            node.gfx.removeChildren();
            node.gfx.clear();

            node.gfx.lineStyle(1, 0x0c122b);
            node.gfx.beginFill(0x4a41d1);
            node.gfx.drawCircle(0, 0, nodeSize);

            transTooltip.visible = false;
            mouseUpdate();
        });
    }

    return node;
}

// TODO: allocate node sizes based on the overall payload distribution, updated with every added transaction
function getNodeSize(payload: number): number {
    return Math.log(payload) + 6;
}

const TransactionGraphPixi = withSize()(withRouter<ITGraphProps>(TGraph));

export { TransactionGraphPixi };
