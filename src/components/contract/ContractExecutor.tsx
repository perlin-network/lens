import React, { useCallback } from "react";
import { useState, useEffect } from "react";
import {
    Card as OriginalCard,
    Button as RawButton,
    ButtonOutlined
} from "../common/core";
import styled from "styled-components";
import FunctionSelect from "./FunctionSelect";
import ContractStore from "./ContractStore";
import ParameterInput, { ParamType } from "./ParameterInput";
import { Perlin, NotificationTypes } from "../../Perlin";
import { useComputed, observer } from "mobx-react-lite";
import nanoid from "nanoid";
import * as Long from "long";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";
import { Flex, Box } from "@rebass/grid";
import LoadingSpinner from "../common/loadingSpinner";

import { InlineNotification } from "../common/notification/Notification";
import GasLimit from "../common/gas-limit/GasLimit";
import { Link } from "react-router-dom";
import JSBI from "jsbi";
import { TAG_TRANSFER } from "wavelet-client";
import { TX_FEE } from "src/constants";

interface IParamItem {
    id: string;
    type: ParamType | undefined;
    value: any;
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

const getValue = (value: string, type?: string) => {
    switch (type) {
        case ParamType.Int16:
        case ParamType.Int32:
        case ParamType.Uint16:
        case ParamType.Uint32:
            return parseInt(value, 10);
        case ParamType.Bytes:
        case ParamType.Byte:
            return Buffer.from(value, "hex");
        case ParamType.Int64:
        case ParamType.Uint64:
            return JSBI.BigInt(value);
        default:
            return value;
    }
};
const useParams = () => {
    const getEmptyParam = () => ({
        id: nanoid(),
        type: ParamType.Raw,
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
                        value: getValue(value, item.type)
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

const Button = styled(RawButton)`
    background-color: #fff;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    color: #151b35;
    border-radius: 5px;
    &:active {
        background-color: #d4d5da;
    }
`;

const CallFunctionButton = styled(Button)`
    width: auto;
    font-size: 14px;
    padding-left: 10px;
    padding-right: 10px;
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
        case ParamType.Int16:
            if (/^\-?[0-9]*$/i.test(value)) {
                if (value === "-") {
                    valid = true;
                }
                const num = parseInt(value, 10);
                if (num >= Math.pow(-2, 15) && num <= Math.pow(2, 15)) {
                    valid = true;
                }
            }
            break;
        case ParamType.Int32:
            if (/^\-?[0-9]*$/i.test(value)) {
                if (value === "-") {
                    valid = true;
                }
                const num = parseInt(value, 10);
                if (num >= Math.pow(-2, 31) && num <= Math.pow(2, 31)) {
                    valid = true;
                }
            }
            break;
        case ParamType.Int64:
            if (/^\-?[0-9]*$/i.test(value)) {
                if (value === "-") {
                    valid = true;
                }
                const num = Long.fromString(value, true);
                if (
                    num.greaterThanOrEqual(Long.MIN_VALUE) &&
                    num.lessThanOrEqual(Long.MAX_VALUE)
                ) {
                    valid = true;
                }
            }
            break;
        case ParamType.Uint16:
            if (/^[0-9]+$/i.test(value)) {
                const num = parseInt(value, 10);
                if (num >= 0 && num <= Math.pow(2, 16)) {
                    valid = true;
                }
            }
            break;
        case ParamType.Uint32:
            if (/^[0-9]+$/i.test(value)) {
                const num = parseInt(value, 10);
                if (num >= 0 && num <= Math.pow(2, 32)) {
                    valid = true;
                }
            }
            break;
        case ParamType.Uint64:
            if (/^[0-9]+$/i.test(value)) {
                const num = Long.fromString(value, true);
                if (
                    num.greaterThanOrEqual(0) &&
                    num.lessThanOrEqual(Long.MAX_UNSIGNED_VALUE)
                ) {
                    valid = true;
                }
            }
            break;
        case ParamType.String:
        case ParamType.Raw:
        case ParamType.Bytes:
        case ParamType.Byte:
            valid = true;
            break;
    }
    return valid;
};

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
    const [gasLimit, setGasLimit] = useState();
    const [currFunc, setFunc] = useState("");
    const [wasmResult, setWasmResult] = useState("");

    const [loading, setLoading] = useState(false);

    const handleUpdateGasLimit = useCallback((value: string) => {
        setGasLimit(value);
    }, []);
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
            } else {
                console.log("Param value can't be resolved to a type");
                errorNotification(`Param value can't be resolved to a type`);
            }
        }
    };

    const onCall = (simulated: boolean = false) => async () => {
        let gasLimitNumber = JSBI.BigInt(Math.floor(gasLimit || 0));
        gasLimitNumber = JSBI.subtract(gasLimitNumber, JSBI.BigInt(TX_FEE));
        if (
            (!simulated &&
                JSBI.lessThanOrEqual(gasLimitNumber, JSBI.BigInt(0))) ||
            JSBI.greaterThan(
                gasLimitNumber,
                JSBI.BigInt(perlin.account.balance)
            )
        ) {
            errorNotification("Invalid Gas Limit");
            return;
        }

        const emptyItem: IParamItem | undefined = paramsList.find(
            item => item.value === "" || item.type === undefined
        );

        setWasmResult("");

        if (emptyItem) {
            errorNotification("Error : Item can't be empty.");
            return;
        }

        setLoading(true);
        const localCall = (params: any) => {
            contractStore.logs = [];
            const { result, logs } = contractStore.waveletContract.test(
                currFunc,
                BigInt(0),
                ...params
            );

            if (result) {
                contractStore.logs.push(result);
            }

            if (logs) {
                contractStore.logs.push(logs.join("\n"));
            }
        };

        try {
            const clonedParamList = paramsList.map(param => ({ ...param }));

            if (simulated) {
                localCall(clonedParamList);
                setLoading(false);
                return;
            }

            const callClonedParamList = paramsList.map(param => ({ ...param }));
            const response = await contractStore.waveletContract.call(
                perlin.keys,
                currFunc,
                JSBI.BigInt(0),
                gasLimitNumber,
                ...callClonedParamList
            );

            const txId = response.tx_id;
            await contractStore.listenForApplied(TAG_TRANSFER, txId);
            await contractStore.waveletContract.fetchAndPopulateMemoryPages();

            perlin.notify({
                title: "Function Invoked",
                type: NotificationTypes.Success,
                content: (
                    <p>
                        You can view your transaction
                        <Link
                            to={"/transactions/" + txId}
                            title={txId}
                            target="_blank"
                        >
                            here
                        </Link>
                    </p>
                ),
                dismiss: { duration: 10000 }
            });
        } catch (err) {
            errorNotification(`Error : ${err.message || err}`);
        }

        setLoading(false);
        setGasLimit(undefined);
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

                    <GasLimit
                        balance={perlin.account.balance}
                        onChange={handleUpdateGasLimit}
                        value={gasLimit}
                    />
                    <Flex
                        mt={3}
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <ButtonOutlined
                            disabled={loading}
                            onClick={onCall(true)}
                        >
                            Simulate Call
                        </ButtonOutlined>
                        <CallFunctionButton
                            disabled={loading}
                            onClick={onCall(false)}
                        >
                            Call Function
                        </CallFunctionButton>
                    </Flex>

                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        logMessages.map((item: any, index: number) => {
                            return (
                                <InlineNotification
                                    className="success"
                                    key={index}
                                >
                                    <div className="notification-body">
                                        <h4 className="notification-title">
                                            Success
                                        </h4>
                                        <div className="notification-message">
                                            Your result is:
                                            <span className="result">
                                                {item}
                                            </span>
                                        </div>
                                    </div>
                                </InlineNotification>
                            );
                        })
                    )}
                </ParamsBody>
            </Card>
        </>
    );
});

export default ContractExecutor;
