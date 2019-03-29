import * as React from "react";
import { Perlin } from "../../../Perlin";
import styled from "styled-components";
import { SectionTitle } from "../../common/typography";
import "./quicksend.scss";
import { Flex, Box } from "@rebass/grid";

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
const perlin = Perlin.getInstance();

export default class AccountDetected extends React.Component<IProps, IState> {
    constructor(props: IProps) {
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
                    <div>
                        <Row>
                            <Box width={1}>Detected An Account ID</Box>
                        </Row>
                        <Row>
                            <Box width={1 / 2}>Recipient</Box>
                            <Box width={1 / 2}>Send Funds</Box>
                        </Row>
                        <Row>
                            <Box width={1 / 2}>
                                {this.props.recipientID}
                                <br />
                                Recipient balance:
                            </Box>
                            <Box width={1 / 2}>
                                <div className="detected-inner-amount">
                                    Amount
                                </div>
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
                >
                    Your {this.state.inputPerls} PERLs are on their way!
                    <br />
                    From {perlin.publicKeyHex}
                    <br />
                    To {this.props.recipientID}
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
            return true;
        } else {
            console.log("not a number");
            return false;
        }
    };
}
