import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { TransactionGraphPixi } from "../graphs/TransactionGraphPixi";
import { NetworkGraph } from "../graphs/NetworkGraph";
import TransactionsTable from "../TransactionsTable";
import QuickSend from "./quicksend/QuickSend";
import DataCard from "./DataCard";
import "./dashboard.scss";

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

const CardHeadings = styled.h2`
    font-family: HKGrotesk;
    font-size: 16px;
    padding-left: 20px;
`;

const GraphBox = styled(Box)`
    background-color: #151c35;
    border-radius: 5px;
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
                    <GraphBox width={1 / 2}>
                        <CardHeadings>Network</CardHeadings>
                        <hr />
                        <NetworkGraph />
                    </GraphBox>
                    <GraphBox width={1 / 2} style={{ marginLeft: "40px" }}>
                        <CardHeadings>Transactions</CardHeadings>
                        <hr />
                        <TransactionGraphPixi />
                    </GraphBox>
                </Row>
                <Row>
                    <Box width={1 / 1}>
                        <CardHeadings>Transactions</CardHeadings>
                        <TransactionsTable />
                    </Box>
                </Row>
            </>
        );
    }
}
