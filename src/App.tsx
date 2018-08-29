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
    Menu,
    Navbar,
    Pre,
    Tag
} from "@blueprintjs/core";
import {observer} from "mobx-react";
import * as React from 'react';
import {Perlin} from "./Perlin";
import {Store} from "./Store";
import logo from "./perlin-logo.svg"
import {Cell, Column, CopyCellsMenuItem, IMenuContext, JSONFormat, RowHeaderCell, Table} from "@blueprintjs/table";

@observer
class App extends React.Component<{ store: Store, perlin: Perlin }, {}> {
    public render() {
        // const cellRenderer = (rowIndex: number) => {
        //     return <Cell>{`$${(rowIndex * 10).toFixed(2)}`}</Cell>
        // };

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
                        <Pre>
                            {JSON.stringify(this.props.perlin.ledger.state, null, 4)}
                        </Pre>
                    </Card>

                    <br/>

                    <Card>
                        <H5>Recent Transactions</H5>

                        <div style={{height: 280}}>
                            <Table
                                rowHeaderCellRenderer={this.recentRowCellRenderer}
                                bodyContextMenuRenderer={this.recentContextMenu}
                                numRows={this.props.perlin.transactions.recent.length}
                                columnWidths={[150, 80, 80, 400, 480, 480]}>
                                <Column name="Sender" cellRenderer={this.recentCellRenderer("sender")}/>
                                <Column name="Nonce" cellRenderer={this.recentCellRenderer("nonce")}/>
                                <Column name="Tag" cellRenderer={this.recentCellRenderer("tag")}/>
                                <Column name="Payload" cellRenderer={this.recentCellRendererJSON("payload")}/>
                                <Column name="Parents" cellRenderer={this.recentCellRendererJSON("parents")}/>
                                <Column name="Signature" cellRenderer={this.recentCellRenderer("signature")}/>
                            </Table>
                        </div>
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
                </div>
            </>
        );
    }

    private recentCellRenderer(key: string) {
        return (row: number) =>
            <Cell>{this.props.perlin.transactions.recent[this.props.perlin.transactions.recent.length - 1 - row][key]}</Cell>
    }

    private recentContextMenu = (context: IMenuContext) => {
        return (
            <Menu>
                <CopyCellsMenuItem context={context} getCellData={this.recentCellData} text="Copy"
                                   onCopy={this.onCopy}/>
            </Menu>
        );
    };

    private onCopy = (success: boolean) => {
        console.log(success)
    };

    private recentCellData = (rowIndex: number, columnIndex: number) => {
        const data = this.props.perlin.transactions.recent[this.props.perlin.transactions.recent.length - 1 - rowIndex];
        const keys = {0: "sender", 1: "nonce", 2: "tag", 3: "payload", 4: "parents", 5: "signature"}

        return data[keys[columnIndex]];
    };

    private recentRowCellRenderer = (row: number) => {
        return (
            <RowHeaderCell index={row} style={{textAlign: 'center'}}>
                <small>{this.props.perlin.transactions.recent.length - row}</small>
            </RowHeaderCell>
        );
    }

    private recentCellRendererJSON(key: string) {
        return (row: number) => {
            const item = this.props.perlin.transactions.recent[this.props.perlin.transactions.recent.length - 1 - row][key];
            return (
                <Cell>
                    <JSONFormat>
                        {Object.keys(item).length > 0 && item || ""}
                    </JSONFormat>
                </Cell>
            );
        }
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
