import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";

import QuickSend from "../dashboard/quicksend/QuickSend";
import ContractUploader from "./ContractUploader";
import ContractExecutor from "./ContractExecutor";
import ContractStore from "./ContractStore";

import { Controlled as CodeMirror } from "react-codemirror2";
import { observer } from "mobx-react";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/night.css";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";

const Row = styled(Flex)`
    margin-bottom: ${props => props.theme.margin.row};
`;

const StyledCardTitle = styled(CardTitle)`
    padding-left: 0px;
`;

const CodeViewerCard = styled(Card)`
    margin-left: 20px;
    margin-right: 20px;
`;

const CodeViewerCardBody = styled(CardBody)`
    padding: 0px;
`;

const CodeViewerCardHeader = styled(CardHeader)`
    background-color: #0a041e;
`;

// tslint:disable-next-line
const noop = () => {};

const contractStore = ContractStore.getInstance();

const ContractContainer: React.FunctionComponent = () => {
    const contractLoaded = contractStore.contract.name;
    return (
        <>
            <Row>
                <Box width={1}>
                    <QuickSend />
                </Box>
            </Row>
            <Row>
                <Box width={1 / 2}>
                    <Card style={{ marginBottom: "20px" }}>
                        <CardHeader>
                            <CardTitle>&nbsp;Add a Smart Contract</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <ContractUploader />
                        </CardBody>
                    </Card>
                    {contractLoaded && <ContractExecutor />}
                </Box>
                <Box width={1 / 2}>
                    {contractLoaded && (
                        <CodeViewerCard>
                            <CodeViewerCardHeader>
                                <CardTitle>&nbsp;WASM File</CardTitle>
                            </CodeViewerCardHeader>
                            <CodeViewerCardBody>
                                <CodeMirror
                                    value={contractStore.contract.textContent}
                                    onBeforeChange={noop}
                                    options={{
                                        readOnly: true,
                                        mode: "application/wasm",
                                        theme: "night"
                                    }}
                                />
                            </CodeViewerCardBody>
                        </CodeViewerCard>
                    )}
                </Box>
            </Row>
        </>
    );
};

export default observer(ContractContainer);
