import {
    Alignment,
    Button,
    Callout,
    Card,
    Code,
    H5,
    Intent,
    Navbar,
    Pre,
    Tab,
    Tabs,
    Tag
} from "@blueprintjs/core";
import { observer } from "mobx-react";
import * as React from "react";
import { Perlin } from "./Perlin";
import { Store } from "./stores/Store";
import logo from "./perlin-logo.svg";
import ReactTable from "react-table";
import { NetworkGraph } from "./graphs/NetworkGraph";
import { TransactionGraphPixi } from "./graphs/TransactionGraphPixi";
import { MoneyPanel } from "./components/MoneyPanel";
import { ContractPanel } from "./components/ContractPanel";
import { StakePanel } from "./components/StakePanel";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";

const Layout = styled(Flex)`
    margin-left: 2em;
    margin-right: 2em;
    > div {
        width: 100%;
    }
`;
const NavRow = styled(Flex)`
    margin-top: 1em;
`;
const StatusRow = styled(Flex)`
    margin-top: 1.5em;
`;

// @ts-ignore
const recentColumns = [
    {
        Header: "Sender",
        accessor: "sender",
        maxWidth: 300,
        className: "text-center"
    },
    {
        Header: "Nonce",
        accessor: "nonce",
        maxWidth: 80,
        className: "text-center"
    },
    {
        Header: "Tag",
        accessor: "tag",
        maxWidth: 80,
        className: "text-center"
    }
];

@observer
class App extends React.Component<{ store: Store; perlin: Perlin }, {}> {
    public render() {
        return (
            <>
                <Layout flexDirection="column" alignItems="center">
                    <NavRow>
                        <Box
                            width={1 / 6}
                            style={{
                                margin: "1.5em 1.5em",
                                marginBottom: "1em"
                            }}
                        >
                            <header>
                                <img src={logo} style={{ width: "12em" }} />
                            </header>
                        </Box>

                        <Box
                            width={5 / 6}
                            style={{
                                marginTop: "1em",
                                marginBottom: "1em"
                            }}
                        >
                            <Navbar className="cardStyle">
                                <Navbar.Group align={Alignment.CENTER}>
                                    <Navbar.Heading>Statistics</Navbar.Heading>

                                    <div className="tag-list">
                                        <Tag minimal={true}>{`uptime: ${
                                            this.props.perlin.stats.uptime
                                        }`}</Tag>

                                        <Tag
                                            minimal={true}
                                        >{`tx latency: ${this.props.perlin.stats.consensusDuration.toFixed(
                                            3
                                        )} sec`}</Tag>

                                        <Tag
                                            minimal={true}
                                        >{`num accepted tx: ${
                                            this.props.perlin.stats
                                                .numAcceptedTransactions
                                        }`}</Tag>

                                        <Tag
                                            minimal={true}
                                        >{`accepted tx/sec: ${
                                            this.props.perlin.stats
                                                .numAcceptedTransactionsPerSecond
                                        }`}</Tag>
                                    </div>
                                </Navbar.Group>
                            </Navbar>
                        </Box>
                    </NavRow>

                    <StatusRow>
                        <div className="statuses">
                            <div className="status-border">
                                <div className="status-container">
                                    <Callout
                                        className="status"
                                        intent={Intent.SUCCESS}
                                    >
                                        You're connected as:{" "}
                                        <Code style={{ marginLeft: "0.5em" }}>
                                            {
                                                this.props.perlin.ledger
                                                    .public_key
                                            }
                                        </Code>
                                    </Callout>
                                </div>
                            </div>

                            <div className="status-border">
                                <div className="status-container">
                                    <Callout
                                        className="status"
                                        intent={Intent.PRIMARY}
                                    >
                                        You're connected to:{" "}
                                        <Code style={{ marginLeft: "0.5em" }}>
                                            {(this.props.perlin.ledger.peers &&
                                                this.props.perlin.ledger.peers
                                                    .length > 0 &&
                                                this.props.perlin.ledger.peers.join(
                                                    ", "
                                                )) ||
                                                "N/A"}
                                        </Code>
                                    </Callout>
                                </div>
                            </div>
                        </div>
                    </StatusRow>
                    <Flex>
                        <Box
                            width={5 / 12}
                            style={{
                                marginTop: "1.5em",
                                paddingBottom: "1em"
                            }}
                        >
                            <Card className="cardStyle">
                                <H5>Ledger</H5>
                                <Pre
                                    style={{
                                        overflow: "hidden",
                                        height: "90%",
                                        textOverflow: "ellipsis"
                                    }}
                                >
                                    {JSON.stringify(
                                        this.props.perlin.ledger.state,
                                        null,
                                        4
                                    )}
                                </Pre>
                            </Card>

                            <br />

                            <Card className="cardStyle">
                                <H5>Send Transaction</H5>

                                <Tabs>
                                    <Tab
                                        id="money"
                                        title="Money"
                                        panel={
                                            <MoneyPanel
                                                perlin={this.props.perlin}
                                            />
                                        }
                                    />
                                    <Tab
                                        id="stake"
                                        title="Stake"
                                        panel={
                                            <StakePanel
                                                perlin={this.props.perlin}
                                            />
                                        }
                                    />
                                    <Tab
                                        id="contract"
                                        title="Smart Contract"
                                        panel={
                                            <ContractPanel
                                                perlin={this.props.perlin}
                                            />
                                        }
                                    />
                                </Tabs>
                            </Card>

                            <br />

                            <Card className="cardStyle">
                                <H5>Recent Transactions</H5>

                                <div>
                                    <ReactTable
                                        data={
                                            this.props.perlin.recentTransactions
                                        }
                                        columns={recentColumns}
                                        className="-striped -highlight"
                                        defaultPageSize={15}
                                        defaultSorted={[
                                            {
                                                id: "index",
                                                desc: true
                                            }
                                        ]}
                                        SubComponent={this.recentSubComponent}
                                    />
                                </div>
                            </Card>
                        </Box>

                        <Box
                            width={7 / 12}
                            style={{
                                marginTop: "1.5em",
                                marginLeft: "1em"
                            }}
                        >
                            <Card className="cardStyle">
                                <H5>Transactions</H5>
                                <TransactionGraphPixi
                                    perlin={this.props.perlin}
                                />
                            </Card>

                            <br />

                            <Card className="cardStyle">
                                <H5>Network</H5>
                                <NetworkGraph perlin={this.props.perlin} />
                            </Card>
                        </Box>
                    </Flex>
                </Layout>
            </>
        );
    }

    // @ts-ignore
    private recentSubComponent = (row: any) => {
        const data = row.original;
        delete data.index;
        const isContract = data.tag === "create_contract";

        return (
            <div style={{ paddingLeft: 10, paddingRight: 10 }}>
                <Pre style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {JSON.stringify(data, null, 4)}
                </Pre>
                {isContract ? (
                    // show a download button from the smart contract
                    <div
                        className="button-container"
                        style={{ marginLeft: 20 }}
                    >
                        <Button
                            className="button"
                            onClick={this.onDownloadContract}
                            value={data.id}
                            text="Download"
                        />
                    </div>
                ) : null}
            </div>
        );
    };

    // @ts-ignore
    private onDownloadContract = (event: any) => {
        const txID: string = event.target.value;
        this.props.perlin.downloadContract(txID);
    };
}

export default App;
