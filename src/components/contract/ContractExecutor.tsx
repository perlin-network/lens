import * as React from "react";
import { useState, useEffect } from "react";
import { Card } from "../common/core";
import styled from "styled-components";
import FunctionSelect from "./FunctionSelect";
import ContractStore from "./ContractStore";
import { useComputed, observer } from "mobx-react-lite";

const contractStore = ContractStore.getInstance();
const watFunctionRegex = /\(export "_contract_([a-zA-Z0-9_]+)" \(func \d+\)\)/g;

const useContractFunctions = () => {
    return useComputed(() => {
        const funcList = [];
        let match = watFunctionRegex.exec(contractStore.contract.textContent);
        // gets all capture groups
        while (match !== null) {
            funcList.push(match[1]);
            match = watFunctionRegex.exec(contractStore.contract.textContent);
        }
        return funcList;
    }, [contractStore.contract.textContent]);
};

const Title = styled.h2`
    margin: 0;
    font-size: 16px;
    font-family: HKGrotesk;
    font-weight: normal;
    color: #fff;
    margin-bottom: 15px;
`;
const Wrapper = styled(Card).attrs({ showBoxShadow: false })`
    display: flex;
    flex-direction: column;
`;

const ContractExecutor: React.SFC<{}> = observer(() => {
    const funcList = useContractFunctions();
    const [currFunc, setFunc] = useState("");
    useEffect(() => {
        setFunc(funcList[0]);
    }, [funcList]);
    const handleFuncChange = (name: string) => {
        setFunc(name);
    };

    return (
        <Wrapper>
            <Title>Select a function</Title>
            <FunctionSelect
                values={funcList}
                onChange={handleFuncChange}
                value={currFunc}
            />
            <Title style={{ marginTop: "25px" }}>Specify Parameters</Title>
        </Wrapper>
    );
});

export default ContractExecutor;
