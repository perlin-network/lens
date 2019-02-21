import * as React from "react";
import styled from "styled-components";
import perlinLogo from "../perlin-logo.svg";
import { Flex, Box } from "@rebass/grid";

const Wrapper = styled(Flex)`
    margin: 46px 40px;
`;

export default class Navbar extends React.Component<{}, {}> {
    public render() {
        return (
            <Wrapper>
                <Box width={1 / 6}>
                    <img src={perlinLogo} style={{ width: "12em" }} />
                </Box>
                <Box width={5 / 6} />
            </Wrapper>
        );
    }
}
