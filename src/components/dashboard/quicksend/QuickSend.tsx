import * as React from "react";
import styled from "styled-components";
import SendFail from "./SendFail";
import AccountDetected from "./AccountDetected";
import "./quicksend.scss";

const QuickSendHeading = styled.p`
    font-family: Montserrat;
    font-size: 30px;
    color: #fff;
    margin-bottom: 15px;
    font-weight: 400;
`;

const QuickSendInput = styled.input`
    font-family: HKGrotesk;
    background-color: #171d39;
    border-radius: 5px;
    border: 1px solid #2e345100;
    color: white;
    width: 75%;
    padding: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
    &:hover {
        cursor: text;
        border: 1px solid #4a41d1;
    }
    &:focus {
        cursor: text;
        border: 1px solid #4a41d1;
        outline: 0;
    }
`;

interface IState {
    toggleComponent: string;
    inputID: string;
}

export default class QuickSend extends React.Component<{}, IState> {
    constructor(props: any) {
        super(props);
        this.state = {
            toggleComponent: "",
            inputID: ""
        };
        this.updateinputID = this.updateinputID.bind(this);
        this.onEnter = this.onEnter.bind(this);
        this.handleRestart = this.handleRestart.bind(this);
    }

    public render() {
        return (
            <>
                <QuickSendHeading>Quick Send</QuickSendHeading>
                <p style={{ opacity: 0.6 }} className="break-word-normal">
                    Input a contract/transaction ID or address to view
                    interaction options.
                </p>
                <QuickSendInput
                    placeholder="Enter an account ID, Contract ID or Transaction ID"
                    value={this.state.inputID}
                    onChange={this.updateinputID}
                    onKeyDown={this.onEnter}
                />
                <div
                    className={
                        this.state.toggleComponent === "showDetectedAccount"
                            ? "displayComp"
                            : "hideComp"
                    }
                >
                    <AccountDetected
                        recipientID={this.state.inputID}
                        restartComponents={this.handleRestart}
                        fixRecipient={
                            this.state.toggleComponent === "showDetectedAccount"
                                ? true
                                : false
                        }
                    />
                </div>
                <div
                    className={
                        this.state.toggleComponent === "showSendFail"
                            ? "displayComp"
                            : "hideComp"
                    }
                >
                    <SendFail restartComponents={this.handleRestart} />
                </div>
            </>
        );
    }
    private updateinputID(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        this.setState({ inputID: value });
    }
    private onEnter(e: any) {
        if (e.keyCode === 13) {
            if (this.validInputID()) {
                this.setState({ toggleComponent: "showDetectedAccount" });
            } else {
                this.setState({ toggleComponent: "showSendFail" }); // if fail, toggle fail component
            }
        }
    }
    private validInputID = () => {
        const re = /[0-9A-Fa-f]{64}/g;
        return re.test(this.state.inputID);
    };
    private handleRestart(restart: boolean) {
        if (restart) {
            this.setState({ toggleComponent: "" });
        }
    }
}
