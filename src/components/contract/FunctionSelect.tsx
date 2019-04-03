import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { CheckedIcon } from "../common/typography";

interface IFunctionSelectProps {
    value: string;
    values: string[];
    onChange: (functionName: string) => void;
}
interface IItemProps {
    active: boolean;
}

const Icon = styled(CheckedIcon)`
    width: 16px;
    height: 16px;
    float: right;
`;

const Wrapper = styled.div`
    height: 150px;
    width: 100%;
    background-color: transaparent;
    margin: 0px;
    overflow: scroll;
`;
const Item = styled.div`
    font-size: 14px;
    font-weight: 400;
    font-family: HKGrotesk;
    color: #fff;
    width: 100%;
    height: 50px;
    cursor: pointer;
    padding: 15px 15px 0px 15px;
    ${(props: IItemProps) =>
        props.active &&
        `
        background: rgba(255, 255, 255, 0.1);
    `}
`;
const ItemPrefix = styled.span`
    margin: 0;
    color: #4a41d1;
    font-weight: 400;
    font-size: 14px;
    margin-right: 15px;
`;

const Checked = styled.div`
    font-size: 14px;
    font-weight: 400;
    font-family: HKGrotesk;
    ccolor: #4a41d1;
    text-align: right;
`;

const FunctionSelect: React.SFC<IFunctionSelectProps> = ({
    value,
    values,
    onChange
}) => {
    const handleFuncClick = (funcName: string) => () => {
        onChange(funcName);
    };

    return (
        <Wrapper>
            {values.map((funcName, idx) => (
                <Item
                    key={idx + funcName}
                    active={funcName === value}
                    onClick={handleFuncClick(funcName)}
                >
                    <ItemPrefix>fn</ItemPrefix>
                    {` ${funcName} [..] [..]`}
                    {funcName === value && <Icon />}
                </Item>
            ))}
        </Wrapper>
    );
};

export default FunctionSelect;
