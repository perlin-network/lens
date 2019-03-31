import * as React from "react";
import styled from "styled-components";
import { QuickSendErrorIcon, CancelCardIcon } from "../../common/typography";
import "./quicksend.scss";

interface IProps {
    restartComponents: any;
}

const FailPrompt = styled.div`
    background-color: #351a35;
    color: white;
    width: 75%;
    padding: 20px;
    vertical-align: middle;
`;
export default class SendFail extends React.Component<IProps, {}> {
    constructor(props: IProps) {
        super(props);
        this.cancelSend = this.cancelSend.bind(this);
    }
    public render() {
        return (
            <FailPrompt
                style={{ verticalAlign: "middle", position: "relative" }}
            >
                <QuickSendErrorIcon
                    style={{ marginRight: "10px", verticalAlign: "middle" }}
                />
                Sorry, nothing matched that address
                <CancelCardIcon
                    style={{ position: "absolute" }}
                    onClick={this.cancelSend}
                />
            </FailPrompt>
        );
    }
    private cancelSend = () => {
        this.props.restartComponents(true);
    };
}
