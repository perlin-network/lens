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
import DeltaTag from "../../common/deltaTag";
import { QRCodeWidget } from "../../common/qr";
import { formatBalance, StyledDropdown, InputWrapper } from "../../common/core";
import AccountDetectedAnimation from "./AccountDetectedAnimation";
import {
    Link,
    Redirect,
    withRouter,
    RouteComponentProps
} from "react-router-dom";
import { DividerInput, Divider, DividerAside } from "../../common/dividerInput";
import BigNumber from "bignumber.js";
import GasLimit from "../../common/gas-limit/GasLimit";
import JSBI from "jsbi";
import { TAG_TRANSFER,  } from "wavelet-client";

interface IProps extends RouteComponentProps {
    recipient: any;
    changeComponent: (component: string) => void;
    toggleComponent: string;
    validContract: boolean;
}

interface IState {
    inputPerls: string;
    kens: string;
    doubleChecked: boolean;
    errorMessage: string;
    gasLimit?: string;
    gasDeposit?: string;
    gasChoiceReset: number;
    inputType: string;
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

const DetailsLinkWrapper = styled.div`
    padding-top: 12px;
    a {
        color: #fff !important;
        margin-left: 5px;
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
    margin: 10px 0;
    white-space: nowrap;
    min-width: 110px;

    &:hover,
    &:focus {
        cursor: pointer;
        background-color: #d4d5da;
        border: 1px solid #d4d5da;
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
        width: 80px;
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
const inputTypes = [
    {
        label: "Send",
        value: "send-perls"
    },
    {
        label: "Deposit Gas",
        value: "deposit-gas"
    }
];
const perlin = Perlin.getInstance();

@observer
class AccountDetected extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            inputPerls: "",
            kens: "",
            doubleChecked: false,
            errorMessage: "",
            gasChoiceReset: 0,
            inputType: inputTypes[0].value
        };
        this.updateInputPerls = this.updateInputPerls.bind(this);
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    }

    public render() {
        const { recipient } = this.props;
        const recipientBalance = new BigNumber(recipient.balance);
        const url = `/contracts/${recipient.public_key}`;
        if (
            this.props.validContract &&
            recipient.public_key &&
            this.props.location.pathname !== url
        ) {
            return <Redirect to={url} />;
        }
        const gasLimit = this.state.gasLimit || "";
        let amount = this.state.inputType  === "send-perls" ? this.state.kens : 0;
        const gasDeposit = this.state.inputType  !== "send-perls" ? this.state.kens : 0;
        const fee = perlin.calculateFee(TAG_TRANSFER, recipient.public_key, amount, this.state.gasLimit, gasDeposit);
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
                                                {formatBalance(
                                                    recipient.balance
                                                )}
                                            </td>
                                        </InfoLine>
                                        {this.props.validContract && (
                                            <InfoLine>
                                                <td className="label">
                                                    Gas Balance
                                                </td>
                                                <td className="value">
                                                    {formatBalance(
                                                        recipient.gas_balance
                                                    )}
                                                </td>
                                            </InfoLine>
                                        )}
                                        <InfoLine>
                                            <td className="label">Reward</td>
                                            <td className="value">
                                                {formatBalance(
                                                    recipient.reward
                                                )}
                                            </td>
                                        </InfoLine>
                                        <InfoLine>
                                            <td className="label">Stake</td>
                                            <td className="value">
                                                {formatBalance(recipient.stake)}
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
                                <Flex alignItems="center">
                                    {this.props.validContract && (
                                        <Box mr={2}>
                                            <StyledDropdown
                                                className="fixed-width"
                                                options={inputTypes}
                                                value={this.state.inputType}
                                                onChange={this.handleInputType}
                                            />
                                        </Box>
                                    )}

                                    <InputWrapper>
                                        <DividerInput
                                            placeholder="Enter Amount"
                                            onChange={this.updateInputPerls}
                                        />
                                        <Divider>|</Divider>
                                        <DividerAside>
                                            Fee: {formatBalance(fee)}
                                        </DividerAside>
                                    </InputWrapper>
                                </Flex>

                                <Flex
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    {this.props.validContract && (
                                        <GasLimit
                                            mr={2}
                                            balance={perlin.account.balance}
                                            onChange={this.updateGasLimit}
                                            value={this.state.gasLimit}
                                        />
                                    )}
                                    <Box
                                        title={
                                            !parseInt(gasLimit, 10)
                                                ? "Please enter a valid gas limit"
                                                : ""
                                        }
                                    >
                                        <SendPerlsButton
                                            disabled={
                                                this.props.validContract &&
                                                !parseInt(gasLimit, 10)
                                            }
                                            onClick={this.handleSendButton(fee)}
                                        >
                                            {this.state.inputType ===
                                            inputTypes[1].value
                                                ? "Deposit"
                                                : "Send"}{" "}
                                            {formatBalance(this.state.kens)}
                                        </SendPerlsButton>
                                    </Box>
                                </Flex>
                                {this.props.validContract && (
                                    <DetailsLinkWrapper>
                                        Valid Contract ID has been detected.
                                    </DetailsLinkWrapper>
                                )}
                            </Box>
                        </Flex>
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
                                    Your {formatBalance(this.state.kens)} are on
                                    their way!
                                </h4>
                                <p>
                                    Your PERL token(s) are being processed by
                                    our lighting fast consensus mechanism and
                                    will be transferred in a few seconds.
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
                                My Balance:{" "}
                                {formatBalance(perlin.account.balance)}
                            </span>
                            <DeltaTag
                                value={"-" + formatBalance(this.state.kens)}
                            />
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
                            {this.state.inputType === inputTypes[1].value ? (
                                <span className="balance">
                                    Recipient Gas Balance:{" "}
                                    {/* {numberWithCommas(
                                        new BigNumber(
                                            recipient.gas_balance
                                        ).toString() */}
                                    {formatBalance(
                                        new BigNumber(recipient.gas_balance)
                                            .toString()
                                    )}
                                </span>
                            ) : (
                                <span className="balance">
                                    Recipient Balance:{" "}
                                    {/* {numberWithCommas(
                                        recipientBalance.toString() */}
                                    {formatBalance(
                                        recipientBalance
                                            .toString()
                                    )}
                                </span>
                            )}

                            <DeltaTag value={formatBalance(this.state.kens)} />
                        </Box>
                    </TransferRow>
                </AccountDetectedAnimation>
            </Wrapper>
        );
    }

    private updateGasLimit = (gasLimit: string) => {
        this.setState({ gasLimit });
    };

    private handleInputType = (option: any) => {
        this.setState({ inputType: option.value });
    };

    private updateInputPerls(e: React.ChangeEvent<HTMLInputElement>) {
        const inputPerls = e.target.value;
        const kens = Math.ceil(parseFloat(inputPerls) * Math.pow(10, 9)) + "";
        this.setState({ inputPerls, kens });
    }
    private handleSendButton = (fee: number) => async () => {
        
        if (await this.successfulSend(fee)) {
            this.props.changeComponent("showSendConfirmation");
        }
    };
    private handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
        const doubleChecked = e.target.checked;
        this.setState({ doubleChecked });
    }

    private successfulSend = async (fee: number) => {
        const gasLimit = +(this.state.gasLimit + "");

        let gasLimitNumber = JSBI.BigInt(Math.floor(gasLimit || 0));
        
        gasLimitNumber = JSBI.subtract(gasLimitNumber, JSBI.BigInt(fee));

        let perls = JSBI.BigInt(this.state.kens);

        if (this.props.validContract) {
            if (
                JSBI.lessThanOrEqual(gasLimitNumber, JSBI.BigInt(0)) ||
                JSBI.greaterThan(
                    gasLimitNumber,
                    JSBI.BigInt(perlin.account.balance)
                )
            ) {
                perlin.notify({
                    type: NotificationTypes.Danger,
                    message: "Please enter a valid Gas Limit"
                });
                return false;
            }
        }

        if (
            JSBI.lessThanOrEqual(perls, JSBI.BigInt(0)) ||
            JSBI.greaterThan(perls, JSBI.BigInt(perlin.account.balance))
        ) {
            perlin.notify({
                type: NotificationTypes.Danger,
                message: "Please enter a valid amount of PERLs"
            });
            return false;
        }

        let gasDeposit;

        if (this.state.inputType === inputTypes[1].value) {
            gasDeposit = perls;
            perls = JSBI.BigInt(0);
        }

        try {
            const response =  await perlin.transfer(
                this.props.recipient.public_key,
                perls,
                gasLimitNumber,
                gasDeposit
            );
    
            perlin.notify({
                title: "PERL(s) Sent",
                type: NotificationTypes.Success,
                content: (
                    <p>
                        You can view your transaction
                        <Link
                            to={"/transactions/" + response.id}
                            title={response.id}
                            target="_blank"
                        >
                            here
                        </Link>
                    </p>
                ),
                dismiss: { duration: 10000 }
            });
        } catch (err) {
            perlin.notify({
                type: NotificationTypes.Danger,
                message: err.message
            });
            return false;
        }
        this.updateGasLimit("");

        // further validation required for successful send
        return true;
    };

    private cancelSend = () => {
        this.props.changeComponent("");
        this.setState({
            inputPerls: "",
            doubleChecked: false
        });
    };
}

export default withRouter(AccountDetected);
