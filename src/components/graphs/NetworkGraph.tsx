import { Perlin } from "../../Perlin";
import * as PIXI from "pixi.js";
import * as d3 from "d3";
import { withSize } from "react-sizeme";
import React from "react";
import { createRef } from "react";
import { when, intercept, Lambda } from "mobx";
import Tooltip from "./Tooltip";
import styled from "styled-components";
import { getNetworkGraphNodeLimit } from "../../storage";

const perlin = Perlin.getInstance();
const nodeLimit = getNetworkGraphNodeLimit();
const networkTooltip = {
    text: "",
    x: 0,
    y: 0,
    visible: false,
    title: ""
};
const Wrapper = styled.div`
    position: relative;

    .graph-container {
        width: 100%;
        height: 300px;
        margin-bottom: 0;
    }
`;

class NGraph extends React.PureComponent<{ size: any }, {}> {
    private networkGraphRef: React.RefObject<any> = createRef();
    private renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;

    private peerMap: Map<string, any[]> = new Map([]);
    private nodes: any[] = [];
    private localNode: any;
    private edges: any[] = [];
    private stage: PIXI.Container;
    private disposer: Lambda;

    public updateDimensions() {
        if (this.renderer != null) {
            const parent = this.renderer.view.parentNode;

            // @ts-ignore
            this.renderer.resize(parent.clientWidth, parent.clientHeight);

            this.renderer.render(this.stage);
        }
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions.bind(this));
        this.disposer();
    }

    public componentDidMount() {
        window.addEventListener("resize", this.updateDimensions.bind(this));

        const width = this.props.size.width;
        const height = this.props.size.height || 300;

        this.stage = new PIXI.Container();
        this.renderer = PIXI.autoDetectRenderer({
            width,
            height,
            transparent: true,
            antialias: true
        });

        const links = new PIXI.Graphics();
        this.stage.addChild(links);

        this.networkGraphRef.current.appendChild(this.renderer.view);

        d3.select(this.renderer.view).call(
            d3.zoom().on("zoom", () => {
                this.stage.scale.set(d3.event.transform.k);
                this.stage.position.set(
                    d3.event.transform.x,
                    d3.event.transform.y
                );
                render();
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
            .force("charge", d3.forceManyBody().strength(-500))
            // .force("collide", d3.forceCollide().radius(3))
            // .force("x", d3.forceX())
            // .force("y", d3.forceY())
            .alphaDecay(0.1)
            .alphaTarget(0);

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
            this.renderer.render(this.stage);
        };

        const update = () => {
            simulation.nodes(this.nodes).on("tick", render);
            // @ts-ignore
            simulation.force("link").links(this.edges);
            simulation.alpha(1).restart();
            console.log("Network Graph nodes #", this.nodes.length);
        };

        const mouseHandleUpdate = () => {
            render();
            this.forceUpdate();
        };
        this.disposer = intercept(perlin, "peers", changes => {
            const peers = (changes.newValue || []).slice(0, nodeLimit - 1);
            const isDirty = this.checkPeers(peers, mouseHandleUpdate);

            if (isDirty) {
                update();
            }

            return changes;
        });

        when(
            () => perlin.ledger.address.length > 0,
            () => {
                // Add nodes
                const self = perlin.ledger.address;
                if (self.length === 0) {
                    return;
                }
                this.localNode = getInteractiveNode(
                    perlin.ledger.address,
                    mouseHandleUpdate,
                    true
                );
                this.nodes.push(this.localNode);
                this.stage.addChild(this.localNode.gfx);

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

    private checkPeers(peers: string[], mouseHandleUpdate: () => void) {
        let isDirty = false;
        peers.forEach((peer: string) => {
            if (peer !== this.localNode.id && !this.peerMap.get(peer)) {
                isDirty = true;
                this.addPeer(peer, mouseHandleUpdate);
            }
        });

        this.nodes = this.nodes.filter((node: any) => {
            if (node.id === this.localNode.id) {
                return true;
            }
            const foundIndex = peers.findIndex(
                (peer: string) => node.id === peer
            );
            // if new peers array doesn't contain a node then remove it
            if (foundIndex === -1) {
                isDirty = true;
                this.edges = this.edges.filter(
                    (edge: any) =>
                        edge.source.id !== node.id && edge.target.id !== node.id
                );
                node.gfx.destroy();
                this.peerMap.delete(node.id);
                return false;
            }
            return true;
        });

        return isDirty;
    }

    private addPeer(peer: string, mouseHandleUpdate: () => void) {
        const peerNode = getInteractiveNode(peer, mouseHandleUpdate);
        this.nodes.push(peerNode);
        this.stage.addChild(peerNode.gfx);

        // Add the temporary peer node to the map
        this.peerMap.set(peer, [
            {
                id: this.localNode.id,
                label: this.localNode.id
            }
        ]);

        // Add edges
        this.edges.push({ source: peerNode.id, target: this.localNode.id });
    }
}

function getInteractiveNode(
    self: string,
    mouseUpdate: () => void,
    isLocal: boolean = false
) {
    const node = {
        id: self,
        label: self,
        gfx: new PIXI.Graphics()
    };
    const nodeSize = isLocal ? 12 : 6;

    node.gfx.interactive = true;
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
        networkTooltip.title = isLocal ? "Local address" : "Peer address";
        networkTooltip.visible = true;

        mouseUpdate();
    });

    // on node mouseout
    node.gfx.on("mouseout", () => {
        node.gfx.removeChildren();

        node.gfx.clear();

        node.gfx.lineStyle(1, 0x0c122b);
        node.gfx.beginFill(0x4a41d1);
        node.gfx.drawCircle(0, 0, nodeSize);

        networkTooltip.visible = false;
        mouseUpdate();
    });
    return node;
}

const NetworkGraph = withSize()(NGraph);
export { NetworkGraph };
