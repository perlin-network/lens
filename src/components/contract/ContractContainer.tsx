import * as React from "react";
import styled from "styled-components";
import ContractUploader from "./ContractUploader";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../common/typography";
import ContractStore from "./ContractStore";
import ContractExecutor from "./ContractExecutor";
import { Controlled as CodeMirror } from "react-codemirror2";
import { observer } from "mobx-react";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/seti.css";

const contractStore = ContractStore.getInstance();

const LeftColumn = styled(Box)`
    display: flex;
    flex-direction: column;
    margin-right: 30px;
`;

// tslint:disable-next-line
const noop = () => {};

@observer
export default class ContractContainer extends React.Component<{}, {}> {
    public render() {
        const contractLoaded = contractStore.contract.name;

        return (
            <Flex>
                <LeftColumn width={4 / 7}>
                    <SectionTitle>Add a Smart Contract</SectionTitle>
                    <ContractUploader />
                    {contractLoaded && (
                        <>
                            <SectionTitle style={{ marginTop: "25px" }}>
                                Execute Function
                            </SectionTitle>
                            <ContractExecutor />
                        </>
                    )}
                </LeftColumn>
                {contractLoaded && (
                    <Box width={3 / 7}>
                        <SectionTitle>
                            Contract Name: {contractStore.contract.name}
                        </SectionTitle>
                        <CodeMirror
                            value={contractStore.contract.textContent}
                            onBeforeChange={noop}
                            options={{
                                readOnly: true,
                                mode: "application/wasm",
                                theme: "seti"
                            }}
                        />
                    </Box>
                )}
            </Flex>
        );
    }
}
