import * as React from "react";
import styled from "styled-components";
import { CancelCardIcon } from "../../common/typography";
import "./quicksend.scss";
import { Link } from "react-router-dom";

interface IProps {
    restartComponents: any;
    txId: string;
    validContract?: boolean;
    validTx?: boolean;
    payload?: any;
}

const TxPrompt = styled.div`
    background-color: transaparent;
    color: white;
    width: 100%;
    padding: 15px;
    font-family: HKGrotesk;
    font-size: 14px;
    font-weight: 400;
    border-radius: 5px;
    vertical-align: middle;
`;

const Info = styled.div`
    font-weight: 600;
    margin-bottom: 10px;
    .label {
        font-weight: 400;
        margin-right: 10px;
    }
`;
const InfoLine = styled.div`
    display: block;
`;
export default class TxDetected extends React.Component<IProps, {}> {
    constructor(props: IProps) {
        super(props);
        this.cancelSend = this.cancelSend.bind(this);
    }
    public render() {
        const payload = this.props.payload || {};
        return (
            <TxPrompt style={{ verticalAlign: "middle", position: "relative" }}>
                {this.props.validContract && (
                    <Info>
                        <InfoLine>
                            <span className="label">creator:</span>
                            {payload.creator}
                        </InfoLine>
                        <InfoLine>
                            <span className="label">depth:</span>
                            {payload.depth}
                        </InfoLine>
                        <InfoLine>
                            <span className="label">id:</span>
                            {payload.id}
                        </InfoLine>
                        <InfoLine>
                            <span className="label">nonce:</span>
                            {payload.nonce}
                        </InfoLine>
                        <InfoLine>
                            <span className="label">sender:</span>
                            {payload.sender}
                        </InfoLine>
                        <InfoLine>
                            <span className="label">status:</span>
                            {payload.status}
                        </InfoLine>
                    </Info>
                )}
                Valid {this.props.validContract && "Contract"}
                {this.props.validTx && "Transaction"} ID has been detected.{" "}
                <Link
                    style={{ color: "white" }}
                    to={`/transactions/${this.props.txId}`}
                >
                    <b>
                        <u>Go to the detail.</u>
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
