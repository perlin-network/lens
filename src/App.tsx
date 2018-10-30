import {
    Alignment,
    Button,
    Callout,
    Card,
    Code,
    FileInput,
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
import * as GridLayout from "react-grid-layout";
import {WidthProvider} from "react-grid-layout";
import ReactTable from "react-table";
import {NetworkGraph} from "./NetworkGraph";
import {TransactionGraphPixi} from "./TransactionGraphPixi";


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
                        <Navbar className="CardStyle">
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
                        <Card className='CardStyle'>
                            <H5>Ledger</H5>
                            <Pre style={{
                                overflow: "hidden",
                                height: "90%",
                                textOverflow: "ellipsis"
                            }}>{JSON.stringify(this.props.perlin.ledger.state, null, 4)}</Pre>
                        </Card>

                        <br/>

                        <Card className='CardStyle'>
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
                            <div className='button-container'>
                                <Button className='button' onClick={this.onTransfer} text="Send PERLs"/>
                            </div>
                        </Card>

                        <br/>

                        <Card className='CardStyle'>
                            <H5>Create Smart Contract</H5>

                            <FormGroup
                                label="WebAssembly (.wasm) file"
                                labelFor="selectContract"
                                labelInfo="(required)">
                                <FileInput id="selectContract" large={true} fill={true}
                                           text={this.props.store.contractFile && this.props.store.contractFile.name}
                                           onChange={this.onSelectContract}/>
                            </FormGroup>

                            <div className='button-container'>
                                <Button className='button' onClick={this.onCreateContract} text="Create"/>
                            </div>
                        </Card>

                        <br/>

                        <Card className='CardStyle'>
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
                        <Card className='CardStyle'>
                            <H5>Transactions</H5>
                            <TransactionGraphPixi perlin={this.props.perlin}/>
                        </Card>

                        <br/>

                        <Card className='CardStyle'>
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
                            <Button className='button' onClick={this.onDownloadContract} id={data.id} text="Download"/>
                        </div>
                    : null
                }
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

    // @ts-ignore
    private onSelectContract = (event: any) => {
        this.props.store.contractFile = event.target.files[0];
    }

    // @ts-ignore
    private onCreateContract = async (event: any) => {
        await this.props.perlin.createSmartContract(this.props.store.contractFile);
    }

    // @ts-ignore
    private onDownloadContract = (event: any) => {
        const txID: string = event.target.id;
        this.props.perlin.downloadContract(txID);
    }
}

export default App;
