import * as React from "react";
import {createRef} from "react";
import * as d3 from "d3";
import {Perlin} from "./Perlin";
import {when} from "mobx";

interface ISimNode extends d3.SimulationNodeDatum {
    id: string;
}

class NetworkGraph extends React.Component<{ perlin: Perlin }, {}> {
    private networkGraphRef: React.RefObject<any> = createRef();

    public componentDidMount() {
        const svg = d3.select(this.networkGraphRef.current)
            .call(d3.zoom().on("zoom", () => networkGraph.attr("transform", d3.event.transform)));

        const networkGraph = svg.append("g");

        networkGraph.append('defs').append('marker')
            .attr('id', "arrowhead")
            .attr("viewBox", "-0 -3 6 6")
            .attr("refX", 4)
            .attr("refY", 0)
            .attr("orient", "auto")
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("xoverflow", "visible")
            .append('svg:path')
            .attr('d', 'M 0,-1 L 2 ,0 L 0,1')
            .attr('fill', '#999')
            .style('stroke', 'none');

        const width = +svg.attr("width");
        const height = +svg.attr("height");

        const simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id((d: any) => d.id).distance(50).strength(1))
            .force("collide", d3.forceCollide(4.5).iterations(4.5))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("charge", d3.forceManyBody().strength(-120))
            .force("gravity", d3.forceManyBody().strength(30))
            .force("x", d3.forceX(width / 2))
            .force("y", d3.forceY(height / 2));


        when(
            () => this.props.perlin.ledger.address.length > 0,
            () => {
                const self = this.props.perlin.ledger.address;

                // Prepare data.
                const peers = this.props.perlin.ledger.peers.slice();

                const nodes: ISimNode[] = [];
                const links: Array<d3.SimulationLinkDatum<ISimNode>> = [];

                nodes.push({id: self});
                peers.forEach(peer => nodes.push({id: peer}));

                nodes.forEach((x: ISimNode) => {
                    nodes.forEach((y: ISimNode) => {
                        if (x.id !== y.id) {
                            links.push({source: x.id, target: y.id});
                        }
                    })
                });


                simulation.nodes(nodes);
                simulation
                    .force<d3.ForceLink<ISimNode, d3.SimulationLinkDatum<ISimNode>>>('link')!
                    .links(links);

                const link = networkGraph.selectAll(".link")
                    .data(links)
                    .enter()
                    .append("line")
                    .attr("class", "link")
                    .attr('marker-end', 'url(#arrowhead)');

                const node = networkGraph.selectAll(".node")
                    .data(nodes)
                    .enter()
                    .append("g")
                    .attr("class", "node");

                const circle = node.append("circle")
                    .attr("r", 4.5);

                const label = node.append("text")
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
                        .attr("cy", (d: any) => d.y)
                        // @ts-ignore
                        .call(this.drag());

                    label
                        .attr("x", (d: any) => d.x + 8)
                        .attr("y", (d: any) => d.y);
                });

            }
        );
    }

    public render() {
        return <svg width={640} height={360} ref={this.networkGraphRef}/>;
    }

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

export {NetworkGraph};