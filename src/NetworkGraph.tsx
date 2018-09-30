import {Perlin} from "./Perlin";
import {DataSet, Edge, Network} from "vis";
import * as React from "react";
import {createRef} from "react";
import {when} from "mobx";

class NetworkGraph extends React.Component<{ perlin: Perlin }, {}> {
    private networkGraphRef: React.RefObject<any> = createRef();
    // @ts-ignore
    private networkGraph: Network;

    public componentDidMount() {
        // @ts-ignore
        const networkNodes = new DataSet<Node>();
        const networkEdges = new DataSet<Edge>();

        this.networkGraph = new Network(this.networkGraphRef.current, {nodes: networkNodes, edges: networkEdges}, {
            width: '100%',
            height: '360px',
            nodes: {
                shape: 'dot',
                size: 15,
                font: {
                    color: 'white',
                    face: "monospace",
                    size: 12
                },
            },
            interaction: {
                hover: true,
            },
            physics: {
                solver: "forceAtlas2Based",
                minVelocity: 1.5,
                maxVelocity: 15
            },
        });

        when(
            () => this.props.perlin.ledger.address.length > 0,
            () => {
                const self = this.props.perlin.ledger.address;
                if (self.length === 0) {
                    return;
                }

                let peers = this.props.perlin.ledger.peers;

                if (peers == null || peers.length === 0) {
                    return;
                }

                peers = peers.slice();

                // Add nodes.
                networkNodes.add({id: self, label: self});
                networkNodes.add(peers.map(peer => {
                    return {id: peer, label: peer}
                }));

                // Add edges.
                networkNodes.forEach((x: any) => {
                    networkNodes.forEach((y: any) => {
                        if (x.id !== y.id) {
                            networkEdges.add({from: x.id, to: y.id});
                        }
                    })
                })

            }
        );
    }

    public render() {
        return <div ref={this.networkGraphRef} style={{height: 360}}/>;
    }
}

export {NetworkGraph};