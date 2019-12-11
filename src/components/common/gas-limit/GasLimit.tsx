import React, { useState, useCallback, useEffect } from "react";

import ChoiceButtons from "./ChoiceButtons";
import { Flex } from "@rebass/grid";
import { DividerInput, Divider, DividerAside } from "../dividerInput";
import BigNumber from "bignumber.js";

export const gasLimitValues = [
    {
        label: "25%",
        value: 25
    },
    {
        label: "50%",
        value: 50
    },
    {
        label: "75%",
        value: 75
    },
    {
        label: "100%",
        value: 100
    }
];

interface IGasLimitProps {
    onChange: (value: string) => void;
    balance: string | number;
    fee?: string | number;
    value?: any;
    mr?: any;
    mt?: any;
    mb?: any;
    ml?: any;
}
const GasLimit: React.FunctionComponent<IGasLimitProps> = ({
    balance,
    onChange,
    value = 0,
    fee = 0,
    mr,
    mt,
    mb,
    ml
}) => {
    balance = balance + "";
    // const [gasLimit, setGasLimit] = useState(value);
    const [choiceReset, setChoiceReset] = useState(0);

    // useEffect(() => {

    //     if (gasLimit !== value) {
    //         setGasLimit(value);
    //         setChoiceReset(choiceReset + 1);
    //     }
    // }, [value]);

    const updateGasLimit = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const limit = e.target.value.replace(/\,/g, "") || "0";
            const kens = new BigNumber(limit)
                .times(Math.pow(10, 9))
                .toString(10)
                .replace(/\..*/, "");

            setChoiceReset(choiceReset + 1);
            onChange(kens);
        },
        [onChange]
    );
    const calculateGasLimit = useCallback(
        (newValue: number) => {
            const limit = new BigNumber(balance)
                .div(100)
                .times(Math.min(newValue, 99))
                .toString()
                .replace(/\..*/, "");

            onChange(limit);
        },
        [balance]
    );

    const gasLimit = new BigNumber(value).minus(fee).div(Math.pow(10, 9));
    const formattedValue = gasLimit.gt(0) ? gasLimit.toString(10) : "";

    return (
        <Flex mr={mr} mt={mt} mb={mb} ml={ml} flex="1">
            <DividerInput
                placeholder="Gas Limit"
                value={formattedValue}
                onChange={updateGasLimit}
            />
            <Divider>|</Divider>
            <DividerAside title="% of total balance">
                <ChoiceButtons
                    // key={choiceReset}
                    options={gasLimitValues}
                    onChange={calculateGasLimit}
                />
            </DividerAside>
        </Flex>
    );
};

export default GasLimit;
