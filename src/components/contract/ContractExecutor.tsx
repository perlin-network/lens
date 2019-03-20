import * as React from "react";
import { useState, useEffect } from "react";
import { Card } from "../common/core";
import styled from "styled-components";
import FunctionSelect from "./FunctionSelect";
import ContractStore from "./ContractStore";
import ParameterInput, { ParamType } from "./ParameterInput";
import { Perlin } from "../../Perlin";
import { Button } from "../common/core";
import { useComputed, observer } from "mobx-react-lite";
import nanoid from "nanoid";
import PayloadWriter from "src/payload/PayloadWriter";
import * as Long from "long";

interface IParamItem {
    id: string;
    type: ParamType | undefined;
    value: string;
}

const perlin = Perlin.getInstance();
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
    const getEmptyParam = () => ({
        id: nanoid(),
        type: undefined,
        value: ""
    });
    const [paramsList, setParamsList] = useState<IParamItem[]>([
        getEmptyParam()
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
        setParamsList(prevList => prevList.concat(getEmptyParam()));
    };
    const clearParams = () => {
        setParamsList([getEmptyParam()]);
    };

    return {
        paramsList,
        setParamValue,
        setParamType,
        deleteParam,
        addParam,
        clearParams
    };
};

const writeToBuffer = (paramsList: IParamItem[]): Buffer => {
    const writer = new PayloadWriter();
    paramsList.forEach(({ type, value }) => {
        if (type && value) {
            switch (type) {
                case ParamType.String:
                    writer.writeString(value);
                    break;
                case ParamType.Uint16:
                    writer.writeUint16(parseInt(value, 10));
                    break;
                case ParamType.Uint32:
                    writer.writeUint32(parseInt(value, 10));
                    break;
                case ParamType.Uint64:
                    writer.writeUint64(Long.fromString(value, true));
                    break;
                case ParamType.Bytes:
                    writer.writeBytes([0]);
                case ParamType.Byte:
                    writer.writeByte(parseInt(value, 10));
                    break;
            }
        }
    });
    return writer.toBuffer();
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
        addParam,
        clearParams
    } = useParams();
    const [currFunc, setFunc] = useState("");
    useEffect(() => {
        setFunc(funcList[0]);
    }, [funcList]);
    const handleFuncChange = (name: string) => {
        setFunc(name);
        clearParams();
    };

    const handleParamChange = (id: string) => (value: string) => {
        const paramItem: IParamItem | undefined = paramsList.find(
            item => item.id === id
        );
        if (paramItem !== undefined) {
            let valid = false;
            switch (paramItem.type) {
                case ParamType.String:
                    if (/^[a-z0-9\.\-\_]+$/i.test(value)) {
                        valid = true;
                    }
                    break;
                case ParamType.Uint16:
                    if (/^[0-9]+$/i.test(value)) {
                        const num = parseInt(value, 10);
                        if (
                            ParamType.Uint16 &&
                            (num > 0 && num < Math.pow(2, 16))
                        ) {
                            valid = true;
                        }
                    }
                    break;
                case ParamType.Uint32:
                    if (/^[0-9]+$/i.test(value)) {
                        const num = parseInt(value, 10);
                        if (
                            ParamType.Uint32 &&
                            (num > 0 && num < Math.pow(2, 32))
                        ) {
                            valid = true;
                        }
                    }
                    break;
                case ParamType.Uint64:
                    if (/^[0-9]+$/i.test(value)) {
                        const num = Long.fromString(value, true);
                        if (
                            ParamType.Uint64 &&
                            (num.greaterThan(0) &&
                                num.lessThanOrEqual(Long.MAX_UNSIGNED_VALUE))
                        ) {
                            valid = true;
                        }
                    }
                    break;
                case ParamType.Bytes:
                    /*
                        for inputting bytes the user should be able to input either hex or Base64
                    */

                    valid = true;
                    break;
                case ParamType.Byte:
                    valid = true;
                    break;
            }
            if (valid || value === "") {
                setParamValue(id)(value);
            } else {
                console.log("Param value can't be resolved to a type");
            }
        }
    };

    const handleTypeChange = (id: string) => (type: ParamType) => {
        const paramItem: IParamItem | undefined = paramsList.find(
            item => item.id === id
        );
        if (paramItem !== undefined) {
            paramItem.value = "";
        }
        setParamType(id)(type);
    };

    const handleKeypress = (id: string) => (key: string) => {
        if (key === "Enter") {
            // looking for the last row
            const paramItem: IParamItem | undefined =
                paramsList[paramsList.length - 1];
            if (paramItem && paramItem.id === id) {
                addParam();
            }
        }
    };

    const callFunction = async () => {
        const emptyItem: IParamItem | undefined = paramsList.find(
            item => item.value === "" || item.type === undefined
        );
        if (!emptyItem) {
            const buffer = writeToBuffer(paramsList);
            const response = await perlin.invokeContractFunction(
                contractStore.contract.transactionId,
                0,
                currFunc,
                buffer
            );
            // todo : getting the result
            /*
                
            */
        } else {
            console.log("Item can't be empty");
        }
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
                    onChange={handleParamChange(paramItem.id)}
                    onTypeChange={handleTypeChange(paramItem.id)}
                    onDelete={deleteParam(paramItem.id)}
                    onKeypress={handleKeypress(paramItem.id)}
                />
            ))}
            <AddMoreText onClick={addParam}>Add more parameters</AddMoreText>
            <Button fontSize="14px" onClick={callFunction}>
                Call Function
            </Button>
        </Wrapper>
    );
});

export default ContractExecutor;
