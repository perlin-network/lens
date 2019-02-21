import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { TransactionGraphPixi } from "../graphs/TransactionGraphPixi";
import { NetworkGraph } from "../graphs/NetworkGraph";
import { SectionTitle } from "../Titles";
import TransactionsTable from "../TransactionsTable";

const Row = styled(Flex)`
    margin-bottom: 30px;
`;

export default class DashboardContainer extends React.Component<{}, {}> {
    public render() {
        return (
            <>
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
