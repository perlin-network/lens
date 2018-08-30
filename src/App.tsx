import {
    Alignment,
    Button,
    Callout,
    Card,
    Code,
    FormGroup,
    H5,
    InputGroup,
    Intent,
    Navbar,
    Pre,
    Tag
} from "@blueprintjs/core";
import {observer} from "mobx-react";
import * as React from 'react';
import {createRef} from 'react';
import {Perlin} from "./Perlin";
import {Store} from "./Store";
import logo from "./perlin-logo.svg"
import {DataSet, Network} from "vis";
import ReactTable from "react-table";
import {ITransaction} from "./Transaction";
import {autorun} from "mobx";

const recentColumns = [
    {
        Header: "Sender",
        accessor: "sender",
        maxWidth: 300,
        className: "text-center"
    },
    {
        Header: "Nonce",
        accessor: "nonce",
        maxWidth: 80,
        className: "text-center"
    },
    {
        Header: "Tag",
        accessor: "tag",
        maxWidth: 80,
        className: "text-center"
    },
    {
        Header: "Payload",
        id: "payload",
        accessor: (tx: ITransaction) => tx.payload && JSON.stringify(tx.payload) || undefined,
        className: "text-center"
    }
]

@observer
class App extends React.Component<{ store: Store, perlin: Perlin }, {}> {
    private app: React.RefObject<any> = createRef();
    private network: Network;

    public componentDidMount() {
        const nodes = new DataSet();
        const edges = new DataSet();

        autorun(
            () => {
                const self = this.props.perlin.ledger.address;
                if (self.length === 0) {
                    return;
                }

                const peers = this.props.perlin.ledger.peers.slice();

                // Add nodes.
                nodes.add({id: self, label: self});
                nodes.add(peers.map(peer => {
                    return {id: peer, label: peer}
                }));

                // Add edges.
                nodes.forEach((x: any) => {
                    nodes.forEach((y: any) => {
                        if (x.id !== y.id) {
                            edges.add({from: x.id, to: y.id});
                        }
                    })
                })

                if (this.network == null) {
                    this.network = new Network(this.app.current, {nodes, edges}, {
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
                            zoomView: false,
                            hover: true,
                        },
                        physics: {
                            barnesHut: {
                                avoidOverlap: 1,
                                gravitationalConstant: -50000,
                                centralGravity: 5
                            },
                            stabilization: false,
                            minVelocity: 1.5,
                            maxVelocity: 15
                        }
                    });
                }

                console.log(this.network.getSeed())
            }
        )
    }

    public render() {
        return (
            <>
                <header style={{margin: '1.5em 1.5em', marginBottom: '1em'}}>
                    <img src={logo} style={{width: "12em"}}/>
                </header>

                <div style={{margin: '1em'}}>
                    <Callout intent={Intent.SUCCESS}>
                        You're connected as: <Code
                        style={{marginLeft: '0.5em'}}>{this.props.perlin.ledger.public_key}</Code>
                    </Callout>

                    <br/>

                    <Callout intent={Intent.PRIMARY}>
                        You're connected to: <Code
                        style={{marginLeft: '0.5em'}}>{this.props.perlin.ledger.peers.join(", ") || "Loading..."}</Code>
                    </Callout>

                    <br/>

                    <Navbar>
                        <Navbar.Group align={Alignment.CENTER}>
                            <Navbar.Heading>Statistics</Navbar.Heading>

                            <div className="tag-list">
                                <Tag minimal={true}>{`uptime: ${this.props.perlin.stats.Uptime}`}</Tag>

                                <Tag
                                    minimal={true}>{`tx latency: ${this.props.perlin.stats.ConsensusDuration.toFixed(3)} sec`}</Tag>

                                <Tag
                                    minimal={true}>{`num accepted tx: ${this.props.perlin.stats.NumAcceptedTransactions}`}</Tag>

                                <Tag
                                    minimal={true}>{`tx/sec: ${this.props.perlin.stats.NumAcceptedTransactionsPerSecond}`}</Tag>
                            </div>
                        </Navbar.Group>
                    </Navbar>

                    <br/>

                    <Card>
                        <H5>Ledger</H5>
                        <Pre style={{overflow: "hidden", textOverflow: "ellipsis"}}>
                            {JSON.stringify(this.props.perlin.ledger.state, null, 4)}
                        </Pre>
                    </Card>

                    <br/>

                    <Card>
                        <H5>Send PERLs</H5>
                        <FormGroup
                            label="Recipient"
                            labelFor="recipient"
                            labelInfo="(required)">
                            <InputGroup id="recipient"
                                        placeholder="8f9b4ae0364280e6a0b988c149f65d1badaeefed2db582266494dd79aa7c821a"
                                        onChange={this.onRecipient}/>

                        </FormGroup>

                        <FormGroup
                            label="Amount"
                            labelFor="amount"
                            labelInfo="(required)">
                            <InputGroup id="amount"
                                        type="number"
                                        placeholder="0 PERLs"
                                        onChange={this.onAmount}/>
                        </FormGroup>

                        <Button onClick={this.onTransfer} text="Send PERLs"/>
                    </Card>

                    <br/>

                    <Card>
                        <H5>Recent Transactions</H5>

                        <div>
                            <ReactTable
                                data={this.props.perlin.recentTransactions}
                                columns={recentColumns}
                                className="-striped -highlight"
                                defaultPageSize={15}
                                defaultSorted={[
                                    {
                                        id: "index",
                                        desc: true
                                    }
                                ]}
                                SubComponent={this.recentSubComponent}
                            />
                        </div>
                    </Card>

                    <br/>

                    <Card>
                        <H5>Network</H5>
                        <div ref={this.app} style={{height: 500}}/>
                    </Card>
                </div>
            </>
        );
    }

    private recentSubComponent = (row: any) => {
        const data = row.original;
        delete data.index;

        return (
            <div style={{paddingLeft: 10, paddingRight: 10}}>
                <Pre style={{overflow: "hidden", textOverflow: "ellipsis"}}>{JSON.stringify(data, null, 4)}</Pre>
            </div>
        );
    }

    private onRecipient = (event: any) => {
        this.props.store.recipient = event.target.value;
    }

    private onAmount = (event: any) => {
        this.props.store.amount = parseInt(event.target.value, 10);
    }

    private onTransfer = async (event: any) => {
        await this.props.perlin.transfer(this.props.store.recipient, this.props.store.amount);
    }
}

export default App;
