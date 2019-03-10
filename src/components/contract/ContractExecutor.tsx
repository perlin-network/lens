import * as React from "react";
import { useState, useEffect } from "react";
import { Card } from "../common/core";
import styled from "styled-components";
import FunctionSelect from "./FunctionSelect";
import ContractStore from "./ContractStore";
import ParameterInput, { ParamType } from "./ParameterInput";
import { Button } from "../common/core";
import { useComputed, observer } from "mobx-react-lite";
import nanoid from "nanoid";

interface IParamItem {
    id: string;
    type: ParamType | undefined;
    value: string;
}

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

const useParams = () => {
    const [paramsList, setParamsList] = useState<IParamItem[]>([
        { id: nanoid(), type: undefined, value: "" }
    ]);
    const setParamType = (id: string) => (type: ParamType) => {
        setParamsList(prevList =>
            prevList.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        type
                    };
                }
                return item;
            })
        );
    };
    const setParamValue = (id: string) => (value: string) => {
        setParamsList(prevList =>
            prevList.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        value
                    };
                }
                return item;
            })
        );
    };
    const deleteParam = (id: string) => () => {
        setParamsList(prevList => prevList.filter(item => item.id !== id));
    };
    const addParam = () => {
        setParamsList(prevList =>
            prevList.concat({ id: nanoid(), type: undefined, value: "" })
        );
    };

    return {
        paramsList,
        setParamValue,
        setParamType,
        deleteParam,
        addParam
    };
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
const AddMoreText = styled.div`
    cursor: pointer;
    text-align: right;
    margin: 0;
    font-family: HKGrotesk;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    text-decoration: underline;
    text-decoration-color: #fff;
`;

const ContractExecutor: React.SFC<{}> = observer(() => {
    const funcList = useContractFunctions();
    const {
        paramsList,
        setParamValue,
        setParamType,
        deleteParam,
        addParam
    } = useParams();
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
            {paramsList.map(paramItem => (
                <ParameterInput
                    key={paramItem.id}
                    value={paramItem.value}
                    type={paramItem.type}
                    onChange={setParamValue(paramItem.id)}
                    onTypeChange={setParamType(paramItem.id)}
                    onDelete={deleteParam(paramItem.id)}
                />
            ))}
            <AddMoreText onClick={addParam}>Add more parameters</AddMoreText>
            <Button fontSize="14px">Call Function</Button>
        </Wrapper>
    );
});

export default ContractExecutor;
