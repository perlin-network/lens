import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../../common/typography";

const FailPrompt = styled.div`
    background-color: #351a35;
    color: white;
    width: 75%;
    padding: 20px;
    vertical-align: middle;
`;
export default class SendFail extends React.Component<{}, {}> {
    public render() {
        return <FailPrompt>Sorry, nothing matched that address</FailPrompt>;
    }
}
