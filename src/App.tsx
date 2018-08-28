import {Button, Callout, Card, Code, FormGroup, H5, InputGroup, Intent, Pre} from "@blueprintjs/core";
import {observer} from "mobx-react";
import * as React from 'react';
import {Perlin} from "./Perlin";
import {Store} from "./Store";

@observer
class App extends React.Component<{ store: Store, perlin: Perlin }, {}> {
    public render() {
        return (
            <>
                <header style={{margin: '1em'}}>
                    <h1>Perlin</h1>
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

                    <Card>
                        <H5>Ledger</H5>
                        <Pre>
                            {JSON.stringify(this.props.perlin.ledger.state, null, "\t")}
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

                        <Button onClick={this.onTransfer}>
                            Send PERLs
                        </Button>
                    </Card>
                </div>
            </>
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
