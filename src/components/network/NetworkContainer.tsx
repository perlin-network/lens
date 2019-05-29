import * as React from "react";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";
// import { TransactionGraphPixi } from "../graphs/TransactionGraphPixi";
import TransactionGraph from "../graphs/TransactionGraph";
import { NetworkGraph } from "../graphs/NetworkGraph";
import { SectionTitle } from "../common/typography";
import TransactionsTableInfinite from "../TransactionsTableInfinite";
import { Card, CardHeader, CardTitle } from "../common/card";
import {
    GraphBox,
    CardHeadings,
    Divider
} from "../dashboard/DashboardContainer";
import QuickSend from "../dashboard/quicksend/QuickSend";

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

export default class NetworkContainer extends React.Component<{}, {}> {
    public render() {
        return (
            <>
                <Row>
                    <Box width={1}>
                        <QuickSend />
                    </Box>
                </Row>
                <Row>
                    <Box width={1 / 2} pr={3}>
                        <GraphBox>
                            <CardHeadings>Network Graph</CardHeadings>
                            <Divider />
                            <NetworkGraph />
                        </GraphBox>
                    </Box>
                    <Box width={1 / 2} pl={3}>
                        <GraphBox>
                            <CardHeadings>Transaction Graph</CardHeadings>
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
                            <TransactionsTableInfinite />
                        </Card>
                    </Box>
                </Row>
                <Row />
            </>
        );
    }
}
