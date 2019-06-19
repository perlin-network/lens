import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import DiffUp from "../../assets/svg/diff-up.svg";
import DiffDown from "../../assets/svg/diff-down.svg";
import BigNumber from "bignumber.js";
import { CSSTransition } from "react-transition-group";

export const DeltaTagWrapper = styled.div<{ negative: boolean }>`
    display: inline-block;
    padding: 4px 20px 3px 7px;
    border-radius: 14px;
    transition: all 0.2s ease;
    ${({ negative }) =>
        !negative
            ? `
        background: rgba(55, 214, 107, 0.1) url(${DiffUp}) no-repeat;
        color: rgba(55, 214, 107, 1);
        &.pop-in-enter, &.pop-in-exit-active {
            transform: translateY(10px) scale(0.9);
        }
    `
            : `
        background: rgba(214, 55, 55, 0.1) url(${DiffDown})  no-repeat;
        color: rgba(214, 55, 55, 1);

        &.pop-in-enter, &.pop-in-exit-active {
            transform: translateY(-10px) scale(0.9);
        }
    `}

    background-position: right 7px top 50%;
    background-size: 9px auto;

    &.pop-in-enter {
        opacity: 0;
    }
    &.pop-in-enter-active {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    &.pop-in-exit {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    &.pop-in-exit-active {
        opacity: 0;
    }
`;

interface IDeltaTagProps {
    value: string | number;
}
const DeltaTag: React.FunctionComponent<IDeltaTagProps> = ({ value }) => {
    const strValue = value + "";
    const isNegative = strValue.match(/^-/) !== null;
    return <DeltaTagWrapper negative={isNegative}>{value}</DeltaTagWrapper>;
};

export default DeltaTag;
