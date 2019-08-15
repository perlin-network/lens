import * as React from "react";
import styled from "styled-components";
import { StyledInput, StyledDropdown } from "../common/core";
import { Flex, Box } from "@rebass/grid";
import { Option } from "react-dropdown";

import CloseIconSVG from "../../assets/svg/close-icon.svg";

interface IParameterInputProps {
    onDelete: () => void;
    onChange: (value: string) => void;
    onTypeChange: (type: ParamType) => void;
    onKeypress: (key: string) => void;
    value: string;
    type: ParamType | undefined;
}

export enum ParamType {
    Int16 = "int16",
    Int32 = "int32",
    Int64 = "int64",
    Uint16 = "uint16",
    Uint32 = "uint32",
    Uint64 = "uint64",
    Byte = "byte",
    Raw = "raw",
    Bytes = "bytes",
    String = "string"
}

const typeOptions = [
    ParamType.Int16,
    ParamType.Int32,
    ParamType.Int64,
    ParamType.Uint16,
    ParamType.Uint32,
    ParamType.Uint64,
    ParamType.Byte,
    ParamType.Raw,
    ParamType.Bytes,
    ParamType.String
];

const Wrapper = styled(Flex)`
    margin-bottom: 30px;
`;

const DeleteIcon = styled.img.attrs({ src: CloseIconSVG })`
    height: 15px;
    width: 15px;
    object-fit: contain;
    cursor: pointer;
    color: #fff;
    opacity: 0.3;
`;

const ParameterInput: React.SFC<IParameterInputProps> = ({
    onDelete,
    onChange,
    onTypeChange,
    onKeypress,
    value,
    type
}) => {
    const handleTypeChange = (option: Option) => {
        onTypeChange(option.value as ParamType);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        onKeypress(e.key);
    };

    return (
        <Wrapper alignItems="center">
            <Box width={4 / 12} mr={3}>
                <StyledDropdown
                    options={typeOptions}
                    placeholder="Select Type"
                    value={type}
                    onChange={handleTypeChange}
                />
            </Box>
            <Box width={8 / 12} mr={3}>
                <StyledInput
                    disabled={!type}
                    placeholder="Add parameter here"
                    value={value}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                />
            </Box>
            <DeleteIcon onClick={onDelete} />
        </Wrapper>
    );
};

export default ParameterInput;
