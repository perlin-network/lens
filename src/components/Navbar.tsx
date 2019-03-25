import * as React from "react";
import styled from "styled-components";
import perlinLogo from "../assets/svg/perlin-logo.svg";
import { Flex, Box } from "@rebass/grid";
import { interpolateGreys } from "d3";

const Wrapper = styled(Flex)`
    margin: 46px 40px;
`;

export default class Navbar extends React.Component<{}, {}> {
    public render() {
        return (
            <Wrapper style={{ backgroundColor: "grey" }}>
                <Box width={1 / 1} />
            </Wrapper>
        );
    }
}
