import * as React from "react";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";
import TransactionGraph from "../graphs/TransactionGraph";
import { NetworkGraph } from "../graphs/NetworkGraph";
import NetworkLoad from "../graphs/NetworkLoad";
import NetworkPeers from "../graphs/NetworkPeers";
import TransactionsTable from "../TransactionsTable";
import { Card, CardHeader, CardTitle } from "../common/card";
import {
    GraphBox,
    CardHeadings,
    Divider
} from "../dashboard/DashboardContainer";
import QuickSend from "../dashboard/quicksend/QuickSend";
import { Perlin } from "../../Perlin";
import { observer } from "mobx-react";

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

const perlin = Perlin.getInstance();
@observer
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
                            <CardHeadings>
                                Network
                                <NetworkPeers peers={perlin.peers.length + 1} />
                            </CardHeadings>
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
            </>
        );
    }
}
