import * as React from "react";
import { Perlin } from "../../../Perlin";
import styled from "styled-components";
import "./quicksend.scss";
import { Flex, Box } from "@rebass/grid";
import { observer } from "mobx-react";
import {
    QuickSendSuccessIcon,
    QuickSendThumbsUpIcon,
    QuickSendArrowIcon
} from "../../common/typography";
import { QRCode } from "react-qr-svg";

interface IProps {
    recipientID: string;
}

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

interface IState {
    toggleComponent: string;
    inputPerls: string;
}

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
`;

const perlin = Perlin.getInstance();

@observer
export default class AccountDetected extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            toggleComponent: "showDetectedAccount",
            inputPerls: ""
        };
        this.updateInputPerls = this.updateInputPerls.bind(this);
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
                            paddingBottom: "20px"
                        }}
                    >
                        <Row>
                            <Box
                                width={1}
                                style={{
                                    backgroundColor: "#171d39",
                                    padding: "20px"
                                }}
                            >
                                <QuickSendSuccessIcon />
                                Detected An Account ID
                            </Box>
                        </Row>
                        <Row className="left-right-padding break-word">
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
                        <Row>
                            <Box
                                width={1 / 2}
                                className="left-right-padding break-word"
                            >
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
                                        {this.props.recipientID}
                                        <br />
                                        Recipient balance:
                                    </Box>
                                </Row>
                            </Box>
                            <Box
                                width={1 / 2}
                                className="right-padding break-word"
                            >
                                <div>Amount</div>
                                <div>
                                    <SendPerlsInput
                                        placeholder="Enter Amount"
                                        value={this.state.inputPerls}
                                        onChange={this.updateInputPerls}
                                    />
                                </div>
                                <div
                                    style={{
                                        marginTop: "20px",
                                        marginBottom: "20px"
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        name="confirmSendPerls"
                                        value="confirmSendPerls"
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
                        paddingBottom: "20px"
                    }}
                >
                    <Row style={{ padding: "40px" }}>
                        <Box width={1 / 6}>
                            <QuickSendThumbsUpIcon />
                        </Box>
                        <Box width={3 / 6} style={{ height: "100px" }}>
                            <div style={{ verticalAlign: "middle" }}>
                                <span style={{ fontWeight: 500 }}>
                                    Your {this.state.inputPerls} PERLs are on
                                    their way!
                                </span>
                                <br />
                                Lorem ipsum
                            </div>
                        </Box>
                    </Row>
                    <Row style={{ padding: "20px" }}>
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
                            To {this.props.recipientID}
                        </Box>
                    </Row>
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
        if (
            this.state.inputPerls !== "" &&
            !isNaN(Number(this.state.inputPerls))
        ) {
            perlin.transfer(
                this.props.recipientID,
                Number(this.state.inputPerls)
            );
            // further validation required for successful send
            return true;
        } else {
            console.log("not a number");
            return false;
        }
    };
}
