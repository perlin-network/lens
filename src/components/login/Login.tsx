import * as React from "react";
import { withRouter, RouteComponentProps } from "react-router";
import styled from "styled-components";
import { Button, Input } from "../common/core";
import { Flex, Box } from "@rebass/grid";
import { Perlin } from "../../Perlin";

const LoginHeading = styled.p`
    font-family: Montserrat;
    font-size: 30px;
    color: #fff;
    margin-bottom: 15px;
    font-weight: 400;
`;

const Wrapper = styled.div``;

const Login: React.FunctionComponent<RouteComponentProps> = () => {
    return (
        <Wrapper>
            <LoginHeading>Login</LoginHeading>
            <Flex>
                <Box width={1}>
                    <Input />
                </Box>
            </Flex>
            <Flex>
                <Box width={1}>
                    <Input />
                </Box>
            </Flex>
            <Flex>
                <Box width={1}>
                    <Button>Login</Button>
                </Box>
            </Flex>
        </Wrapper>
    );
};

export default withRouter(Login);
