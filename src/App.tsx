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
import {Perlin} from "./Perlin";
import {Store} from "./Store";
import logo from "./perlin-logo.svg"
import {ITransaction} from "./Transaction";
import * as GridLayout from "react-grid-layout";
import {WidthProvider} from "react-grid-layout";
import {TransactionGraphD3} from "./TransactionGraphD3";
import ReactTable from "react-table";
import {NetworkGraph} from "./NetworkGraph";


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
    {
        Header: "Payload",
        id: "payload",
        accessor: (tx: ITransaction) => tx.payload && JSON.stringify(tx.payload) || undefined,
        className: "text-center"
    }
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

                        {i: "connectStatus", x: 0, y: 1, w: 12, h: 1, static: true},
                        {i: "peerStatus", x: 0, y: 2, w: 12, h: 1, static: true},

                        {i: "ledger", x: 0, y: 3, w: 5, h: 6, static: true},

                        {i: "transactionGraph", x: 5, y: 3, w: 7, h: 8, static: true},

                        {i: "sendTransaction", x: 0, y: 9, w: 5, h: 4, static: true},
                        {i: "networkGraph", x: 5, y: 11, w: 7, h: 7.25, static: true},

                        {i: "recentTransactions", x: 0, y: 13, w: 5, h: 16, static: true}
                    ]
                }>
                    <header key="logo" style={{margin: '1.5em 1.5em', marginBottom: '1em'}}>
                        <img src={logo} style={{width: "12em"}}/>
                    </header>

                    <Navbar key="navbar" style={{marginTop: "1em", marginBottom: "1em"}}>
                        <Navbar.Group align={Alignment.CENTER}>
                            <Navbar.Heading>Statistics</Navbar.Heading>

                            <div className="tag-list">
                                <Tag minimal={true}>{`uptime: ${this.props.perlin.stats.Uptime}`}</Tag>

                                <Tag
                                    minimal={true}>{`tx latency: ${this.props.perlin.stats.ConsensusDuration.toFixed(3)} sec`}</Tag>

                                <Tag
                                    minimal={true}>{`num accepted tx: ${this.props.perlin.stats.NumAcceptedTransactions}`}</Tag>

                                <Tag
                                    minimal={true}>{`accepted tx/sec: ${this.props.perlin.stats.NumAcceptedTransactionsPerSecond}`}</Tag>
                            </div>
                        </Navbar.Group>
                    </Navbar>

                    <Callout key="connectStatus" intent={Intent.SUCCESS}
                             style={{marginTop: "1.5em", marginLeft: "0.5em", maxHeight: 42}}>
                        You're connected as: <Code
                        style={{marginLeft: '0.5em'}}>{this.props.perlin.ledger.public_key}</Code>
                    </Callout>

                    <Callout key="peerStatus" intent={Intent.PRIMARY}
                             style={{marginTop: "1.5em", marginLeft: "0.5em", maxHeight: 42}}>
                        You're connected to: <Code
                        style={{marginLeft: '0.5em'}}>{this.props.perlin.ledger.peers.join(", ") || "Loading..."}</Code>
                    </Callout>

                    <Card key="ledger" style={{marginTop: "1.5em", marginLeft: "0.5em"}}>
                        <H5>Ledger</H5>
                        <Pre style={{overflow: "hidden", height: "90%", textOverflow: "ellipsis"}}>
                            {JSON.stringify(this.props.perlin.ledger.state, null, 4)}
                        </Pre>
                    </Card>

                    <Card key="transactionGraph" style={{marginTop: "1.5em", marginLeft: "1em"}}>
                        <H5>Transactions</H5>
                        <TransactionGraphD3 perlin={this.props.perlin}/>
                    </Card>

                    <Card key="networkGraph" style={{marginTop: "2em", marginLeft: "1em"}}>
                        <H5>Network</H5>
                        <NetworkGraph perlin={this.props.perlin}/>
                    </Card>

                    <Card key="sendTransaction" style={{marginTop: "2em", marginLeft: "0.5em"}}>
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

                    <Card key="recentTransactions" style={{marginTop: "2.5em", marginLeft: "0.5em"}}>
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
                </DecoratedGridLayout>
            </>
        );
    }

    // @ts-ignore
    private recentSubComponent = (row: any) => {
        const data = row.original;
        delete data.index;

        return (
            <div style={{paddingLeft: 10, paddingRight: 10}}>
                <Pre style={{overflow: "hidden", textOverflow: "ellipsis"}}>{JSON.stringify(data, null, 4)}</Pre>
            </div>
        );
    }

    // @ts-ignore
    private onRecipient = (event: any) => {
        this.props.store.recipient = event.target.value;
    }

    // @ts-ignore
    private onAmount = (event: any) => {
        this.props.store.amount = parseInt(event.target.value, 10);
    }

    // @ts-ignore
    private onTransfer = async (event: any) => {
        await this.props.perlin.transfer(this.props.store.recipient, this.props.store.amount);
    }
}

export default App;
