import * as React from "react";
import styled from "styled-components";
import ContractUploader from "./ContractUploader";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../common/typography";

const LeftColumn = styled(Box)`
    display: flex;
    flex-direction: column;
`;

const ContractContainer: React.SFC<{}> = () => {
    return (
        <Flex>
            <LeftColumn width={3 / 5}>
                <SectionTitle>Add a Smart Contract</SectionTitle>
                <ContractUploader />
            </LeftColumn>
        </Flex>
    );
};

export default ContractContainer;
