import * as React from "react";
import styled from "styled-components";
import { Input } from "../common/core";
import { Flex, Box } from "@rebass/grid";
import Dropdown, { Option } from "react-dropdown";
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
    Bytes = "Bytes",
    Uint64 = "Uint64",
    String = "String",
    Uint16 = "Uint16",
    Uint32 = "Uint32",
    Byte = "Byte"
}

const typeOptions = [
    ParamType.Bytes,
    ParamType.Uint64,
    ParamType.Uint32,
    ParamType.Uint16,
    ParamType.String,
    ParamType.Byte
];

const Wrapper = styled(Flex)`
    margin-bottom: 30px;
`;
const StyledInput = styled(Input)`
    margin-left: 10px;
    margin-right: 15px;
    flex-grow: 1;
    height: 100%;
    width: 90%;
    font-size: 16px;
    font-weight: 400;
    font-family: HKGrotesk;
    color: #fff;
    background-color: #171d39;
    border: 1px solid #2e345100;
    border-radius: 5px;
    &:hover {
        cursor: text;
        border: 1px solid #4a41d1;
    }
    &:focus {
        cursor: text;
        border: 1px solid #4a41d1;
        outline: 0;
    }
`;
const DeleteIcon = styled.img.attrs({ src: CloseIconSVG })`
    height: 15px;
    width: 15px;
    object-fit: contain;
    cursor: pointer;
    color: #fff;
    opacity: 0.3;
`;

// todo : fix background color
const StyledDropdown = styled(Dropdown)`
    height: 100%;
    font-size: 16px;
    font-weight: 400;
    font-family: HKGrotesk;
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
            <Box width={4 / 12}>
                <StyledDropdown
                    options={typeOptions}
                    placeholder="Select Type"
                    value={type}
                    onChange={handleTypeChange}
                />
            </Box>
            <Box width={8 / 12}>
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
