import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { Perlin } from "../../Perlin";
import TransactionGraph from "../graphs/TransactionGraph";
import { NetworkGraph } from "../graphs/NetworkGraph";
import TransactionsTable from "../TransactionsTable";
import QuickSend from "./quicksend/QuickSend";
import { observer } from "mobx-react";
import NetworkLoad from "./NetworkLoad";
import { Card, CardHeader, CardTitle } from "../common/card";
import DataCard from "./DataCard";
import DataChart from "./DataChart";

const perlin = Perlin.getInstance();

const Wrapper = styled.div`
    .card-cell {
        flex: 1;
        width: 33%;
        margin: 0;
        min-width: 0;
        &:last-child {
            margin-right: 0;
        }
    }
`;
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

export const GraphBox = styled.div`
    background-color: #151b35;
    /* border-radius: 4px; */
    padding: 1px;
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
            <Wrapper>
                <Row>
                    <Box width={1}>
                        <QuickSend />
                    </Box>
                </Row>
                {/* <Flex>
                    <div className="card-cell">
                        <DataCard
                            heading="Wallet Balance"
                            value={perlin.account.balance.toString()}
                            unit="PERLs"
                        />
                    </div>
                    <div className="card-cell">
                        <DataCard
                            heading="Your Available Rewards"
                            value={(perlin.account.reward || 0) + ""}
                            unit="PERLs"
                        />
                    </div>
                    <div className="card-cell">
                        <DataCard
                            heading="Your Stake"
                            value={(perlin.account.stake || 0) + ""}
                            unit="PERLs"
                        />
                    </div>
                </Flex> */}
                <Row>
                    <DataChart
                        value={perlin.metrics.accepted}
                        title="Accepted TPS"
                    />

                    <DataChart
                        value={perlin.metrics.gossiped}
                        title="Relayed TPS"
                    />

                    <DataChart
                        value={perlin.metrics.downloaded}
                        title="Downloaded TPS"
                    />
                </Row>
                <Row>
                    <Box width={1 / 2} pr={3}>
                        <GraphBox>
                            <CardHeadings>Network</CardHeadings>
                            <Divider />
                            <NetworkGraph />
                        </GraphBox>
                    </Box>
                    <Box width={1 / 2} pl={3}>
                        <GraphBox>
                            <CardHeadings>
                                Transactions
                                <NetworkLoad tps={perlin.metrics.accepted} />
                            </CardHeadings>
                            <Divider />
                            <TransactionGraph />
                        </GraphBox>
                    </Box>
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
            </Wrapper>
        );
    }
}
