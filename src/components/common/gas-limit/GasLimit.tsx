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
    value?: any;
    mr?: any;
    mt?: any;
    mb?: any;
    ml?: any;
}
const GasLimit: React.FunctionComponent<IGasLimitProps> = ({
    balance,
    onChange,
    value,
    mr,
    mt,
    mb,
    ml
}) => {
    balance = balance + "";
    const [gasLimit, setGasLimit] = useState(value);
    const [choiceReset, setChoiceReset] = useState(0);

    useEffect(() => {
        if (gasLimit !== value) {
            setGasLimit(value);
            setChoiceReset(choiceReset + 1);
        }
    }, [value]);
    const updateGasLimit = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const limit = e.target.value;
            const kens = Math.floor(parseFloat(limit) * Math.pow(10, 9)) + "";
            setGasLimit(kens);
            setChoiceReset(choiceReset + 1);
            onChange(kens);
        },
        []
    );
    const calculateGasLimit = useCallback(
        (newValue: number) => {
            const limit = new BigNumber(balance)
                .div(100)
                .times(newValue)
                .toString();

            setGasLimit(limit);
            onChange(limit);
        },
        [balance]
    );
    const formattedValue =
        (gasLimit && parseInt(gasLimit, 10) / Math.pow(10, 9)) || "";
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
                    key={choiceReset}
                    options={gasLimitValues}
                    onChange={calculateGasLimit}
                />
            </DividerAside>
        </Flex>
    );
};

export default GasLimit;
