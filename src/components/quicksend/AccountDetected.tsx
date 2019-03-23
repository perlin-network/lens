import * as React from "react";
import { Perlin } from "../../Perlin";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../common/typography";
import "./quicksend.scss";

interface IState {
    toggleComponent: string;
    inputPerls: string;
}
const perlin = Perlin.getInstance();

export default class AccountDetected extends React.Component<{}, IState> {
    constructor(props: any) {
        super(props);
        this.state = {
            toggleComponent: "showDetectedAccount",
            inputPerls: ""
        };
        this.updateInputPerls = this.updateInputPerls.bind(this);
    }
    public render() {
        return (
            <>
                <div
                    className={
                        this.state.toggleComponent === "showDetectedAccount"
                            ? "displayComp"
                            : "hideComp"
                    }
                >
                    <div className="detected-grid">
                        <div className="detected-outer-header">
                            Detected An Account ID
                        </div>
                        <div className="detected-outer-recipient">
                            Recipient
                        </div>
                        <div className="detected-outer-recipient-content">
                            QR code and stuff
                        </div>
                        <div className="detected-outer-sendfunds">
                            Send Funds
                        </div>
                        <div className="detected-outer-sendfunds-content">
                            <div className="detected-inner-amount">Amount</div>
                            <div className="detected-inner-address">
                                <input
                                    placeholder="Enter Amount"
                                    value={this.state.inputPerls}
                                    onChange={this.updateInputPerls}
                                />
                            </div>
                            <div className="detected-inner-checked">
                                Double checked
                            </div>
                            <div className="detected-inner-sendperls">
                                <button onClick={this.handleButtonClick}>
                                    Send Perls
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        this.state.toggleComponent === "showSendConfirmation"
                            ? "displayComp"
                            : "hideComp"
                    }
                >
                    Your {this.state.inputPerls} PERLs are on their way!
                    <br />
                    From {perlin.publicKeyHex}
                    <br />
                </div>
            </>
        );
    }
    private updateInputPerls(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        this.setState({ inputPerls: value });
    }
    private handleButtonClick = () => {
        if (this.successfulSend()) {
            this.setState({ toggleComponent: "showSendConfirmation" });
        } else {
            this.setState({ toggleComponent: "showDetectedAccount" }); // if fail, toggle fail component
        }
    };
    private successfulSend = () => {
        if (this.state.inputPerls !== "") {
            return true;
        } else {
            return false;
        }
    };
}
