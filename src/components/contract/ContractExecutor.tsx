import * as React from "react";
import { useState, useEffect } from "react";
import { Card as OriginalCard } from "../common/core";
import styled from "styled-components";
import FunctionSelect from "./FunctionSelect";
import ContractStore from "./ContractStore";
import ParameterInput, { ParamType } from "./ParameterInput";
import { Perlin, NotificationTypes } from "../../Perlin";
import { Button as RawButton } from "../common/core";
import { SmartBuffer } from "smart-buffer";
import { useComputed, observer } from "mobx-react-lite";
import nanoid from "nanoid";
import PayloadWriter from "src/payload/PayloadWriter";
import * as Long from "long";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";
import { Flex, Box } from "@rebass/grid";
import { loadContractFromNetwork } from "./ContractUploader";
import LoadingSpinner from "../common/loadingSpinner";
import { InlineNotificationSuccess } from "../common/notification/Notification";

interface IParamItem {
    id: string;
    type: ParamType | undefined;
    value: string;
}

const perlin = Perlin.getInstance();
const contractStore = ContractStore.getInstance();
const watFunctionRegex = /\(export "_contract_([a-zA-Z0-9_]+)" \(func \d+\)\)/g;

const errorNotification = (message: string) => {
    perlin.notify({
        type: NotificationTypes.Danger,
        message
    });
};

const useContractFunctions = () => {
    return useComputed(() => {
        const funcList = [];
        let match = watFunctionRegex.exec(contractStore.contract.textContent);
        // gets all capture groups
        while (match !== null) {
            funcList.push(match[1]);
            match = watFunctionRegex.exec(contractStore.contract.textContent);
        }
        console.log("funcList", funcList);
        const list = funcList.filter((item: any) => item !== "init");
        console.log("funcList", list);
        return list;
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
        contractStore.logs = [];
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
        contractStore.logs = [];
        setParamsList(prevList => prevList.filter(item => item.id !== id));
    };
    const addParam = () => {
        contractStore.logs = [];
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
            valid = true;
            break;
        case ParamType.Byte:
            valid = true;
            break;
    }
    return valid;
};

const writeToBuffer = (paramsList: IParamItem[]): Buffer => {
    const payload = new SmartBuffer();
    for (const param of paramsList) {
        if (param.type && param.value) {
            switch (param.type) {
                case ParamType.String:
                    payload.writeString(param.value);
                    break;
                case ParamType.Bytes:
                    payload.writeBuffer(Buffer.from(param.value, "hex"));
                    break;
                case ParamType.Byte:
                    payload.writeBuffer(Buffer.from(param.value, "hex"));
                    break;
                case ParamType.Uint64:
                    const long = Long.fromString(param.value, true);
                    payload.writeBuffer(Buffer.from(long.toBytesLE()));
                    break;
                case ParamType.Uint32:
                    payload.writeUInt32LE(parseInt(param.value, 10));
                    break;
                case ParamType.Uint16:
                    payload.writeUInt16LE(parseInt(param.value, 10));
                    break;
            }
        }
    }
    return payload.toBuffer();
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

const ContractExecutor: React.FunctionComponent = observer(() => {
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

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setFunc(funcList[0]);
    }, [funcList]);

    const handleFuncChange = (name: string) => {
        contractStore.logs = [];
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
        contractStore.logs = [];
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
                errorNotification(`Param value can't be resolved to a type`);
            }
        }
    };

    const delay = (time: any) =>
        new Promise((res: any) => setTimeout(res, time));

    const onCall = async () => {
        const emptyItem: IParamItem | undefined = paramsList.find(
            item => item.value === "" || item.type === undefined
        );

        setWasmResult("");
        setErrorMessage("");

        if (!emptyItem) {
            const buf = writeToBuffer(paramsList);
            setLoading(true);
            try {
                const result: any = await contractStore.call(currFunc, buf);
                /*
                const buff = SmartBuffer.fromBuffer(new Buffer(result), "utf8");

                setWasmResult(
                    `Result : ${buff.toString()}  (${bytesToInt64(result)}) `
                );
                console.log(
                    `Result : ${buff.toString()}  (${bytesToInt64(result)}) `
                );
                */
            } catch (e) {
                errorNotification(`Error : ${e}`);
            }
            const params = writeToBuffer(paramsList);

            const response = await perlin.invokeContractFunction(
                contractStore.contract.transactionId,
                0,
                currFunc,
                params
            );
            const txId = response.tx_id;

            // reload memory
            let count = 0;

            while (count < 30) {
                const tx = await perlin.getTransaction(txId);
                if (tx.status === "applied") {
                    await delay(3000);
                    break;
                }
                await delay(1000);
                count++;
            }

            const totalMemoryPages = await loadContractFromNetwork(
                contractStore.contract.transactionId
            );

            await contractStore.load(totalMemoryPages);

            setLoading(false);
        } else {
            errorNotification(`Error : Item can't be empty.`);
        }
    };

    const logMessages = contractStore.logs;

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

                    <Button disabled={loading} fontSize="14px" onClick={onCall}>
                        Call Function
                    </Button>
                    {loading && <LoadingSpinner />}
                    {logMessages.map((item: any, index: number) => {
                        return (
                            <InlineNotificationSuccess key={index}>
                                <div className="notification-body">
                                    <h4 className="notification-title">
                                        Success
                                    </h4>
                                    <div className="notification-message">
                                        Your result is:
                                        <span className="result">{item}</span>
                                    </div>
                                </div>
                            </InlineNotificationSuccess>
                        );
                    })}
                </ParamsBody>
            </Card>
        </>
    );
});

export default ContractExecutor;
