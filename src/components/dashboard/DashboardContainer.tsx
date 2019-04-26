import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { Perlin } from "../../Perlin";
// import { TransactionGraphPixi } from "../graphs/TransactionGraphPixi";
import TransactionGraph from "../graphs/TransactionGraph";
import { NetworkGraph } from "../graphs/NetworkGraph";
import TransactionsTable from "../TransactionsTable";
import QuickSend from "./quicksend/QuickSend";
import "./dashboard.scss";
import { observer } from "mobx-react";
import NetworkLoad from "./NetworkLoad";
import { Card, CardHeader, CardTitle } from "../common/card";

const perlin = Perlin.getInstance();

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

export const CardHeadings = styled.h2`
    font-family: HKGrotesk;
    font-size: 20px;
    padding-left: 20px;
    font-weight: normal;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

export const GraphBox = styled(Box)`
    background-color: #151b35;
    border-radius: 4px;
`;

export const Divider = styled.hr`
    border: none;
    height: 1px;
    background: #686c7c;
    opacity: 0.2;
    margin: 0;
`;

@observer
export default class DashboardContainer extends React.Component {
    public render() {
        return (
            <>
                <Row>
                    <Box width={1}>
                        <QuickSend />
                    </Box>
                </Row>
                <Row>
                    <GraphBox width={1 / 2}>
                        <CardHeadings>Network</CardHeadings>
                        <Divider />
                        <NetworkGraph />
                    </GraphBox>
                    <GraphBox width={1 / 2} style={{ marginLeft: "40px" }}>
                        <CardHeadings>
                            Transactions
                            <NetworkLoad
                                tps={
                                    (perlin.metrics.acceptedMean +
                                        perlin.metrics.receivedMean) /
                                    2
                                }
                            />
                        </CardHeadings>
                        <Divider />
                        <TransactionGraph />
                    </GraphBox>
                </Row>
                <Row>
                    <Box width={1 / 1}>
                        <Card>
                            <CardHeader>
                                <CardTitle fontWeight="500">
                                    Transactions
                                </CardTitle>
                            </CardHeader>
                            <TransactionsTable />
                        </Card>
                    </Box>
                </Row>
                <Row />
            </>
        );
    }
}
