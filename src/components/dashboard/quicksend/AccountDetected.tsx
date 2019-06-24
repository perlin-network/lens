import * as React from "react";
import { Perlin, NotificationTypes } from "../../../Perlin";
import styled from "styled-components";
import "./quicksend.scss";
import { Flex, Box } from "@rebass/grid";
import { observer } from "mobx-react";
import {
    QuickSendThumbsUpIcon,
    QuickSendArrowIcon,
    CancelCardIcon
} from "../../common/typography";
import DeltaTag, { DeltaTagWrapper } from "../../common/deltaTag";
import { QRCodeWidget } from "../../common/qr";
import AccountDetectedAnimation from "./AccountDetectedAnimation";
import { Link } from "react-router-dom";

interface IProps {
    recipient: any;
    changeComponent: (component: string) => void;
    toggleComponent: string;
    validContract: boolean;
}

interface IState {
    inputPerls: string;
    doubleChecked: boolean;
    errorMessage: string;
    gasLimit?: number;
}

const Wrapper = styled.div`
    ${CancelCardIcon} {
        position: absolute;
        top: 25px;
    }
`;

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

const InputWrapper = styled.div`
    display: flex;
`;
const DetailsLinkWrapper = styled.div`
    padding: 0 20px 20px 20px;
    a {
        color: #fff !important;
        margin-left: 5px;
    }
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
const GasLimitsInput = styled(SendPerlsInput)`
    max-width: calc(100% - 180px);
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
    white-space: nowrap;

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
    margin: 10px 0;
    border: 0px;

    &:focus {
        border: 0px;
        outline: 0;
    }
`;

const AccountDetectedContent = styled.div`
    position: relative;
    background-color: #1b213d;
    padding-top: 20px;
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
    padding: 15px;

    min-width: 110px;

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

const InfoTable = styled.table`
    font-weight: 400;
    font-size: 12px;
    background: #121734;
    border-radius: 5px;
    table-layout: fixed;
    width: calc(100% - 40px);
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 10px;
    border: solid 1px #34374a;
`;

const InfoLine = styled.tr`
    .label,
    .value {
        padding: 8px 10px;
        min-width: 0;
        border-bottom: solid 2px #1a203d;
        vertical-align: top;
    }
    .label {
        width: 60px;
        white-space: nowrap;
        opacity: 0.6;
    }
`;
const TransferIntroRow = styled(Row)`
    padding: 20px 20px 0 40px;
    color: #a6aab1;
    font-size: 18px;

    h4 {
        color: #fff;
        font-size: 22px;
        margin: 10px 0;
    }
`;
const TransferRow = styled(Row)`
    padding: 20px;
    border: 1px solid #686c7c;
    border-radius: 5px;
    margin: 0 20px 20px;
    color: #a6aab1;
    line-height: 1.6;

    .address {
        color: #fff;
        font-weight: 400;
        font-size: 16px;
        margin: 5px 0;
    }

    .balance {
        margin-right: 5px;
    }
`;
const perlin = Perlin.getInstance();

@observer
export default class AccountDetected extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            inputPerls: "",
            doubleChecked: false,
            errorMessage: ""
        };
        this.updateInputPerls = this.updateInputPerls.bind(this);
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    }

    public render() {
        const { recipient } = this.props;
        return (
            <Wrapper>
                <AccountDetectedAnimation
                    in={this.props.toggleComponent === "showDetectedAccount"}
                >
                    <AccountDetectedContent>
                        <CancelCardIcon onClick={this.cancelSend} />
                        <Flex
                            className="break-word"
                            style={{
                                padding: "0 20px"
                            }}
                            mb={3}
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
                                Send PERLs
                            </Box>
                        </Flex>
                        <Flex
                            className="break-word"
                            style={{
                                padding: "0 20px 20px"
                            }}
                        >
                            <Box width={1 / 2} className="break-word">
                                <InfoTable>
                                    <tbody>
                                        <InfoLine>
                                            <td className="label">Balance</td>
                                            <td className="value">
                                                {recipient.balance}
                                            </td>
                                        </InfoLine>
                                        <InfoLine>
                                            <td className="label">Reward</td>
                                            <td className="value">
                                                {recipient.reward}
                                            </td>
                                        </InfoLine>
                                        <InfoLine>
                                            <td className="label">Stake</td>
                                            <td className="value">
                                                {recipient.stake}
                                            </td>
                                        </InfoLine>
                                        {typeof recipient.nonce !==
                                            "undefined" && (
                                            <InfoLine>
                                                <td className="label">Nonce</td>
                                                <td className="value">
                                                    {recipient.nonce}
                                                </td>
                                            </InfoLine>
                                        )}
                                    </tbody>
                                </InfoTable>
                            </Box>
                            <Box width={1 / 2} className="break-word">
                                <InputWrapper>
                                    <SendPerlsInput
                                        placeholder="Enter Amount"
                                        value={this.state.inputPerls}
                                        onChange={this.updateInputPerls}
                                    />
                                    <Divider>|</Divider>
                                    <Fees>Fee: 2 PERLs</Fees>
                                </InputWrapper>

                                {this.props.validContract && (
                                    <Flex
                                        justifyContent="space-between"
                                        alignItems="center"
                                    >
                                        <GasLimitsInput
                                            placeholder="Gas Limit"
                                            value={this.state.gasLimit}
                                            onChange={this.updateGasLimit}
                                        />

                                        <SendPerlsButton
                                            onClick={this.handleSendButton}
                                        >
                                            Send {this.state.inputPerls} PERLs
                                        </SendPerlsButton>
                                    </Flex>
                                )}

                                <Flex
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Flex alignItems="top">
                                        <input
                                            type="checkbox"
                                            id="confirmSendPerls"
                                            name="confirmSendPerls"
                                            checked={this.state.doubleChecked}
                                            onChange={this.handleCheckboxChange}
                                            style={{
                                                border: "1px solid #3a3f5b",
                                                backgroundColor: "#00000000",
                                                margin: "2px 10px 0 0"
                                            }}
                                        />
                                        <label
                                            htmlFor="confirmSendPerls"
                                            style={{
                                                flex: 1,
                                                marginRight: "10px"
                                            }}
                                        >
                                            I have double checked the address
                                        </label>
                                    </Flex>
                                    {!this.props.validContract && (
                                        <Box>
                                            <SendPerlsButton
                                                onClick={this.handleSendButton}
                                            >
                                                Send {this.state.inputPerls}{" "}
                                                PERLs
                                            </SendPerlsButton>
                                        </Box>
                                    )}
                                </Flex>
                            </Box>
                        </Flex>
                        {this.props.validContract && (
                            <DetailsLinkWrapper>
                                Valid Contract ID has been detected.
                                <Link
                                    to={`/transactions/${
                                        this.props.recipient.public_key
                                    }`}
                                >
                                    <b>
                                        <u>Go to the detail</u>.
                                    </b>
                                </Link>
                            </DetailsLinkWrapper>
                        )}
                    </AccountDetectedContent>
                </AccountDetectedAnimation>

                <AccountDetectedAnimation
                    in={this.props.toggleComponent === "showSendConfirmation"}
                >
                    <CancelCardIcon onClick={this.cancelSend} />
                    <TransferIntroRow>
                        <Box width={1 / 7}>
                            <QuickSendThumbsUpIcon />
                        </Box>
                        <Box width={4 / 7} className="table-outer">
                            <div className="table-inner break-word-normal">
                                <h4>
                                    Your {this.state.inputPerls} PERLs are on
                                    their way!
                                </h4>
                                <p>
                                    Your PERL tokens are being processed by our
                                    lighting fast consensus mechanism and will
                                    be transferred in a few seconds.
                                </p>
                            </div>
                        </Box>
                    </TransferIntroRow>
                    <TransferRow>
                        <Box
                            mr={3}
                            className="break-word vertical-center-align"
                        >
                            <QRCodeWidget
                                publicKeyHex={perlin.publicKeyHex}
                                width={48}
                                height={48}
                                clickable={true}
                                top={20}
                            />
                        </Box>
                        <Box width={3 / 8} className="break-word">
                            <div className="address">{perlin.publicKeyHex}</div>
                            <span className="balance">
                                My Balance: {perlin.account.balance}{" "}
                            </span>
                            <DeltaTag value={-this.state.inputPerls} />
                        </Box>
                        <Box
                            ml={2}
                            mr={2}
                            pt={3}
                            width={1 / 8}
                            className="vertical-center-align"
                            style={{ textAlign: "center" }}
                        >
                            <QuickSendArrowIcon />
                        </Box>
                        <Box
                            mr={3}
                            className="break-word vertical-center-align"
                        >
                            <QRCodeWidget
                                publicKeyHex={recipient.public_key}
                                width={48}
                                height={48}
                                clickable={true}
                                top={20}
                            />
                        </Box>
                        <Box width={3 / 8} className="break-word">
                            <div className="address">
                                {recipient.public_key}
                            </div>
                            <span className="balance">
                                Recipient Balance: {recipient.balance}
                            </span>
                            <DeltaTag value={this.state.inputPerls} />
                        </Box>
                    </TransferRow>
                </AccountDetectedAnimation>
            </Wrapper>
        );
    }
    private updateGasLimit = (e: React.ChangeEvent<HTMLInputElement>) => {
        const gasLimit = parseInt(e.target.value, 10);
        this.setState({ gasLimit });
    };
    private updateInputPerls(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ inputPerls: e.target.value });
    }
    private handleSendButton = () => {
        if (this.successfulSend()) {
            this.props.changeComponent("showSendConfirmation");
        }
    };
    private handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
        const doubleChecked = e.target.checked;
        this.setState({ doubleChecked });
    }

    private successfulSend = () => {
        if (
            this.props.validContract &&
            (!this.state.gasLimit || isNaN(this.state.gasLimit))
        ) {
            perlin.notify({
                type: NotificationTypes.Danger,
                message: "Please enter a valid Gas Limit"
            });
            return;
        }
        if (
            this.state.inputPerls === "" ||
            isNaN(Number(this.state.inputPerls)) ||
            Number(this.state.inputPerls) <= 0
        ) {
            perlin.notify({
                type: NotificationTypes.Danger,
                message: "Please enter a valid number of PERLs"
            });
            return false;
        } else if (this.state.doubleChecked === false) {
            perlin.notify({
                type: NotificationTypes.Danger,
                message: "Please double-check the recipient address"
            });
            return false;
        } else {
            perlin
                .transfer(
                    this.props.recipient.public_key,
                    Number(this.state.inputPerls),
                    this.state.gasLimit
                )
                .then(response => {
                    perlin.notify({
                        title: "PERLs Sent",
                        type: NotificationTypes.Success,
                        // message: "You can view your transactions details here"
                        content: (
                            <p>
                                You can view your transaction
                                <Link
                                    to={"/transactions/" + response.tx_id}
                                    title={response.tx_id}
                                    target="_blank"
                                >
                                    here
                                </Link>
                            </p>
                        ),
                        dismiss: { duration: 10000 }
                    });
                });
            // further validation required for successful send
            return true;
        }
    };

    private cancelSend = () => {
        this.props.changeComponent("");
        this.setState({
            inputPerls: "",
            doubleChecked: false
        });
    };
}
