import React, { useState, useCallback } from "react";

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
    mr?: any;
    mt?: any;
}
const GasLimit: React.FunctionComponent<IGasLimitProps> = ({
    balance,
    onChange,
    mr,
    mt
}) => {
    balance = balance + "";
    const [gasLimit, setGasLimit] = useState();
    const [choiceReset, setChoiceReset] = useState(0);

    const updateGasLimit = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const limit = e.target.value;
            setGasLimit(limit);
            setChoiceReset(choiceReset + 1);
            onChange(limit);
        },
        []
    );
    const calculateGasLimit = useCallback(
        (value: number) => {
            const limit = new BigNumber(balance)
                .div(100)
                .times(value)
                .toString();

            setGasLimit(limit);
            onChange(limit);
        },
        [balance]
    );
    return (
        <Flex mr={mr} mt={mt} flex="1">
            <DividerInput
                placeholder="Gas Limit"
                value={gasLimit}
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
