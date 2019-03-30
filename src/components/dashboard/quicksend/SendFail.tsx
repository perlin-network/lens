import * as React from "react";
import styled from "styled-components";
import { QuickSendErrorIcon } from "../../common/typography";

const FailPrompt = styled.div`
    background-color: #351a35;
    color: white;
    width: 75%;
    padding: 20px;
    vertical-align: middle;
`;
export default class SendFail extends React.Component<{}, {}> {
    public render() {
        return (
            <FailPrompt style={{ verticalAlign: "middle" }}>
                <QuickSendErrorIcon
                    style={{ marginRight: "10px", verticalAlign: "middle" }}
                />
                Sorry, nothing matched that address
            </FailPrompt>
        );
    }
}
