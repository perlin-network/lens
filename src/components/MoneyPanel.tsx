import * as React from "react";
import { Perlin } from "../Perlin";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { MoneyPanelStore } from "../stores/MoneyPanelStore";

const perlin = Perlin.getInstance();

class MoneyPanel extends React.Component<{}, {}> {
    private store: MoneyPanelStore = new MoneyPanelStore();

    public render() {
        return (
            <>
                <FormGroup
                    label="Recipient"
                    labelFor="recipient"
                    labelInfo="(required)"
                >
                    <InputGroup
                        id="recipient"
                        placeholder="8f9b4ae0364280e6a0b988c149f65d1badaeefed2db582266494dd79aa7c821a"
                        onChange={this.onRecipient}
                    />
                </FormGroup>

                <FormGroup
                    label="Amount"
                    labelFor="amount"
                    labelInfo="(required)"
                >
                    <InputGroup
                        id="amount"
                        type="number"
                        placeholder="0 PERLs"
                        onChange={this.onAmount}
                    />
                </FormGroup>

                <div className="button-container">
                    <Button
                        className="button"
                        onClick={this.onTransfer}
                        text="Send PERLs"
                    />
                </div>
            </>
        );
    }

    // @ts-ignore
    private onRecipient = (event: any) => {
        this.store.recipient = event.target.value;
    };

    // @ts-ignore
    private onAmount = (event: any) => {
        this.store.amount = parseInt(event.target.value, 10);
    };

    // @ts-ignore
    private onTransfer = async (event: any) => {
        await perlin.transfer(this.store.recipient, this.store.amount);
    };
}

export { MoneyPanel };
