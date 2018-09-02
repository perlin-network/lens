import * as React from "react";
import {createRef} from "react";
import * as d3 from "d3";
import {Perlin} from "./Perlin";
import {when} from "mobx";
import {ITransaction} from "./Transaction";
// @ts-ignore
import * as sizeMe from "react-sizeme";

class Graph extends React.Component<{ perlin: Perlin, size: any }, {}> {
    private networkGraphRef: React.RefObject<any> = createRef();
    private nodes: any[] = [];
    private nodeStore: Map<string, number> = new Map([]);
    private links: any[] = [];

    public componentDidMount() {
        const svg = d3.select(this.networkGraphRef.current)
            .call(d3.zoom().on("zoom", () => networkGraph.attr("transform", d3.event.transform)));

        const networkGraph = svg.append("g");


        const width = this.props.size.width;
        const height = this.props.size.height;

        const simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links).id((d: any) => d.id))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("charge", d3.forceManyBody().strength(-100))

        const drag = () => {
            const dragStarted = (d: any) => {
                if (!d3.event.active) {
                    simulation.alphaTarget(0.3).restart();
                }
                d.fx = d.x;
                d.fy = d.y;
            }

            const dragged = (d: any) => {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            }

            const dragEnded = (d: any) => {
                if (!d3.event.active) {
                    simulation.alphaTarget(0);
                }
                d.fx = null;
                d.fy = null;
            };

            return d3.drag()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded);
        }

        let link = networkGraph.append("g").selectAll(".link");
        let node = networkGraph.append("g").selectAll(".node");

        const update = () => {
            // Spawn vertices.
            node = node.data(this.nodes, (d: any) => d.id);
            node.exit().remove();

            const newNodes = node.enter();
            const newNodesGroup = newNodes
                .append("g")
                .attr("class", "node")


            newNodesGroup.append("text")
            newNodesGroup.append("circle");

            // @ts-ignore
            node = newNodesGroup.merge(node);

            const circle = node.selectAll("circle")
                .attr("r", 4.5)
                .call(drag());
            const label = node.selectAll("text")
                .attr("dy", "0.35em")
                .text((d: any) => `[${d.id.slice(0, 10)}]`);

            // Spawn edges.
            link = link.data(this.links);
            link.exit().remove();
            link = link.enter()
                .append("line")
                .attr("class", "link")
                .merge(link);

            requestAnimationFrame(function render() {
                simulation.tick();

                link
                    .attr("x1", (d: any) => d.source.x)
                    .attr("y1", (d: any) => d.source.y)
                    .attr("x2", (d: any) => d.target.x)
                    .attr("y2", (d: any) => d.target.y);

                circle
                    .attr("cx", (d: any) => d.x)
                    .attr("cy", (d: any) => d.y);

                label
                    .attr("x", (d: any) => d.x + 8)
                    .attr("y", (d: any) => d.y);

                if (simulation.alpha() > 0) {
                    requestAnimationFrame(render);
                }
            });

            simulation.nodes(this.nodes);
            // @ts-ignore
            simulation.force("link").links(this.links);

            simulation.restart();
        }

        when(
            () => this.props.perlin.transactions.recent.length > 0,
            () => {
                const recent = this.props.perlin.transactions.recent;

                recent.forEach((tx: ITransaction, index: number) => {
                    this.nodes.push({
                        id: tx.id,
                    });
                    this.nodeStore.set(tx.id, index)
                });

                recent.forEach((tx: ITransaction) => {
                    if (tx.parents != null) {
                        tx.parents.forEach(parent => {
                            if (this.nodeStore.get(parent) !== undefined) {
                                this.links.push(
                                    {
                                        source: parent,
                                        target: tx.id
                                    }
                                );
                            }
                        });
                    }
                })

                update();
            }
        );

        let buffer: any[] = [];

        this.props.perlin.onPolledTransaction = (tx: ITransaction) => buffer.push(tx)

        setInterval(() => {
            if (buffer.length > 0) {
                buffer.forEach((tx: ITransaction) => {
                    if (this.nodeStore.get(tx.id) === undefined) {
                        if (this.nodes.length === 50) {
                            const popped: any = this.nodes.shift();
                            this.links = this.links.filter(l => l.source.id !== popped.id && l.target.id !== popped.id);
                        }

                        this.nodes.push({id: tx.id});
                        this.nodeStore.set(tx.id, this.nodes.length - 1);

                        if (tx.parents != null) {
                            tx.parents.forEach(parent => {
                                if (this.nodeStore.get(parent) !== undefined) {
                                    this.links.push(
                                        {
                                            source: parent,
                                            target: tx.id,
                                        }
                                    );
                                }
                            });
                        }
                    }
                })

                update();

                buffer = [];
            }
        }, 250);
    }

    public render() {
        return (
            <svg width="100%" height={400} ref={this.networkGraphRef}/>
        );
    }
}

const TransactionGraphD3 = sizeMe()(Graph);

export {TransactionGraphD3}