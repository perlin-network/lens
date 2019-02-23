import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { TransactionGraphPixi } from "../graphs/TransactionGraphPixi";
import { NetworkGraph } from "../graphs/NetworkGraph";
import { SectionTitle } from "../common/typography";
import TransactionsTable from "../TransactionsTable";
import WalletView from "../wallet/WalletView";

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

export default class DashboardContainer extends React.Component<{}, {}> {
    public render() {
        return (
            <>
                <Row>
                    <Box width={1}>
                        <WalletView />
                    </Box>
                </Row>
                <Row>
                    <Box width={1 / 2}>
                        <SectionTitle>Transaction Graph</SectionTitle>
                        <TransactionGraphPixi />
                    </Box>
                    <Box width={1 / 2} style={{ marginLeft: "40px" }}>
                        <SectionTitle>Network Graph</SectionTitle>
                        <NetworkGraph />
                    </Box>
                </Row>
                <Box width={1}>
                    <SectionTitle>Transactions</SectionTitle>
                    <TransactionsTable />
                </Box>
                <Row />
            </>
        );
    }
}
