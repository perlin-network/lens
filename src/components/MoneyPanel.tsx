import * as React from "react";
import { observer } from "mobx-react";
import { Perlin } from "../Perlin";
import { FormGroup, InputGroup } from "@blueprintjs/core";
import { MoneyPanelStore } from "../stores/MoneyPanelStore";
import Button from "./Button";

const perlin = Perlin.getInstance();

@observer
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
                        value={this.store.recipient}
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
                        value={
                            this.store.amount
                                ? this.store.amount.toString()
                                : ""
                        }
                        onChange={this.onAmount}
                    />
                </FormGroup>
                <Button onClick={this.onTransfer} text="Send PERLs" />
            </>
        );
    }

    private onRecipient = (event: any) => {
        this.store.recipient = event.target.value;
    };

    private onAmount = (event: any) => {
        this.store.amount = event.target.value
            ? parseInt(event.target.value, 10)
            : 0;
    };

    private onTransfer = async (event: any) => {
        if (this.store.amount > 0 && this.store.recipient.length > 0) {
            await perlin.transfer(this.store.recipient, this.store.amount);
            this.store.clearFields();
        }
    };
}

export { MoneyPanel };
