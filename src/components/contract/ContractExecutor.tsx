import * as React from "react";
import { useState, useEffect } from "react";
import { Card as OriginalCard } from "../common/core";
import styled from "styled-components";
import FunctionSelect from "./FunctionSelect";
import ContractStore from "./ContractStore";
import ParameterInput, { ParamType } from "./ParameterInput";
import { Perlin } from "../../Perlin";
import { Button as RawButton } from "../common/core";
import { SmartBuffer } from "smart-buffer";
import { useComputed, observer } from "mobx-react-lite";
import nanoid from "nanoid";
import PayloadWriter from "src/payload/PayloadWriter";
import * as Long from "long";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";
import { Flex, Box } from "@rebass/grid";

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
        type: ParamType.Bytes,
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

const isHexString = (text: string): boolean => {
    const hex = parseInt(text, 16);
    return hex.toString(16) === text;
};

const isBase64String = (text: string): boolean => {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/i.test(
        text
    );
};

const Button = styled(RawButton)`
    background-color: #fff;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    color: #151b35;
    margin-top: 20px;
    border-radius: 5px;
    &:active {
        background-color: #d4d5da;
    }
`;

const Title = styled.h2`
    margin: 0;
    font-size: 16px;
    font-family: HKGrotesk;
    font-weight: normal;
    color: #fff;
    margin-bottom: 15px;
`;
const Wrapper = styled(OriginalCard).attrs({ showBoxShadow: false })`
    display: flex;
    flex-direction: column;
`;
const AddMoreText = styled.div`
    cursor: pointer;
    margin: 0px 0px 10px 0px;
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: 400;
    color: #fff;
    opacity: 0.6;
`;

const FunctionBody = styled(CardBody)`
    padding: 0px;
`;

const ParamsBody = styled(CardBody)`
    padding: 25px 25px 25px 25px;
`;

const validateParamItem = (paramItem: IParamItem, value: string): boolean => {
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
            if (isHexString(value) || isBase64String(value)) {
                valid = true;
            }
            break;
    }
    return valid;
};

const writeToBuffer = (
    paramsList: IParamItem[],
    headers: boolean = false
): Buffer => {
    const writer = new PayloadWriter();

    // put mandatory params

    if (headers) {
        writer.writeBuffer(
            Buffer.from(contractStore.contract.transactionId, "hex")
        );
        writer.writeBuffer(Buffer.from(perlin.account.public_key, "hex"));
        writer.writeUint64(Long.fromNumber(0, true));
    }

    for (const param of paramsList) {
        if (param.type && param.value) {
            switch (param.type) {
                case ParamType.String:
                    writer.writeString(param.value);
                    break;
                case ParamType.Uint16:
                    writer.writeUint16(parseInt(param.value, 10));
                    break;
                case ParamType.Uint32:
                    writer.writeUint32(parseInt(param.value, 10));
                    break;
                case ParamType.Uint64:
                    writer.writeUint64(Long.fromString(param.value, true));
                    break;
                case ParamType.Bytes:
                    // todo : support base64 string
                    writer.writeBuffer(Buffer.from(param.value, "hex"));
                    break;
                case ParamType.Byte:
                    writer.writeByte(parseInt(param.value, 10));
                    break;
            }
        }
    }

    return writer.toBuffer();
};

// todo : use smart buffer
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

const ContractExecutor: React.FunctionComponent<{}> = observer(() => {
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
    const [wasmResult, setWasmResult] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        setFunc(funcList[0]);
    }, [funcList]);

    const handleFuncChange = (name: string) => {
        setFunc(name);
        clearParams();
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

    const handleParamChange = (id: string) => (value: string) => {
        const paramItem: IParamItem | undefined = paramsList.find(
            item => item.id === id
        );
        if (paramItem !== undefined) {
            const valid = validateParamItem(paramItem, value);
            if (valid || value === "") {
                setParamValue(id)(value);
                setErrorMessage("");
            } else {
                console.log("Param value can't be resolved to a type");
                setErrorMessage(`Param value can't be resolved to a type`);
            }
        }
    };

    const callFunction = async () => {
        const emptyItem: IParamItem | undefined = paramsList.find(
            item => item.value === "" || item.type === undefined
        );
        setWasmResult("");
        setErrorMessage("");
        if (!emptyItem) {
            const buf = writeToBuffer(paramsList, true);
            try {
                const result: any = await contractStore.localInvoke(
                    currFunc,
                    buf
                );
                const buff = SmartBuffer.fromBuffer(new Buffer(result), "utf8");

                setWasmResult(
                    `Result : ${buff.toString()}  (${bytesToInt64(result)}) `
                );
                console.log(
                    `Result : ${buff.toString()}  (${bytesToInt64(result)}) `
                );
            } catch (e) {
                console.error("Invoke local wasm error!");
                console.error(e);
            }

            const onlyParams = writeToBuffer(paramsList);

            const response = await perlin.invokeContractFunction(
                contractStore.contract.transactionId,
                0,
                currFunc,
                onlyParams
            );

            console.log(`response : ${response}`);
        } else {
            console.log("Item can't be empty");
            setErrorMessage(`Error : Item can't be empty.`);
        }
    };

    return (
        <>
            <Card style={{ marginBottom: "20px" }}>
                <CardHeader>
                    <CardTitle>&nbsp;Execute Function</CardTitle>
                </CardHeader>
                <FunctionBody>
                    <FunctionSelect
                        values={funcList}
                        onChange={handleFuncChange}
                        value={currFunc}
                    />
                </FunctionBody>
            </Card>

            <Card style={{ marginBottom: "20px" }}>
                <CardHeader>
                    <CardTitle>
                        &nbsp;Add Parameter to Selected Function
                    </CardTitle>
                </CardHeader>
                <ParamsBody>
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
                    <Flex>
                        <Box width={1 / 2}>
                            <AddMoreText onClick={addParam}>
                                Add more parameters +
                            </AddMoreText>
                        </Box>
                    </Flex>

                    <Button fontSize="14px" onClick={callFunction}>
                        Call Function
                    </Button>
                    {wasmResult !== "" && (
                        <div
                            style={{
                                textAlign: "center",
                                marginTop: "25px",
                                marginBottom: "10px",
                                color: "#4A41D1"
                            }}
                        >
                            {wasmResult}
                        </div>
                    )}
                    {errorMessage !== "" && (
                        <div
                            style={{
                                marginTop: "25px",
                                textAlign: "center",
                                marginBottom: "10px",
                                color: "red"
                            }}
                        >
                            {errorMessage}
                        </div>
                    )}
                </ParamsBody>
            </Card>
        </>
    );
});

export default ContractExecutor;
