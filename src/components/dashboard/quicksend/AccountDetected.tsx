import * as React from "react";
import { Perlin } from "../../../Perlin";
import styled from "styled-components";
import "./quicksend.scss";
import { Flex, Box } from "@rebass/grid";
import { observer } from "mobx-react";
import {
    QuickSendSuccessIcon,
    QuickSendThumbsUpIcon,
    QuickSendArrowIcon,
    CancelCardIcon
} from "../../common/typography";
import { QRCodeWidget } from "../../common/qr";

interface IProps {
    recipientID: string;
    restartComponents: any;
    fixRecipient: boolean;
}

interface IState {
    toggleComponent: string;
    inputPerls: string;
    doubleChecked: boolean;
    recipient: string;
    recipientBalance: number;
    errorMessage: string;
}

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

const InputWrapper = styled.div`
    display: flex;
`;

const SendPerlsInput = styled.input`
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: 400;
    background-color: #121834;
    border-radius: 5px 0px 0px 5px;
    border: 1px solid #2e345100;
    color: white;
    width: 100%;
    padding: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
    height: 48px;
    &:hover {
        cursor: text;
        border: 1px solid #4a41d1;
    }
    &:focus {
        border: 1px solid #4a41d1;
        outline: 0;
    }
    &::placeholder {
        font-size: 16px;
    }
`;

const Fees = styled.button.attrs({ hideOverflow: true })`
    height: 48px;
    border-radius: 0px 5px 5px 0px;
    background-color: #121834;
    font-size: 16px;
    font-weight: 400;
    color: white;
    width: auto;
    display: inline;
    padding: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
    border: 0px;

    &:focus {
        border: 0px;
        outline: 0;
    }
`;

const Divider = styled.button`
    height: 48px;
    background-color: #121834;
    font-size: 24px;
    font-weight: 400;
    color: #3a3f5b;
    width: auto;
    display: inline;
    padding: 0px;
    margin-top: 10px;
    margin-bottom: 10px;
    border: 0px;

    &:focus {
        border: 0px;
        outline: 0;
    }
`;

const SendPerlsButton = styled.button`
    font-family: HKGrotesk;
    font-weight: 600;
    vertical-align: middle;
    text-align: center;
    background-color: #ffffff;
    border-radius: 5px;
    border: 1px solid #00000000;
    color: #151b35;
    width: 100%;
    padding: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
    &:hover {
        cursor: pointer;
        background-color: #d4d5da;
    }
    &:focus {
        background-color: #d4d5da;
        border: 1px solid #4a41d1;
        outline: 0;
    }
`;

const perlin = Perlin.getInstance();

@observer
export default class AccountDetected extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            toggleComponent: "showDetectedAccount",
            inputPerls: "",
            doubleChecked: false,
            recipient: this.props.recipientID,
            recipientBalance: 0,
            errorMessage: ""
        };
        this.updateInputPerls = this.updateInputPerls.bind(this);
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    }
    public componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.fixRecipient === false) {
            this.setState({ recipient: nextProps.recipientID });
        }
    }
    public async componentDidMount() {
        try {
            const balance = await this.getAccountBalance(this.state.recipient);
            this.setState({ recipientBalance: balance });
        } catch (error) {
            // ignore error
        }
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
                    <div
                        style={{
                            backgroundColor: "#1b213d",
                            paddingBottom: "15px",
                            position: "relative"
                        }}
                    >
                        <CancelCardIcon
                            style={{ position: "absolute" }}
                            onClick={this.cancelSend}
                        />
                        <Row>
                            <Box
                                width={1}
                                style={{
                                    backgroundColor: "#171d39",
                                    padding: "15px"
                                }}
                            >
                                <QuickSendSuccessIcon />
                                Detected An Account ID
                            </Box>
                        </Row>
                        <Row
                            className="break-word"
                            style={{
                                paddingLeft: "40px",
                                paddingRight: "40px"
                            }}
                        >
                            <Box
                                width={1 / 2}
                                style={{ fontWeight: 500, fontSize: "20px" }}
                            >
                                Recipient
                            </Box>
                            <Box
                                width={1 / 2}
                                style={{ fontWeight: 500, fontSize: "20px" }}
                            >
                                Send Funds
                            </Box>
                        </Row>
                        <Row
                            className="break-word"
                            style={{
                                paddingLeft: "40px",
                                paddingRight: "40px"
                            }}
                        >
                            <Box width={1 / 2} className="break-word">
                                <Row>
                                    <Box width={2 / 9}>
                                        <QRCodeWidget
                                            publicKeyHex={this.state.recipient}
                                            width={90}
                                            height={90}
                                            clickable={true}
                                        />
                                    </Box>
                                    <Box
                                        width={5 / 9}
                                        style={{
                                            paddingTop: "15px",
                                            fontSize: "16px",
                                            fontWeight: 500,
                                            paddingLeft: "20px"
                                        }}
                                    >
                                        <div>
                                            {this.state.recipient}
                                            <br />
                                            <span
                                                style={{
                                                    fontWeight: 400,
                                                    fontSize: "12px",
                                                    opacity: 0.6
                                                }}
                                            >
                                                Recipient balance:{" "}
                                                {this.state.recipientBalance}
                                            </span>
                                        </div>
                                    </Box>
                                </Row>
                            </Box>
                            <Box width={1 / 2} className="break-word">
                                <div>Amount</div>
                                <InputWrapper>
                                    <SendPerlsInput
                                        placeholder="Enter Amount"
                                        value={this.state.inputPerls}
                                        onChange={this.updateInputPerls}
                                    />
                                    <Divider>|</Divider>
                                    <Fees>Fee:&nbsp;0.00001&nbsp;PERLs</Fees>
                                </InputWrapper>

                                <div
                                    style={{
                                        marginTop: "20px",
                                        marginBottom: "20px"
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        name="confirmSendPerls"
                                        checked={this.state.doubleChecked}
                                        onChange={this.handleCheckboxChange}
                                        style={{
                                            border: "1px solid #3a3f5b",
                                            backgroundColor: "#00000000",
                                            marginRight: "5px"
                                        }}
                                    />
                                    I have double checked the address
                                </div>
                                <div>
                                    <SendPerlsButton
                                        onClick={this.handleSendButton}
                                    >
                                        Send {this.state.inputPerls} PERLs
                                    </SendPerlsButton>
                                </div>
                                <div>
                                    <this.ErrorMessage />
                                </div>
                            </Box>
                        </Row>
                    </div>
                </div>

                <div
                    className={
                        this.state.toggleComponent === "showSendConfirmation"
                            ? "displayComp"
                            : "hideComp"
                    }
                    style={{
                        backgroundColor: "#1b213d",
                        paddingBottom: "15px",
                        position: "relative"
                    }}
                >
                    <CancelCardIcon
                        style={{ position: "absolute" }}
                        onClick={this.cancelSend}
                    />
                    <Row style={{ padding: "40px 20px 40px 40px" }}>
                        <Box width={1 / 7}>
                            <QuickSendThumbsUpIcon />
                        </Box>
                        <Box
                            width={4 / 7}
                            style={{ height: "100px" }}
                            className="table-outer"
                        >
                            <div className="perlsSent table-inner break-word-normal">
                                <span style={{ fontWeight: 500 }}>
                                    Your {this.state.inputPerls} PERLs are on
                                    their way!
                                </span>
                                <br />
                                <span style={{ opacity: 0.6 }}>
                                    Your PERL tokens are being processed by our
                                    lighting fast consensus mechanism and will
                                    be transferred in a few seconds.
                                </span>
                            </div>
                        </Box>
                    </Row>
                    <Row
                        style={{
                            padding: "40px",
                            border: "1px solid #686C7C",
                            borderRadius: "4px",
                            marginLeft: "20px",
                            marginRight: "20px"
                        }}
                    >
                        <Box
                            width={1 / 8}
                            className="break-word vertical-center-align"
                        >
                            <QRCodeWidget
                                publicKeyHex={perlin.publicKeyHex}
                                width={40}
                                height={40}
                                clickable={true}
                            />
                        </Box>
                        <Box width={3 / 8} className="break-word">
                            <div
                                style={{
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    paddingLeft: "10px",
                                    paddingTop: "7px"
                                }}
                            >
                                {perlin.publicKeyHex}
                                <br />
                                <span style={{ opacity: 0.6 }}>
                                    My Balance: {perlin.account.balance}
                                </span>
                            </div>
                        </Box>
                        <Box
                            width={2 / 8}
                            className="vertical-center-align"
                            style={{ textAlign: "center" }}
                        >
                            <QuickSendArrowIcon style={{ paddingTop: 15 }} />
                        </Box>
                        <Box
                            width={1 / 8}
                            className="break-word vertical-center-align"
                        >
                            <QRCodeWidget
                                publicKeyHex={this.state.recipient}
                                width={40}
                                height={40}
                                clickable={true}
                            />
                        </Box>
                        <Box width={3 / 8} className="break-word">
                            <div
                                style={{
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    paddingLeft: "10px",
                                    paddingTop: "7px"
                                }}
                            >
                                {this.state.recipient}
                                <br />
                                <span style={{ opacity: 0.6 }}>
                                    Recipient Balance:{" "}
                                    {this.state.recipientBalance}
                                </span>
                            </div>
                        </Box>
                    </Row>
                </div>
            </>
        );
    }

    private updateInputPerls(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ inputPerls: e.target.value });
    }
    private handleSendButton = () => {
        const successfulSend = this.successfulSend();
        if (successfulSend === "Success") {
            this.setState({
                toggleComponent: "showSendConfirmation",
                errorMessage: "Success"
            });
        } else {
            this.setState({
                toggleComponent: "showDetectedAccount",
                errorMessage: successfulSend
            }); // if fail, toggle error component
        }
    };
    private handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
        const doubleChecked = e.target.checked;
        this.setState({ doubleChecked });
    }
    private successfulSend = () => {
        if (
            this.state.inputPerls === "" ||
            isNaN(Number(this.state.inputPerls))
        ) {
            return "Invalid input";
        } else if (this.state.doubleChecked === false) {
            return "No double-check";
        } else {
            perlin.transfer(
                this.state.recipient,
                Number(this.state.inputPerls)
            );
            // further validation required for successful send
            return "Success";
        }
    };
    private ErrorMessage = () => {
        if (this.state.errorMessage === "Invalid input") {
            return (
                <div style={{ color: "red" }}>
                    Please enter a valid number of PERLs.
                </div>
            );
        } else if (this.state.errorMessage === "No double-check") {
            return (
                <div style={{ color: "red" }}>
                    Please double-check the recipient address.
                </div>
            );
        } else {
            return null;
        }
    };
    private cancelSend = () => {
        this.props.restartComponents(true);
        this.setState({
            toggleComponent: "showDetectedAccount",
            inputPerls: "",
            doubleChecked: false
        });
    };
    private async getAccountBalance(recipientID: string) {
        const account = await perlin.getAccount(recipientID);
        return account ? account.balance : 0;
    }
}
