import * as React from "react";
import { Card, Button } from "../common/core";
import styled from "styled-components";

const Wrapper = styled(Card)`
    padding: 25px 25px;
`;
const DividerWrapper = styled.div`
    display: flex;
    align-items: center;
    margin: 23px 0;
`;
const Divider = styled.hr`
    border: 0;
    width: 100%;
    height: 1px;
    background-color: rgba(155, 155, 155, 0.56);
    color: rgba(155, 155, 155, 0.56);
`;
const DividerText = styled.h2`
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin: 0 16px;
`;
const InputWrapper = styled.div`
    display: flex;
`;
const Input = styled.input`
    outline: none;
    border: none;
    flex-grow: 1;
    min-width: 200px;
    border-radius: 2px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    height: 35px;
    background-color: #fff;
    padding: 10px 15px;
    font-family: HKGrotesk;
    font-size: 12px;
    font-weight: normal;
    &:focus {
        outline: none;
    }
    &::placeholder {
        color: #717985;
        opacity: 0.8;
    }
`;
const StyledButton = styled(Button)`
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    height: 35px;
    line-height: 35px;
    font-size: 14px;
    width: auto;
    padding: 0 18px;
`;

const ContractUploader: React.SFC<{}> = () => {
    return (
        <Wrapper showBoxShadow={false} flexDirection="column">
            <Button fontSize="14px" width="100%">
                Upload Smart Contract
            </Button>
            <DividerWrapper>
                <Divider />
                <DividerText>OR</DividerText>
                <Divider />
            </DividerWrapper>
            <InputWrapper>
                <Input placeholder="Enter the address of a deployed smart contract" />
                <StyledButton>Load Contract</StyledButton>
            </InputWrapper>
        </Wrapper>
    );
};

export default ContractUploader;
