import * as React from "react";
import { Box, Flex } from "@rebass/grid";
import styled from "styled-components";
import { APIHostConfig } from "../config/APIHostConfig";
import { Config } from "../config/Config";
import {
    getCurrentHost,
    getTransactionGraphNodeLimit,
    getNetworkGraphNodeLimit,
    setTransactionGraphNodeLimit,
    setNetworkGraphNodeLimit
} from "../../storage";
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
        const transactionGraphNodeLimit = getTransactionGraphNodeLimit();
        const networkGraphNodeLimit = getNetworkGraphNodeLimit();

        const convertLimitToNumber = (cb: (limit: number) => void) => (
            input: string
        ) => cb(parseInt(input, 10));
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
                                <p>Current host: {currentHost}</p>
                                <APIHostConfig />
                            </CardBody>
                        </Card>
                    </Box>
                </Row>
                <Row>
                    <Box width={2 / 3}>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    &nbsp;Network Graph Node Limit
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p>Current limit: {networkGraphNodeLimit}</p>
                                <Config
                                    placeholder="Ex: 500"
                                    value={networkGraphNodeLimit}
                                    onChange={convertLimitToNumber(
                                        setNetworkGraphNodeLimit
                                    )}
                                    confirmationMessage="Are you sure you want to reconfigure your Network Graph Node Limit?"
                                />
                            </CardBody>
                        </Card>
                    </Box>
                </Row>
                <Row>
                    <Box width={2 / 3}>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    &nbsp;Transaction Graph Node Limit
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p>
                                    Current limit: {transactionGraphNodeLimit}
                                </p>
                                <Config
                                    placeholder="Ex: 500"
                                    value={transactionGraphNodeLimit}
                                    onChange={convertLimitToNumber(
                                        setTransactionGraphNodeLimit
                                    )}
                                    confirmationMessage="Are you sure you want to reconfigure your Transaction Graph Node Limit?"
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
