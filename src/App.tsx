import {Alignment, Button, Callout, Card, Code, H5, Intent, Navbar, Pre, Tab, Tabs, Tag} from "@blueprintjs/core";
import {observer} from "mobx-react";
import * as React from 'react';
import {Perlin} from "./Perlin";
import {Store} from "./Store";
import logo from "./perlin-logo.svg"
import * as GridLayout from "react-grid-layout";
import {WidthProvider} from "react-grid-layout";
import ReactTable from "react-table";
import {NetworkGraph} from "./NetworkGraph";
import {TransactionGraphPixi} from "./TransactionGraphPixi";
import {MoneyPanel} from "./MoneyPanel";
import {ContractPanel} from "./ContractPanel";
import {StakePanel} from "./StakePanel";


const DecoratedGridLayout = WidthProvider(GridLayout);

// @ts-ignore
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
]


@observer
class App extends React.Component<{ store: Store, perlin: Perlin }, {}> {

    public render() {
        return (
            <>
                <DecoratedGridLayout measureBeforeMount={true} rowHeight={50} layout={
                    [
                        {i: "logo", x: 0, y: 0, w: 2, h: 1, static: true},
                        {i: "navbar", x: 3, y: 0, w: 10, h: 1, static: true},

                        {i: "status", x: 0, y: 1, w: 12, h: 1, static: true},
                        {i: "peerStatus", x: 6, y: 1, w: 6, h: 1, static: true},

                        {i: "ledger", x: 0, y: 2, w: 5, h: 6, static: true},

                        {i: "graphs", x: 5, y: 2, w: 7, h: 8, static: true},
                    ]
                }>
                    <div key="logo" style={{margin: '1.5em 1.5em', marginBottom: '1em'}}>
                        <header>
                            <img src={logo} style={{width: "12em"}}/>
                        </header>
                    </div>


                    <div key="navbar" style={{marginTop: "1em", marginBottom: "1em", paddingRight: "1.5em"}}>
                        <Navbar className="cardStyle">
                            <Navbar.Group align={Alignment.CENTER}>
                                <Navbar.Heading>Statistics</Navbar.Heading>

                                <div className="tag-list">
                                    <Tag minimal={true}>{`uptime: ${this.props.perlin.stats.uptime}`}</Tag>

                                    <Tag
                                        minimal={true}>{`tx latency: ${this.props.perlin.stats.consensusDuration.toFixed(3)} sec`}</Tag>

                                    <Tag
                                        minimal={true}>{`num accepted tx: ${this.props.perlin.stats.numAcceptedTransactions}`}</Tag>

                                    <Tag
                                        minimal={true}>{`accepted tx/sec: ${this.props.perlin.stats.numAcceptedTransactionsPerSecond}`}</Tag>
                                </div>
                            </Navbar.Group>
                        </Navbar>
                    </div>

                    <div key="status" style={{marginTop: "1.5em", maxHeight: 42, marginLeft: "0.5em"}}>
                        <div className="statuses">
                            <div className="status-border">
                                <div className="status-container">
                                    <Callout className="status" intent={Intent.SUCCESS}>
                                        You're connected as: <Code
                                        style={{marginLeft: '0.5em'}}>{this.props.perlin.ledger.public_key}</Code>
                                    </Callout>
                                </div>
                            </div>

                            <div className="status-border">
                                <div className="status-container">
                                    <Callout className="status" intent={Intent.PRIMARY}>
                                        You're connected to: <Code
                                        style={{marginLeft: '0.5em'}}>{this.props.perlin.ledger.peers && this.props.perlin.ledger.peers.length > 0 && this.props.perlin.ledger.peers.join(", ") || "N/A"}</Code>
                                    </Callout>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div key="ledger" style={{marginTop: "1.5em", paddingBottom: "1em", marginLeft: "0.5em"}}>
                        <Card className='cardStyle'>
                            <H5>Ledger</H5>
                            <Pre style={{
                                overflow: "hidden",
                                height: "90%",
                                textOverflow: "ellipsis"
                            }}>{JSON.stringify(this.props.perlin.ledger.state, null, 4)}</Pre>
                        </Card>

                        <br/>

                        <Card className='cardStyle'>
                            <H5>Send Transaction</H5>

                            <Tabs>
                                <Tab id="money" title="Money" panel={<MoneyPanel perlin={this.props.perlin}/>}/>
                                <Tab id="stake" title="Stake" panel={<StakePanel perlin={this.props.perlin}/>}/>
                                <Tab id="contract" title="Smart Contract"
                                     panel={<ContractPanel perlin={this.props.perlin}/>}/>
                            </Tabs>
                        </Card>

                        <br/>

                        <Card className='cardStyle'>
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
                    </div>

                    <div key="graphs" style={{marginTop: "1.5em", marginLeft: "1em", paddingRight: "2.5em"}}>
                        <Card className='cardStyle'>
                            <H5>Transactions</H5>
                            <TransactionGraphPixi perlin={this.props.perlin}/>
                        </Card>

                        <br/>

                        <Card className='cardStyle'>
                            <H5>Network</H5>
                            <NetworkGraph perlin={this.props.perlin}/>
                        </Card>
                    </div>
                </DecoratedGridLayout>
            </>
        );
    }

    // @ts-ignore
    private recentSubComponent = (row: any) => {
        const data = row.original;
        delete data.index;
        const isContract = data.tag === "create_contract";

        return (
            <div style={{paddingLeft: 10, paddingRight: 10}}>
                <Pre style={{overflow: "hidden", textOverflow: "ellipsis"}}>{JSON.stringify(data, null, 4)}</Pre>
                {
                    isContract ?
                        // show a download button from the smart contract
                        <div className='button-container' style={{marginLeft: 20}}>
                            <Button className='button' onClick={this.onDownloadContract} value={data.id}
                                    text="Download"/>
                        </div>
                        : null
                }
            </div>
        );
    }

    // @ts-ignore
    private onDownloadContract = (event: any) => {
        const txID: string = event.target.value;
        this.props.perlin.downloadContract(txID);
    }
}

export default App;
