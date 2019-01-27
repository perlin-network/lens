import * as React from "react";
import { Perlin } from "../Perlin";
import { Button, ButtonGroup, FormGroup, InputGroup } from "@blueprintjs/core";
import { StakePanelStore } from "../stores/StakePanelStore";

const perlin = Perlin.getInstance();

class StakePanel extends React.Component<{}, {}> {
    private store: StakePanelStore = new StakePanelStore();

    public render() {
        return (
            <>
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

                <ButtonGroup>
                    <div className="button-container">
                        <Button
                            className="button"
                            onClick={this.onPlaceStake}
                            text="Place Stake"
                        />
                    </div>

                    <div
                        className="button-container"
                        style={{ marginLeft: "0.5em" }}
                    >
                        <Button
                            className="button"
                            onClick={this.onWithdrawStake}
                            text="Withdraw Stake"
                        />
                    </div>
                </ButtonGroup>
            </>
        );
    }

    // @ts-ignore
    private onAmount = (event: any) => {
        this.store.amount = parseInt(event.target.value, 10);
    };

    // @ts-ignore
    private onPlaceStake = async (event: any) => {
        if (this.store.amount > 0) {
            await perlin.placeStake(this.store.amount);
        }
    };

    // @ts-ignore
    private onWithdrawStake = async (event: any) => {
        if (this.store.amount > 0) {
            await perlin.withdrawStake(this.store.amount);
        }
    };
}

export { StakePanel };
