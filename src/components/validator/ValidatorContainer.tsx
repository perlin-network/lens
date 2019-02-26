import * as React from "react";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";
import { SectionTitle } from "../common/typography";
import TransactionsTable from "../TransactionsTable";
import ValidatorView from "./ValidatorView";

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

export default class ValidatorContainer extends React.Component<{}, {}> {
    public render() {
        return (
            <>
                <Row>
                    <Box width={1}>
                        <ValidatorView />
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
