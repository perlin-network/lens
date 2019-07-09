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
    background-color: #0b122b;
    border-radius: 5px;
    border: none;
    color: white;
    width: 100%;
    padding: 15px 15px 12px;
    padding-left: 45px;
    font-size: 20px;
    transition: all 0.2s ease;

    &::placeholder {
        font-size: 20px;
    }
    &:hover,
    &:focus {
        cursor: text;
        box-shadow: 0 0 0 1px #4a41d1;
        outline: 0;
    }
`;

const Wrapper = styled.div`
    perspective: 60vw;
    perspective-origin: 30% calc(100% - 60px);
    transform-style: preserve-3d;
    border: 1px solid #34374b;
    border-radius: 5px;
`;

const InputIcon = styled.img.attrs({ src: InputIconSVG })`
    position: fixed;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
`;

const StyledTag = styled.span`
    position: fixed;
    border: solid 1px #fff;
    padding: 3px 5px;
    border-radius: 3px;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.4;
`;

interface IState {
    toggleComponent: string;
    recipientID: string;
    inputID: string;
    sendInputFocused: boolean;
    recipient: any;
    validAccount: boolean;
    validContract: boolean;
    validTx: boolean;
    payload?: any;
}

const perlin = Perlin.getInstance();

export default class QuickSend extends React.Component<{}, IState> {
    private poll: WebSocket;

    constructor(props: any) {
        super(props);
        this.state = {
            // todo : better to use enum
            toggleComponent: "",
            recipientID: "",
            inputID: "",
            sendInputFocused: false,
            recipient: {},
            validAccount: false,
            validContract: false,
            validTx: false
        };
        this.updateinputID = this.updateinputID.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.handleRestart = this.handleRestart.bind(this);
    }
    public componentWillUnmount() {
        this.closePollAccount();
    }
    public componentDidUpdate() {
        if (this.state.toggleComponent === "") {
            this.closePollAccount();
        }
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
                    {this.state.validContract ? (
                        <StyledTag>Contract ID</StyledTag>
                    ) : this.state.validAccount ? (
                        <StyledTag>Account ID</StyledTag>
                    ) : (
                        ""
                    )}
                </QuickSendInputAnimation>

                <AccountDetected
                    recipient={this.state.recipient}
                    validContract={this.state.validContract}
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
                        payload={this.state.payload}
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
        this.setState({ inputID: value }, () => {
            if (value.length === 64) {
                this.checkInput();
            }
        });
    }
    private async pollAccount(id: string, cb: (recipient: any) => void) {
        this.closePollAccount();
        const poll = await perlin.pollAccountUpdates(
            id,
            () => this.state.recipient,
            recipient => {
                cb(recipient);
            }
        );

        this.poll = poll;
    }
    private closePollAccount() {
        if (this.poll) {
            this.poll.close();
        }
    }
    private async checkInput() {
        if (await this.validtxId()) {
            this.setState({
                toggleComponent: "showDetectedTx"
            });
        } else if (this.validInputID()) {
            try {
                const updateRecipient = (recipient: any) => {
                    this.setState({ recipient: { ...recipient } });
                };
                const response = await perlin.getAccount(this.state.inputID);
                this.setState({
                    toggleComponent: "showDetectedAccount",
                    validAccount: true
                });
                updateRecipient(response);

                this.pollAccount(this.state.inputID, updateRecipient);
            } catch (err) {
                console.log(err);
            }
        } else {
            this.setState({ toggleComponent: "showSendFail" }); // if fail, toggle fail component
        }
    }
    private async onKeyDown(e: any) {
        this.setState({
            validAccount: false,
            validContract: false,
            validTx: false
        });
        if (e.keyCode === 13) {
            this.checkInput();
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
                    validContract: true,
                    payload
                });
                return Promise.resolve(false);
            } else {
                this.setState({
                    validTx: true,
                    payload
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
}
