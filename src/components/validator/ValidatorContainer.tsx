import * as React from "react";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";
import { SectionTitle } from "../common/typography";
import TransactionsTable from "../TransactionsTable";

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

export default class ValidatorContainer extends React.Component<{}, {}> {
    public render() {
        return (
            <>
                <Box width={1}>
                    <SectionTitle>Transactions</SectionTitle>
                    <TransactionsTable />
                </Box>
            </>
        );
    }
}
