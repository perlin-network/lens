import { Perlin, NotificationTypes } from "../../Perlin";
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
interface IWrapperProps {
    showPointer: boolean;
}
const Wrapper = styled.div<IWrapperProps>`
    position: relative;

    .graph-container {
        width: 100%;
        height: 300px;
        margin-bottom: 0;
    }

    ${({ showPointer }) => (showPointer ? "cursor: pointer;" : "")}
`;

class NGraph extends React.PureComponent<
    { size: any },
    { showPointer: boolean }
> {
    public state = {
        showPointer: false
    };

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
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("charge", d3.forceManyBody().strength(-50))
            .force("y", d3.forceY().y(height / 2))
            .force("x", d3.forceX().x(width / 2))
            .force(
                "link",
                d3
                    .forceLink(this.edges)
                    .id((d: any) => d.id)
                    .strength(0)
            )
            .force("collide", d3.forceCollide((d: any) => d.r + 10))

            .alphaDecay(0.1)
            .alphaTarget(0);

        const render = () => {
            this.nodes.forEach(node => {
                const { x, y, gfx } = node;
                gfx.position = new PIXI.Point(x, y);
            });

            links.clear();

            this.edges.forEach((link, index: number) => {
                const { source, target } = link;
                links.lineStyle(1, 0x413bb6);
                links.moveTo(source.x, source.y);

                const clockWise = index % 2 === 0;
                const { offsetX, offsetY } = getLineOffset(
                    source,
                    target,
                    clockWise
                );
                links.quadraticCurveTo(offsetX, offsetY, target.x, target.y);
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
                    {
                        address: perlin.ledger.address,
                        public_key: perlin.ledger.public_key
                    },
                    mouseHandleUpdate,
                    true,
                    this
                );
                this.nodes.push(this.localNode);
                this.stage.addChild(this.localNode.gfx);

                this.checkPeers(perlin.ledger.peers, mouseHandleUpdate);
                this.addNonPeers(9);

                update();
            }
        );
    }

    public render() {
        return (
            <Wrapper showPointer={this.state.showPointer}>
                <div className="graph-container" ref={this.networkGraphRef} />
                <Tooltip {...networkTooltip} />
            </Wrapper>
        );
    }

    private addNonPeers(nonPeerNum: number) {
        let counter = 0;
        while (counter < nonPeerNum) {
            const node = getDisconnectedNode(counter + 1 + "");
            this.nodes.push(node);
            this.stage.addChild(node.gfx);
            counter++;
        }
    }

    private checkPeers(peers: any[], mouseHandleUpdate: () => void) {
        let isDirty = false;
        peers.forEach((peer: any) => {
            if (
                peer.address !== this.localNode.id &&
                !this.peerMap.get(peer.address)
            ) {
                isDirty = true;
                this.addPeer(peer, mouseHandleUpdate);
            }
        });

        this.nodes = this.nodes.filter((node: any) => {
            if (node.id === this.localNode.id || node.id.length < 2) {
                return true;
            }
            const foundIndex = peers.findIndex(
                (peer: any) => node.id === peer.address
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

    private addPeer(peer: any, mouseHandleUpdate: () => void) {
        const peerNode = getInteractiveNode(
            peer,
            mouseHandleUpdate,
            false,
            this
        );
        this.nodes.push(peerNode);
        this.stage.addChild(peerNode.gfx);

        // Add the temporary peer node to the map
        this.peerMap.set(peer.address, [
            {
                id: this.localNode.id,
                label: this.localNode.id
            }
        ]);

        // Add edges
        this.edges.push({ source: peerNode.id, target: this.localNode.id });
    }
}

const copyPubkeyToClipboard = (pubKey: string) => {
    const el = document.createElement("textarea");
    if (pubKey !== undefined) {
        el.value = pubKey;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);

        perlin.notify({
            type: NotificationTypes.Success,
            message: "Node Public Key copied to clipboard"
        });
    }
};

function getLineOffset(source: any, target: any, clockwise = false) {
    const midpointX = (source.x + target.x) / 2;
    const midpointY = (source.y + target.y) / 2;

    const inc = clockwise ? -1 : 1;
    const dx = target.x - source.x;
    const dy = target.y - source.y;

    const normalise = Math.sqrt(dx * dx + dy * dy);

    const offset = normalise * 0.15 * inc;
    const offsetX = midpointX + offset * (dy / normalise);
    const offsetY = midpointY - offset * (dx / normalise);

    return { offsetX, offsetY };
}

function getDisconnectedNode(id: string) {
    const node = {
        id,
        gfx: new PIXI.Graphics()
    };
    const nodeSize = 6;

    node.gfx.interactive = false;

    node.gfx.beginFill(0x313647);
    node.gfx.lineStyle(1, 0x0c122b);
    node.gfx.drawCircle(0, 0, nodeSize);

    node.gfx.addChild(node.gfx);

    return node;
}
function getInteractiveNode(
    self: any,
    mouseUpdate: () => void,
    isLocal: boolean = false,
    context: any
) {
    const node = {
        id: self.address,
        label: self.public_key,
        gfx: new PIXI.Graphics()
    };
    const nodeSize = isLocal ? 12 : 6;

    node.gfx.interactive = true;
    node.gfx.hitArea = new PIXI.Circle(0, 0, nodeSize + 2);

    node.gfx.beginFill(0x4a41d1);
    node.gfx.lineStyle(1, 0x0c122b);
    node.gfx.drawCircle(0, 0, nodeSize);

    node.gfx.addChild(node.gfx);

    node.gfx.on("mouseout", () => {
        context.setState({
            showPointer: false
        });
    });
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

        networkTooltip.text = self.public_key;
        networkTooltip.title = self.address || "Local Node";
        networkTooltip.visible = true;
        context.setState({
            showPointer: true
        });
        mouseUpdate();
    });
    node.gfx.on("click", () => {
        copyPubkeyToClipboard(self.public_key);
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
