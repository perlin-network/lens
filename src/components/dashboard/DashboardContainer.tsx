import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { Perlin } from "../../Perlin";
import { TransactionGraphPixi } from "../graphs/TransactionGraphPixi";
import { NetworkGraph } from "../graphs/NetworkGraph";
import TransactionsTable from "../TransactionsTable";
import QuickSend from "./quicksend/QuickSend";
import DataCard from "./DataCard";
import "./dashboard.scss";
import { observer } from "mobx-react";

const perlin = Perlin.getInstance();

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

const CardHeadings = styled.h2`
    font-family: HKGrotesk;
    font-size: 20px;
    padding-left: 20px;
    font-weight: normal;
`;

const GraphBox = styled(Box)`
    background-color: #151b35;
    border-radius: 4px;
`;

const Divider = styled.hr`
    border: none;
    height: 1px;
    background: #686c7c;
    opacity: 0.2;
    margin: 0;
`;

@observer
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
                                value={perlin.account.balance.toString()}
                                unit="PERLs"
                            />
                        </div>
                        <div className="card-cell">
                            <DataCard
                                heading="Your Stake"
                                value={
                                    perlin.account.stake === undefined
                                        ? "0"
                                        : perlin.account.stake.toString()
                                }
                                unit="PERLs"
                            />
                        </div>
                        <div className="card-cell">
                            <DataCard
                                heading="Network Load"
                                value="TBA"
                                unit="Avg TPS"
                            />
                        </div>
                    </div>
                </Row>
                <Row>
                    <GraphBox width={1 / 2}>
                        <CardHeadings>Network</CardHeadings>
                        <Divider />
                        <NetworkGraph />
                    </GraphBox>
                    <GraphBox width={1 / 2} style={{ marginLeft: "40px" }}>
                        <CardHeadings>Transactions</CardHeadings>
                        <Divider />
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
