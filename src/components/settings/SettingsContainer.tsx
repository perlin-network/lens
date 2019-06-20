import * as React from "react";
import { Box, Flex } from "@rebass/grid";
import styled from "styled-components";
import { Config } from "../config/Config";
import { getCurrentHost, setCurrentHost } from "../../storage";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";

const Title = styled.p`
    font-family: Montserrat;
    font-size: 30px;
    color: #fff;
    margin-bottom: 15px;
    font-weight: 400;
`;

const Row = styled(Flex)`
    margin-top: 25px;
    margin-bottom: ${props => props.theme.margin.row};
`;

export default class SettingsContainer extends React.Component<{}, {}> {
    public render() {
        const currentHost = getCurrentHost();

        return (
            <>
                <Title>Settings</Title>
                <Row>
                    <Box width={2 / 3}>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    &nbsp;API host configuration
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Config
                                    value={currentHost}
                                    onChange={setCurrentHost}
                                    confirmationMessage="Are you sure you want to reconfigure your API host?"
                                />
                            </CardBody>
                        </Card>
                    </Box>
                </Row>
                {/*
                Current host: {currentHost}
                <Card justifyContent="space-between">
                    <APIHostConfig />
                </Card>
                */}
            </>
        );
    }
}
