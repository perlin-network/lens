import * as React from "react";
import styled from "styled-components";
import { Flex } from "@rebass/grid";
import Dropdown from "react-dropdown";

const typeOptions = ["String", "Uint16", "Uint32", "Uint64", "Bytes", "Byte"];

const Wrapper = styled(Flex)`
    margin-bottom: 30px;
`;

const ParameterInput: React.SFC<{}> = () => {
    return (
        <Wrapper alignItems="center">
            <Dropdown options={typeOptions} placeholder="Select a Type" />
        </Wrapper>
    );
};

export default ParameterInput;
