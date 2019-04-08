import * as React from "react";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";
import { TransactionGraphPixi } from "../graphs/TransactionGraphPixi";
import { NetworkGraph } from "../graphs/NetworkGraph";
import { SectionTitle } from "../common/typography";
import TransactionsTable from "../TransactionsTable";
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
                    <GraphBox width={1 / 2}>
                        <CardHeadings>Network Graph</CardHeadings>
                        <Divider />
                        <NetworkGraph />
                    </GraphBox>
                    <GraphBox width={1 / 2} style={{ marginLeft: "40px" }}>
                        <CardHeadings>Transaction Graph</CardHeadings>
                        <Divider />
                        <TransactionGraphPixi />
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
