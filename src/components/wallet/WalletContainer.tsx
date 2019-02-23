import * as React from "react";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";
import { SectionTitle } from "../Titles";
import TransactionsTable from "../TransactionsTable";
import WalletView from "./WalletView";

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

export default class WalletContainer extends React.Component<{}, {}> {
    public render() {
        return (
            <>
                <Row>
                    <Box width={1}>
                        <WalletView />
                    </Box>
                </Row>
                <Row>
                    <Box width={1}>
                        <SectionTitle>Transactions</SectionTitle>
                        <TransactionsTable />
                    </Box>
                </Row>
            </>
        );
    }
}
