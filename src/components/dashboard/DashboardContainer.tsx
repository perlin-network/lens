import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { TransactionGraphPixi } from "../graphs/TransactionGraphPixi";
import { NetworkGraph } from "../graphs/NetworkGraph";
import { SectionTitle } from "../common/typography";
import TransactionsTable from "../TransactionsTable";
import QuickSend from "./quicksend/QuickSend";
import DataCard from "./DataCard";
import "./dashboard.scss";

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

export default class DashboardContainer extends React.Component {
    public render() {
        return (
            <>
                <Row>
                    <Box width={1}>
                        <QuickSend />
                    </Box>
                </Row>
                <Row>
                    <div className="cards-row">
                        <div className="card-cell">
                            <DataCard
                                heading="Wallet Balance"
                                value="23123.002"
                                unit="PERLs"
                            />
                        </div>
                        <div className="card-cell">
                            <DataCard
                                heading="Your Earnings"
                                value="400000"
                                unit="PERLs"
                            />
                        </div>
                        <div className="card-cell">
                            <DataCard
                                heading="Your Stake"
                                value="5000"
                                unit="PERLs"
                            />
                        </div>
                        <div className="card-cell">
                            <DataCard
                                heading="Ledger Speed"
                                value="10334"
                                unit="Avg TPS"
                            />
                        </div>
                    </div>
                </Row>
                <Row>
                    <Box width={5 / 7}>
                        <SectionTitle>Transactions</SectionTitle>
                        <TransactionsTable />
                    </Box>
                    <Box width={2 / 7} style={{ marginLeft: "40px" }}>
                        <SectionTitle>Network</SectionTitle>
                        <NetworkGraph />
                    </Box>
                </Row>
            </>
        );
    }
}
