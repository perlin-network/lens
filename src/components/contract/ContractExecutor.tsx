import React, { useCallback } from "react";
import { useState, useEffect } from "react";
import {
    Card as OriginalCard,
    Button as RawButton,
    ButtonOutlined,
    InputWrapper,
    StyledDropdown,
    formatBalance
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
import { DividerInput, Divider, DividerAside } from "../common/dividerInput";

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

const getParamValue = (value: string, type: string) => {
    switch (type) {
        case ParamType.Int16:
        case ParamType.Int32:
        case ParamType.Uint16:
        case ParamType.Uint32:
            return parseInt(value, 10);
        case ParamType.Byte:
            return parseInt(value, 16);
        case ParamType.Bytes:
            return Buffer.from(value, "hex");
        case ParamType.Int64:
        case ParamType.Uint64:
            return JSBI.BigInt(value);
        default:
            return value;
    }
};

const parseParamList = (paramList: any) => {
    return paramList.map((param: any) => {
        return {
            type: param.type,
            value: getParamValue(param.value, param.type)
        };
    });
};
const useParams = () => {
    const getEmptyParam = () => ({
        id: nanoid(),
        type: ParamType.Raw,
        value: ""
    });
    const [paramsList, setParamsList] = useState<IParamItem[]>([]);
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
        setParamsList([]);
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
    margin: 10px 0px;
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
        case ParamType.Byte:
            if (/^[0-9a-f]{1,2}$/i.test(value)) {
                valid = true;
            }
            break;
        case ParamType.Bytes:
            if (/^[0-9a-f]+$/i.test(value)) {
                valid = true;
            }
            break;
        case ParamType.String:
        case ParamType.Raw:
            valid = true;
            break;
    }
    return valid;
};
const inputTypes = [
    {
        label: "Send",
        value: "send-perls"
    },
    {
        label: "Deposit Gas",
        value: "deposit-gas"
    }
];
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
    const [inputType, setInputType] = useState(inputTypes[0].value);
    const [loading, setLoading] = useState(false);
    const [inputPerls, setInputPerls] = useState();

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

    const handleInputType = useCallback((option: any) => {
        setInputType(option.value);
    }, []);

    const updateInputPerls = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const kens = Math.floor(parseFloat(value) * Math.pow(10, 9)) + "";
            setInputPerls(kens);
        },
        []
    );

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
        const localCall = (amount: JSBI, params: any) => {
            contractStore.logs = [];
            const { result, logs } = contractStore.waveletContract.test(
                perlin.keys,
                currFunc,
                amount,
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
            let perls = JSBI.BigInt(inputPerls || "0");
            if (
                JSBI.lessThan(perls, JSBI.BigInt(0)) ||
                JSBI.greaterThan(perls, JSBI.BigInt(perlin.account.balance))
            ) {
                perlin.notify({
                    type: NotificationTypes.Danger,
                    message: "Please enter a valid amount of PERLs"
                });
                return;
            }

            const clonedParamList = parseParamList(paramsList);

            let gasDeposit = JSBI.BigInt(0);

            if (inputType === inputTypes[1].value) {
                gasDeposit = perls;
                perls = JSBI.BigInt(0);
            }

            if (simulated) {
                localCall(perls, clonedParamList);
                setLoading(false);
                return;
            }

            const callClonedParamList = parseParamList(paramsList);
            const response = await contractStore.waveletContract.call(
                perlin.keys,
                currFunc,
                perls,
                JSBI.subtract(gasLimitNumber, perls),
                gasDeposit,
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

                    <Flex alignItems="center">
                        <Box mr={2}>
                            <StyledDropdown
                                className="fixed-width"
                                options={inputTypes}
                                value={inputType}
                                onChange={handleInputType}
                            />
                        </Box>

                        <InputWrapper>
                            <DividerInput
                                placeholder="Enter Amount"
                                onChange={updateInputPerls}
                            />
                            <Divider>|</Divider>
                            <DividerAside>
                                Fee: {formatBalance(TX_FEE)}
                            </DividerAside>
                        </InputWrapper>
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
                            disabled={loading || !contractStore.waveletContract}
                            onClick={onCall(true)}
                        >
                            Simulate Call
                        </ButtonOutlined>
                        <div
                            title={
                                !gasLimit
                                    ? "Please enter a valid gas limit"
                                    : ""
                            }
                        >
                            <CallFunctionButton
                                disabled={
                                    loading ||
                                    !gasLimit ||
                                    !contractStore.waveletContract
                                }
                                onClick={onCall(false)}
                            >
                                Call Function
                            </CallFunctionButton>
                        </div>
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
