import * as React from "react";
import styled from "styled-components";
import { CancelCardIcon } from "../../common/typography";
import "./quicksend.scss";
import { Link } from "react-router-dom";

interface IProps {
    restartComponents: any;
    txId: string;
}

const TxPrompt = styled.div`
    background-color: transaparent;
    color: white;
    width: 75%;
    padding: 15px;
    border: 1px solid #ffffff22;
    font-family: HKGrotesk;
    font-size: 14px;
    font-weight: 400;
    border-radius: 5px;
    vertical-align: middle;
`;
export default class TxDetected extends React.Component<IProps, {}> {
    constructor(props: IProps) {
        super(props);
        this.cancelSend = this.cancelSend.bind(this);
    }
    public render() {
        return (
            <TxPrompt style={{ verticalAlign: "middle", position: "relative" }}>
                Valid contract/transaction ID has been detected.{" "}
                <Link
                    style={{ color: "white" }}
                    to={`/transactions/${this.props.txId}`}
                >
                    <b>
                        <u>Navigate to the detail.</u>
                    </b>
                </Link>
                <CancelCardIcon
                    style={{ position: "absolute", top: "15px" }}
                    onClick={this.cancelSend}
                />
            </TxPrompt>
        );
    }
    private cancelSend = () => {
        this.props.restartComponents("");
    };
}
