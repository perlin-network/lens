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

        // const drag = () => {
        //     const dragStarted = () => {
        //         if (!d3.event.active) {
        //             simulation.alphaTarget(0.3).restart();
        //         }
        //         d3.event.subject.fx = d3.event.subject.x;
        //         d3.event.subject.fy = d3.event.subject.y;
        //     }
        //
        //     const dragged = () => {
        //         d3.event.subject.fx = d3.event.x;
        //         d3.event.subject.fy = d3.event.y;
        //     }
        //
        //     const dragEnded = () => {
        //         if (!d3.event.active) {
        //             simulation.alphaTarget(0);
        //         }
        //         d3.event.subject.fx = null;
        //         d3.event.subject.fy = null;
        //     };
        //
        //     return d3.drag()
        //         .container(renderer.view)
        //         .subject(() => simulation.find(d3.event.x, d3.event.y))
        //         .on("start", dragStarted)
        //         .on("drag", dragged)
        //         .on("end", dragEnded);
        // }

        d3.select(this.renderer.view).call(
            d3.zoom().on("zoom", () => {
                stage.scale.set(d3.event.transform.k);
                stage.position.set(d3.event.transform.x, d3.event.transform.y);
            })
        );
        // .call(drag())

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

                links.lineStyle(1, 0x999999);
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

                recent.forEach((tx: ITransaction, index: number) => {
                    const node = { id: tx.id, gfx: new PIXI.Graphics() };

                    node.gfx.lineStyle(1.5, 0xffffff);
                    node.gfx.beginFill(0xffffffff);
                    node.gfx.drawCircle(0, 0, 3);
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

            const node = { id: tx.id, gfx: new PIXI.Graphics() };

            node.gfx.lineStyle(1.5, 0xffffff);
            node.gfx.beginFill(0xffffff);
            node.gfx.drawCircle(0, 0, 3);
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

const TransactionGraphPixi = sizeMe()(Graph);

export { TransactionGraphPixi };
