import * as React from "react";
import styled from "styled-components";
import { Input } from "../common/core";
import { Flex } from "@rebass/grid";
import Dropdown, { Option } from "react-dropdown";
import CloseIconSVG from "../../assets/svg/close-icon.svg";

interface IParameterInputProps {
    onDelete: () => void;
    onChange: (value: string) => void;
    onTypeChange: (type: ParamType) => void;
    value: string;
    type: ParamType | undefined;
}

export enum ParamType {
    String = "String",
    Uint16 = "Uint16",
    Uint32 = "Uint32",
    Uint64 = "Uint64",
    Bytes = "Bytes",
    Byte = "Byte"
}

const typeOptions = [
    ParamType.String,
    ParamType.Uint16,
    ParamType.Uint32,
    ParamType.Uint64,
    ParamType.Bytes,
    ParamType.Byte
];

const Wrapper = styled(Flex)`
    margin-bottom: 30px;
`;
const StyledInput = styled(Input)`
    margin-left: 10px;
    margin-right: 15px;
    flex-grow: 1;
`;
const DeleteIcon = styled.img.attrs({ src: CloseIconSVG })`
    height: 15px;
    width: 15px;
    object-fit: contain;
    cursor: pointer;
`;

const ParameterInput: React.SFC<IParameterInputProps> = ({
    onDelete,
    onChange,
    onTypeChange,
    value,
    type
}) => {
    const handleTypeChange = (option: Option) => {
        onTypeChange(option.value as ParamType);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <Wrapper alignItems="center">
            <Dropdown
                options={typeOptions}
                placeholder="Select a Type"
                value={type}
                onChange={handleTypeChange}
            />
            <StyledInput
                disabled={!type}
                placeholder="Add parameter here"
                value={value}
                onChange={handleChange}
            />
            <DeleteIcon onClick={onDelete} />
        </Wrapper>
    );
};

export default ParameterInput;
