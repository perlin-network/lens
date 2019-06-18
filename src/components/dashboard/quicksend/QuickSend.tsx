import * as React from "react";
import styled from "styled-components";
import SendFail from "./SendFail";
import AccountDetected from "./AccountDetected";
import "./quicksend.scss";
import QuickSendInputAnimation from "./QuickSendInputAnimation";
import SendFailAnimation from "./SendFailAnimation";
import { Perlin } from "../../../Perlin";
import TxDetectedAnimation from "./TxDetectedAnimation";
import TxDetected from "./TxDetected";
import InputIconSVG from "../../../assets/svg/lens-icon.svg";

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
    width: 100%;
    padding: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
    padding-left: 45px;
    font-size: 20px;

    &::placeholder {
        font-size: 20px;
    }
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

const InputIcon = styled.img.attrs({ src: InputIconSVG })`
    position: fixed;
    left: 16px;
    top: 45%;
    -webkit-transform: translateY(-45%);
    -ms-transform: translateY(-45%);
    transform: translateY(-45%);
    width: 20px;
    height: 20px;
`;

const StyledTag = styled.span`
    position: fixed;
    border: solid 1px #fff;
    padding: 3px 5px;
    border-radius: 3px;
    right: 16px;
    top: 45%;
    -webkit-transform: translateY(-45%);
    -ms-transform: translateY(-45%);
    transform: translateY(-45%);
    opacity: 0.4;
`;

interface IState {
    toggleComponent: string;
    recipientID: string;
    inputID: string;
    sendInputFocused: boolean;
    recipientBalance: string;
    validAccount: boolean;
    validContract: boolean;
    validTx: boolean;
}

const perlin = Perlin.getInstance();

export default class QuickSend extends React.Component<{}, IState> {
    constructor(props: any) {
        super(props);
        this.state = {
            // todo : better to use enum
            toggleComponent: "",
            recipientID: "",
            inputID: "",
            sendInputFocused: false,
            recipientBalance: "0",
            validAccount: false,
            validContract: false,
            validTx: false
        };
        this.updateinputID = this.updateinputID.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.handleRestart = this.handleRestart.bind(this);
    }
    public render() {
        return (
            <Wrapper>
                <QuickSendInputAnimation in={this.state.sendInputFocused}>
                    <InputIcon />
                    <QuickSendInput
                        placeholder="Wallet Address / Smart Contract Address / Transaction ID"
                        value={this.state.inputID}
                        onChange={this.updateinputID}
                        onKeyDown={this.onKeyDown}
                        onFocus={this.onSendInputFocus}
                        onBlur={this.onSendInputBlur}
                    />
                    {this.state.validTx && (
                        <StyledTag>Transaction ID</StyledTag>
                    )}
                    {this.state.validContract && (
                        <StyledTag>Contract ID</StyledTag>
                    )}
                    {this.state.validAccount && (
                        <StyledTag>Account ID</StyledTag>
                    )}
                </QuickSendInputAnimation>

                <AccountDetected
                    recipientID={this.state.recipientID}
                    recipientBalance={this.state.recipientBalance}
                    changeComponent={this.handleRestart}
                    toggleComponent={this.state.toggleComponent}
                />

                <SendFailAnimation
                    in={this.state.toggleComponent === "showSendFail"}
                >
                    <SendFail restartComponents={this.handleRestart} />
                </SendFailAnimation>

                <TxDetectedAnimation
                    in={this.state.toggleComponent === "showDetectedTx"}
                >
                    <TxDetected
                        txId={this.state.inputID}
                        restartComponents={this.handleRestart}
                        validContract={this.state.validContract}
                        validTx={this.state.validTx}
                    />
                </TxDetectedAnimation>
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
    private async onKeyDown(e: any) {
        this.setState({
            validAccount: false,
            validContract: false,
            validTx: false
        });
        if (e.keyCode === 13) {
            if (await this.validtxId()) {
                this.setState({
                    toggleComponent: "showDetectedTx"
                });
            } else if (this.validInputID()) {
                const balance: string = await this.getAccountBalance(
                    this.state.inputID
                );

                this.setState({
                    toggleComponent: "showDetectedAccount",
                    recipientBalance: balance,
                    recipientID: this.state.inputID,
                    validAccount: true
                });
            } else {
                this.setState({ toggleComponent: "showSendFail" }); // if fail, toggle fail component
            }
        } else {
            this.setState({ toggleComponent: "" });
        }
    }
    private validInputID = () => {
        const re = /[0-9A-Fa-f]{64}/g;
        return re.test(this.state.inputID) && this.state.inputID.length === 64;
    };
    private validtxId = async (): Promise<boolean> => {
        const txId = this.state.inputID;
        try {
            const payload = await perlin.getTransaction(txId);
            if (payload.tag && payload.tag === 2) {
                this.setState({
                    validContract: true
                });
            } else {
                this.setState({
                    validTx: true
                });
            }
            return Promise.resolve(true);
        } catch (e) {
            console.error(e);
            return Promise.resolve(false);
        }
    };
    private handleRestart(component: string) {
        this.setState({ toggleComponent: component });
        // we want to wait the AccountDetected component before
        setTimeout(() => {
            this.onSendInputBlur();
        }, 400);
    }

    private async getAccountBalance(recipientID: string) {
        let balance = "0";
        try {
            const account = await perlin.getAccount(recipientID);
            balance = account ? account.balance : "0";
        } catch (error) {
            console.error(error);
        }
        return balance;
    }
}
