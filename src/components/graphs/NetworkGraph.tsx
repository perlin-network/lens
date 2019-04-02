import { Perlin } from "../../Perlin";
import * as PIXI from "pixi.js";
import * as d3 from "d3";
import { withSize } from "react-sizeme";
import * as React from "react";
import { createRef } from "react";
import { when } from "mobx";
import Tooltip from "./Tooltip";
import styled from "styled-components";

const perlin = Perlin.getInstance();
const networkTooltip = {
    text: "",
    x: 0,
    y: 0,
    visible: false
};
const Wrapper = styled.div`
    position: relative;

    .graph-container {
        width: 100%;
        height: 300px;
        margin-bottom: 0;
    }
`;

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
            .force(
                "link",
                d3.forceLink(this.edges).id((d: any) => d.id)
                //            .distance(100)
            )
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("charge", d3.forceManyBody().strength(-400))
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

            this.edges.forEach(link => {
                const { source, target } = link;
                links.lineStyle(1, 0x413bb6);
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
            () => perlin.ledger.address.length > 0,
            () => {
                // Add nodes
                const self = perlin.ledger.address;
                if (self.length === 0) {
                    return;
                }
                const node = getInteractiveNode(
                    perlin.ledger.address,
                    mouseHandleUpdate,
                    true
                );
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
                        const peerNode = getInteractiveNode(
                            peer,
                            mouseHandleUpdate
                        );
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
            <Wrapper>
                <div className="graph-container" ref={this.networkGraphRef} />
                <Tooltip {...networkTooltip} />
            </Wrapper>
        );
    }
}

function getInteractiveNode(
    self: string,
    update: (isMouseOver: boolean) => void,
    isLocal: boolean = false
) {
    const node = {
        id: self,
        label: self,
        gfx: new PIXI.Graphics()
    };
    const nodeSize = isLocal ? 12 : 6;

    node.gfx.interactive = true;
    node.gfx.buttonMode = true;
    node.gfx.hitArea = new PIXI.Circle(0, 0, nodeSize + 2);

    node.gfx.beginFill(0x4a41d1);
    node.gfx.lineStyle(1, 0x0c122b);
    node.gfx.drawCircle(0, 0, nodeSize);

    node.gfx.addChild(node.gfx);

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

        networkTooltip.x = transformedX;
        networkTooltip.y = transformedY - (node.gfx.height / 2) * scale;

        networkTooltip.text = self;
        networkTooltip.visible = true;

        update(true);
    });

    // on node mouseout
    node.gfx.on("mouseout", () => {
        node.gfx.removeChildren();

        node.gfx.clear();

        node.gfx.lineStyle(1, 0x0c122b);
        node.gfx.beginFill(0x4a41d1);
        node.gfx.drawCircle(0, 0, nodeSize);

        networkTooltip.visible = false;
        update(false);
    });
    return node;
}

const NetworkGraph = withSize()(NGraph);
export { NetworkGraph };
