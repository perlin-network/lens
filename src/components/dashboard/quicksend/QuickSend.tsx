import * as React from "react";
import styled from "styled-components";
import SendFail from "./SendFail";
import AccountDetected from "./AccountDetected";
import "./quicksend.scss";
import QuickSendInputAnimation from "./QuickSendInputAnimation";
import SendFailAnimation from "./SendFailAnimation";

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

const Wrapper = styled.div`
    perspective: 60vw;
    perspective-origin: 30% calc(100% - 60px);
    transform-style: preserve-3d;
`;

interface IState {
    toggleComponent: string;
    inputID: string;
    sendInputFocused: boolean;
}

export default class QuickSend extends React.Component<{}, IState> {
    constructor(props: any) {
        super(props);
        this.state = {
            toggleComponent: "",
            inputID: "",
            sendInputFocused: false
        };
        this.updateinputID = this.updateinputID.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.handleRestart = this.handleRestart.bind(this);
    }
    public render() {
        return (
            <Wrapper>
                <QuickSendHeading>Quick Send</QuickSendHeading>
                <p style={{ opacity: 0.6 }} className="break-word-normal">
                    Input a contract/transaction ID or address to view
                    interaction options.
                </p>

                <QuickSendInputAnimation in={this.state.sendInputFocused}>
                    <QuickSendInput
                        placeholder="Enter an account ID, Contract ID or Transaction ID"
                        value={this.state.inputID}
                        onChange={this.updateinputID}
                        onKeyDown={this.onKeyDown}
                        onFocus={this.onSendInputFocus}
                        onBlur={this.onSendInputBlur}
                    />
                </QuickSendInputAnimation>

                <AccountDetected
                    recipientID={this.state.inputID}
                    changeComponent={this.handleRestart}
                    toggleComponent={this.state.toggleComponent}
                    fixRecipient={
                        this.state.toggleComponent === "showDetectedAccount"
                            ? true
                            : false
                    }
                />

                <SendFailAnimation
                    in={this.state.toggleComponent === "showSendFail"}
                >
                    <SendFail restartComponents={this.handleRestart} />
                </SendFailAnimation>
            </Wrapper>
        );
    }

    private onSendInputFocus = () => {
        this.setState({
            sendInputFocused: true
        });
    };

    private onSendInputBlur = () => {
        if (this.state.toggleComponent === "") {
            this.setState({
                sendInputFocused: false
            });
        }
    };
    private updateinputID(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        this.setState({ inputID: value });
    }
    private onKeyDown(e: any) {
        if (e.keyCode === 13) {
            if (this.validInputID()) {
                this.setState({ toggleComponent: "showDetectedAccount" });
            } else {
                this.setState({ toggleComponent: "showSendFail" }); // if fail, toggle fail component
            }
        }
        if (e.keyCode === 27) {
            this.setState({ toggleComponent: "" });
        }
    }
    private validInputID = () => {
        const re = /[0-9A-Fa-f]{64}/g;
        return re.test(this.state.inputID) && this.state.inputID.length === 64;
    };
    private handleRestart(component: string) {
        this.setState({ toggleComponent: component });
        // we want to wait the AccountDetected component before
        setTimeout(() => {
            this.onSendInputBlur();
        }, 400);
    }
}
