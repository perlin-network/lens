import * as React from "react";
import styled from "styled-components";

interface IFunctionSelectProps {
    value: string;
    values: string[];
    onChange: (functionName: string) => void;
}
interface IItemProps {
    active: boolean;
}

const Wrapper = styled.div`
    height: 150px;
    width: 100%;
    background-color: #0a0e28;
    border-radius: 2px;
    border: solid 0.5px #ffffff;
`;
const Item = styled.div`
    font-size: 14px;
    font-family: HKGrotesk;
    color: #fff;
    width: 100%;
    padding: 5px 15px;
    cursor: pointer;
    ${(props: IItemProps) =>
        props.active &&
        `
        background: rgba(255, 255, 255, 0.1);
    `}
`;
const ItemPrefix = styled.span`
    margin: 0;
    color: #f5a623;
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
                    {` ${funcName} (..) {..}`}
                </Item>
            ))}
        </Wrapper>
    );
};

export default FunctionSelect;
