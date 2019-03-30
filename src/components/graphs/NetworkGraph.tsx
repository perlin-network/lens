import { Perlin } from "../../Perlin";
import * as PIXI from "pixi.js";
import * as d3 from "d3";
import { withSize } from "react-sizeme";
import * as React from "react";
import { createRef } from "react";
import { when } from "mobx";

const perlin = Perlin.getInstance();
const networkTooltip = new PIXI.Text("", {
    fontFamily: "Montserrat,HKGrotesk,Roboto",
    fontSize: 12,
    fill: "white",
    align: "left"
});

class NGraph extends React.Component<{ size: any }, {}> {
    private networkGraphRef: React.RefObject<any> = createRef();
    private renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;

    private peerMap: Map<string, any[]> = new Map([]);
    private nodes: any[] = [];
    private edges: any[] = [];

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
            .force(
                "link",
                d3.forceLink(this.edges).id((d: any) => d.id)
                //            .distance(100)
            )
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("collide", d3.forceCollide().radius(3))
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
            this.edges.forEach(link => {
                const { source, target } = link;
                links.lineStyle(3, 0x4a41d1);
                links.moveTo(source.x, source.y);
                links.lineTo(target.x, target.y);
            });

            links.endFill();
            this.renderer.render(stage);
        };

        const update = () => {
            simulation.nodes(this.nodes).on("tick", render);
            // @ts-ignore
            simulation.force("link").links(this.edges);
            simulation.alpha(1).restart();
        };

        when(
            () => perlin.ledger.address.length > 0,
            () => {
                stage.addChild(networkTooltip);

                // Add nodes
                const self = perlin.ledger.address;
                if (self.length === 0) {
                    return;
                }
                const node = getInteractiveNode(perlin.ledger.address);
                this.nodes.push(node);
                stage.addChild(node.gfx);

                // Check peers
                let peers = perlin.ledger.peers;
                if (peers == null || peers.length === 0) {
                    return;
                }
                peers = peers.slice();
                peers.forEach(peer => {
                    if (node.id !== peer) {
                        this.edges.push({ source: node.id, target: peer });
                    }
                });
                this.peerMap.set(
                    node.id,
                    peers.map(peer => {
                        return { id: peer, label: peer };
                    })
                );

                // If peer node doesn't already exist, make a new node and link it
                peers.forEach(peer => {
                    if (this.peerMap.get(peer) === undefined) {
                        const peerNode = getInteractiveNode(peer);
                        this.nodes.push(peerNode);
                        stage.addChild(peerNode.gfx);

                        // Add the temporary peer node to the map
                        this.peerMap.set(peer, [
                            {
                                id: node.id,
                                label: node.id
                            }
                        ]);

                        // Add edges
                        this.edges.push({ source: peer, target: node.id });
                    }
                });

                update();
            }
        );
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

function getInteractiveNode(self: string) {
    const node = {
        id: self,
        label: self,
        gfx: new PIXI.Graphics()
    };
    const nodeSize = 10;
    node.gfx.beginFill(0x4a41d1);
    node.gfx.lineStyle(1, 0x4a41d1);
    node.gfx.drawCircle(0, 0, nodeSize);
    node.gfx.interactive = true;
    node.gfx.buttonMode = true;
    node.gfx.hitArea = new PIXI.Circle(0, 0, nodeSize);

    // on node mouseover
    node.gfx.on("mouseover", () => {
        node.gfx.lineStyle(2, 0xffffff, 1);
        node.gfx.drawCircle(0, 0, nodeSize);
        networkTooltip.text = self;
        networkTooltip.x = node.gfx.x + 20;
        networkTooltip.y = node.gfx.y - 5;
        networkTooltip.visible = true;
    });

    // on node mouseout
    node.gfx.on("mouseout", () => {
        node.gfx.lineStyle(0, 0xffffff00);
        node.gfx.drawCircle(0, 0, nodeSize);
        networkTooltip.visible = false;
    });
    return node;
}

const NetworkGraph = withSize()(NGraph);
export { NetworkGraph };
