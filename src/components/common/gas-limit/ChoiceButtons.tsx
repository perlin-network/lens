import React, { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import { Button } from "../core";

export const ChoiceButtonsWrapper = styled.div`
    display: flex;
    ${Button} {
        font-size: 12px;
        border: solid 1px #676976;
        margin-right: -1px;
        background: none;
        color: #676976;
        padding: 0 4px;
        border-radius: 0;
        width: auto;
        transition: all 0.2s ease;
        line-height: 20px;
        height: 20px;
        position: relative;

        &:last-child {
            border-top-right-radius: 5px;
            border-bottom-right-radius: 5px;
        }

        &:first-child {
            border-top-left-radius: 5px;
            border-bottom-left-radius: 5px;
        }
        &:hover,
        &:active,
        &.active {
            color: #fff;
            border-color: #fff;
            z-index: 1;
        }

        &.active {
            background: rgba(255, 255, 255, 1);
            color: #1b223d;
        }
    }
`;
interface IOption {
    label: string;
    value: number;
}

interface IChoiceButtonsProps {
    options: IOption[];
    onChange: (value: number) => void;
}
const ChoiceButtons: React.FunctionComponent<IChoiceButtonsProps> = ({
    options,
    onChange
}) => {
    const [value, setValue] = useState();
    const valueButtonClick = (newValue: number) => (e: any) => {
        setValue(newValue);
        onChange(newValue);
    };

    return (
        <ChoiceButtonsWrapper>
            {options.map((option: IOption) => (
                <Button
                    onClick={valueButtonClick(option.value)}
                    className={value === option.value ? "active" : ""}
                >
                    {option.label}
                </Button>
            ))}
        </ChoiceButtonsWrapper>
    );
};

export default ChoiceButtons;
