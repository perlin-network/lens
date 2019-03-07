import * as React from "react";
import { useCallback, useState } from "react";
import { Card, Button } from "../common/core";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import { Perlin } from "../../Perlin";
import ContractStore from "./ContractStore";

const perlin = Perlin.getInstance();
const contractStore = ContractStore.getInstance();

const Wrapper = styled(Card)`
    position: relative;
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
const Loader = styled.div`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.75);
    z-index: 10;
    font-size: 20px;
    font-family: HKGrotesk;
    font-weight: 600;
`;

const ContractUploader: React.SFC<{}> = () => {
    const [loading, setLoading] = useState(false);
    const onDropAccepted = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setLoading(true);
        try {
            const resp = await perlin.createSmartContract(file);
            contractStore.contract.name = file.name;
            contractStore.contract.transactionId = resp.tx_id;
        } catch (err) {
            console.log("Error while uploading file: " + err);
        } finally {
            setLoading(false);
        }
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDropAccepted,
        multiple: false
    });

    return (
        <Wrapper showBoxShadow={false} flexDirection="column">
            <Button fontSize="14px" width="100%" {...getRootProps()}>
                {isDragActive ? "Drop Contract Here" : "Upload Smart Contract"}
                <input {...getInputProps()} />
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
            {loading && <Loader>Uploading Contract...</Loader>}
        </Wrapper>
    );
};

export default ContractUploader;
