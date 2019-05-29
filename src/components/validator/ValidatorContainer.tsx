import * as React from "react";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";
import { SectionTitle } from "../common/typography";
import TransactionsTableInfinite from "../TransactionsTableInfinite";
import ValidatorView from "./ValidatorView";
import QuickSend from "../dashboard/quicksend/QuickSend";
import { Card, CardHeader, CardTitle } from "../common/card";

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

export default class ValidatorContainer extends React.Component<{}, {}> {
    public render() {
        return (
            <>
                <Row>
                    <Box width={1}>
                        <QuickSend />
                    </Box>
                </Row>
                <Row>
                    <Box width={1}>
                        <ValidatorView />
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
