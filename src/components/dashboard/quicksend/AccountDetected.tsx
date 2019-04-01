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
import { QRCode } from "react-qr-svg";

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
}

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

const SendPerlsInput = styled.input`
    font-family: HKGrotesk;
    background-color: #121834;
    border-radius: 5px;
    border: 1px solid #2e345100;
    color: white;
    width: 100%;
    padding: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
    &:hover {
        cursor: text;
        border: 1px solid #4a41d1;
    }
    &:focus {
        border: 1px solid #4a41d1;
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
            recipient: this.props.recipientID
        };
        this.updateInputPerls = this.updateInputPerls.bind(this);
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    }
    public componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.fixRecipient === false) {
            this.setState({ recipient: nextProps.recipientID });
        }
    }
    /*getRecipientBalance = async (recipientID: string) => {
        try {
            return await perlin.getAccount(recipientID);
        } catch (err) {
            console.log(err);
        }
    };*/
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
                                style={{ fontWeight: 500, fontSize: "16px" }}
                            >
                                Recipient
                            </Box>
                            <Box
                                width={1 / 2}
                                style={{ fontWeight: 500, fontSize: "16px" }}
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
                                    <Box width={1 / 5}>
                                        <QRCode
                                            value={perlin.publicKeyHex}
                                            style={{
                                                width: "40px",
                                                height: "40px"
                                            }}
                                        />
                                    </Box>
                                    <Box width={3 / 5}>
                                        {this.state.recipient}
                                        <br />
                                        Recipient balance:
                                    </Box>
                                </Row>
                            </Box>
                            <Box width={1 / 2} className="break-word">
                                <div>Amount</div>
                                <SendPerlsInput
                                    placeholder="Enter Amount"
                                    value={this.state.inputPerls}
                                    onChange={this.updateInputPerls}
                                />
                                Fee: 0.00001 PERLs
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
                                        onClick={this.handleButtonClick}
                                    >
                                        Send {this.state.inputPerls} PERLs
                                    </SendPerlsButton>
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
                            <div className="perlsSent table-inner">
                                <span style={{ fontWeight: 500 }}>
                                    Your {this.state.inputPerls} PERLs are on
                                    their way!
                                </span>
                                <br />
                                Lorem ipsum
                            </div>
                        </Box>
                    </Row>
                    <Row
                        style={{
                            paddingLeft: "40px",
                            paddingRight: "40px"
                        }}
                    >
                        <Box
                            width={2 / 5}
                            className="break-word vertical-center-align"
                        >
                            From {perlin.publicKeyHex}
                        </Box>
                        <Box
                            width={1 / 5}
                            className="vertical-center-align"
                            style={{ textAlign: "center" }}
                        >
                            <QuickSendArrowIcon />
                        </Box>
                        <Box
                            width={2 / 5}
                            className="break-word vertical-center-align"
                        >
                            To {this.state.recipient}
                        </Box>
                    </Row>
                </div>
            </>
        );
    }
    private updateInputPerls(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ inputPerls: e.target.value });
    }
    private handleButtonClick = () => {
        if (this.state.doubleChecked) {
            if (this.successfulSend()) {
                this.setState({ toggleComponent: "showSendConfirmation" });
            } else {
                this.setState({ toggleComponent: "showDetectedAccount" }); // if fail, toggle fail component
            }
        } else {
            console.log("Please double-check your PERLs before sending");
        }
    };
    private handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
        const doubleChecked = e.target.checked;
        this.setState({ doubleChecked });
    }
    private successfulSend = () => {
        if (
            this.state.inputPerls !== "" &&
            !isNaN(Number(this.state.inputPerls))
        ) {
            perlin.transfer(
                this.state.recipient,
                Number(this.state.inputPerls)
            );
            // further validation required for successful send
            return true;
        } else {
            console.log("not a number");
            return false;
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
}
