import * as React from "react";
import {createRef} from "react";
import * as d3 from "d3";
import {Perlin} from "./Perlin";
import {when} from "mobx";
import {ITransaction} from "./Transaction";
import * as _ from "lodash";

interface ISimNode extends d3.SimulationNodeDatum {
    id: string;
}

class TransactionGraph extends React.Component<{ perlin: Perlin }, {}> {
    private networkGraphRef: React.RefObject<any> = createRef();
    private nodes: ISimNode[] = [];
    private links: Array<d3.SimulationLinkDatum<ISimNode>> = [];

    public componentDidMount() {
        const svg = d3.select(this.networkGraphRef.current)
            .call(d3.zoom().on("zoom", () => networkGraph.attr("transform", d3.event.transform)));

        const networkGraph = svg.append("g");

        const width = +svg.attr("width");
        const height = +svg.attr("height");

        const simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links).id((d: any) => d.id).distance(50).strength(1))
            .force("collide", d3.forceCollide(4.5).iterations(4.5))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("charge", d3.forceManyBody().strength(-120))
            .force("gravity", d3.forceManyBody().strength(30))
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .alphaTarget(1);

        let link = networkGraph.append("g").selectAll(".link");
        let node = networkGraph.append("g").selectAll(".node");

        const update = () => {
            // Spawn vertices.
            node = node.data(this.nodes, (d: any) => d.id);
            node.exit().remove();

            const newNodes = node.enter();
            const newNodesGroup = newNodes
                .append("g")
                .attr("class", "node");

            newNodesGroup.append("text")
            newNodesGroup.append("circle");

            // @ts-ignore
            node = newNodes.merge(node);

            // Spawn edges.
            link = link.data(this.links, (d: any) => `${d.source} ${d.target}`);
            link.exit().remove();
            link = link.enter()
                .append("line")
                .attr("class", "link")
                .merge(link);

            const circle = node.selectAll("circle")
                .attr("r", 4.5)
                .call(this.drag(simulation));
            const label = node.selectAll("text")
                .attr("dy", "0.35em")
                .text((d: any) => d.id);

            simulation.on("tick", () => {
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
            });

            simulation.nodes(this.nodes);
            simulation
                .force<d3.ForceLink<ISimNode, d3.SimulationLinkDatum<ISimNode>>>('link')!
                .links(this.links);
            simulation.alpha(1).restart();
        }

        when(
            () => this.props.perlin.transactions.recent.length > 0,
            () => {
                const recent = this.props.perlin.transactions.recent;

                recent.forEach((tx: ITransaction) => {
                    this.nodes.push({
                        id: tx.id,
                    });
                });

                recent.forEach((tx: ITransaction) => {
                    if (tx.parents != null) {
                        tx.parents.forEach(parent => {
                            if (_.some(this.nodes, {id: parent})) {
                                this.links.push({source: parent, target: tx.id});
                            }
                        });
                    }
                })

                update();
            }
        );

        this.props.perlin.onPolledTransaction = (tx: ITransaction) => {
            if (!_.some(this.nodes, {id: tx.id})) {
                // if (this.nodes.length === 50) {
                //     const popped: any = this.nodes.shift()
                //
                //     const indices: any[] = [];
                //     this.links.forEach((d, index) => {
                //         if (d.source === popped.id || d.target === popped.id) {
                //             indices.push(index);
                //         }
                //     })
                //
                //     indices.forEach(i => this.links.splice(i, 1));
                // }


                this.nodes.push({id: tx.id});

                if (tx.parents != null) {
                    tx.parents.forEach(parent => {
                        if (_.some(this.nodes, {id: parent})) {
                            this.links.push({source: parent, target: tx.id});
                        }
                    });
                }

                update();
            }
        }
    }

    public render() {
        return <svg width={1000} height={500} ref={this.networkGraphRef}/>;
    }

    // @ts-ignore
    private drag(simulation: any) {
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
}

export {TransactionGraph};