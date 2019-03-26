import * as React from "react";
import { useState, useEffect } from "react";
import { Card } from "../common/core";
import styled from "styled-components";
import FunctionSelect from "./FunctionSelect";
import ContractStore from "./ContractStore";
import ParameterInput, { ParamType } from "./ParameterInput";
import { Perlin } from "../../Perlin";
import { Button } from "../common/core";
import { SmartBuffer } from "smart-buffer";
import { useComputed, observer } from "mobx-react-lite";
import nanoid from "nanoid";
import PayloadWriter from "src/payload/PayloadWriter";
import * as Long from "long";
import ContractInstantiate from "./ContractInstantiate";

interface IParamItem {
    id: string;
    type: ParamType | undefined;
    value: string;
}

const perlin = Perlin.getInstance();
const contractStore = ContractStore.getInstance();
const contractInstantiate = ContractInstantiate.getInstance();
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
                    // todo : properly convert
                    writer.writeBytes([0]);
                    break;
                case ParamType.Byte:
                    writer.writeByte(parseInt(value, 10));
                    break;
            }
        }
    });
    return writer.toBuffer();
};

const isHexString = (text: string): boolean => {
    const hex = parseInt(text, 16);
    return hex.toString(16) === text;
};

const isBase64String = (text: string): boolean => {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/i.test(
        text
    );
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
                        if (num > 0 && num < Math.pow(2, 16)) {
                            valid = true;
                        }
                    }
                    break;
                case ParamType.Uint32:
                    if (/^[0-9]+$/i.test(value)) {
                        const num = parseInt(value, 10);
                        if (num > 0 && num < Math.pow(2, 32)) {
                            valid = true;
                        }
                    }
                    break;
                case ParamType.Uint64:
                    if (/^[0-9]+$/i.test(value)) {
                        const num = Long.fromString(value, true);
                        if (
                            num.greaterThan(0) &&
                            num.lessThanOrEqual(Long.MAX_UNSIGNED_VALUE)
                        ) {
                            valid = true;
                        }
                    }
                    break;
                case ParamType.Bytes:
                    if (isHexString(value) || isBase64String(value)) {
                        valid = true;
                    }
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
            const paramItem: IParamItem | undefined =
                paramsList[paramsList.length - 1];
            if (paramItem && paramItem.id === id) {
                addParam();
            }
        }
    };

    // todo : use payload writer
    function bytesToInt64(buffer: any, littleEndian = true) {
        const arr = new ArrayBuffer(8);
        const view = new DataView(arr);
        buffer.forEach((value: any, index: any) => view.setUint8(index, value));
        const left = view.getUint32(0, littleEndian);
        const right = view.getUint32(4, littleEndian);
        const combined = littleEndian
            ? left + 2 ** 32 * right
            : 2 ** 32 * left + right;
        return combined;
    }

    const Int32toBytes = (num: any) => {
        const arr = new ArrayBuffer(4);
        const view = new DataView(arr);
        view.setUint32(0, num, true);
        return new Uint8Array(arr);
    };

    const callFunction = async () => {
        const emptyItem: IParamItem | undefined = paramsList.find(
            item => item.value === "" || item.type === undefined
        );

        if (!emptyItem) {
            const funcParams = writeToBuffer(paramsList);
            const list = await paramsList.map(item => {
                return item.value;
            });

            const lParams = [
                contractStore.contract.transactionId,
                perlin.account.public_key,
                Int32toBytes(0),
                ...list
            ];
            const writer = new PayloadWriter();
            lParams.forEach((value: any) => {
                writer.writeBytes(value);
            });

            const result: any = await contractInstantiate.localInvoke(
                "balance",
                writer.toBuffer()
            );

            console.log(`result :${result}`);
            alert(`Result ${bytesToInt64(result)}`);

            const response = await perlin.invokeContractFunction(
                contractStore.contract.transactionId,
                0,
                currFunc,
                funcParams
            );

            console.log("response-->", response);
        } else {
            console.log("Item can't be empty");
            alert("Error : Item can't be empty.");
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
