import * as React from "react";
import { useCallback, useState } from "react";
import { Button, Card, Input } from "../common/core";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import { Perlin } from "../../Perlin";
import ContractStore from "./ContractStore";
import * as Wabt from "wabt";
import ContractInstantiate from "./ContractInstantiate";

declare let WebAssembly: any;
declare let window: any;

// @ts-ignore
const wabt = Wabt();

const perlin = Perlin.getInstance();
const contractStore = ContractStore.getInstance();
const contractInstantiate = ContractInstantiate.getInstance();

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
const StyledInput = styled(Input).attrs({ fontSize: "12px" })`
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    flex-grow: 1;
`;
const StyledButton = styled(Button).attrs({ hideOverflow: true })`
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

const createSmartContract = async (file: File) => {
    const reader = new FileReader();

    const bytes: ArrayBuffer = await new Promise((resolve, reject) => {
        reader.onerror = () => {
            reader.abort();
            reject(new DOMException("Failed to parse contract file."));
        };

        reader.onload = () => {
            resolve(reader.result as any);
        };
        reader.readAsArrayBuffer(file);
    });

    const resp = await perlin.createSmartContract(bytes);

    const wasmModule = wabt.readWasm(new Uint8Array(bytes), {
        readDebugNames: false
    });
    wasmModule.applyNames();

    contractStore.contract.name = file.name;
    contractStore.contract.transactionId = resp.tx_id;
    contractStore.contract.textContent = wasmModule.toText({
        foldExprs: true,
        inlineExport: false
    });
};

const loadContract = async (contractId: string) => {
    const account = await perlin.getAccount(contractId);

    if (!account.is_contract) {
        console.log("Account is not a contract."); // TODO(kenta): show prompt that account is not a contract
        return;
    }

    const pages = [];

    for (let i = 0; i < account.num_mem_pages; i++) {
        try {
            pages.push(await perlin.getContractPage(contractId, i));
        } catch (err) {
            pages.push([]);
        }
    }

    console.log(pages);

    const hexContent = await perlin.getContractCode(contractId);

    const bytes = new Uint8Array(Math.ceil(hexContent.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hexContent.substr(i * 2, 2), 16);
    }

    const module = wabt.readWasm(bytes, { readDebugNames: false });
    module.applyNames();

    contractStore.contract.name = contractId;
    contractStore.contract.transactionId = contractId;
    contractStore.contract.textContent = module.toText({
        foldExprs: true,
        inlineExport: false
    });
};

const ContractUploader: React.SFC<{}> = () => {
    const [loading, setLoading] = useState(false);
    const [contractAddress, setContractAddress] = useState("");
    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContractAddress(e.target.value);
    };
    const handleLoadClick = useCallback(async () => {
        try {
            await loadContract(contractAddress);
        } catch (err) {
            console.error(err);
        }
    }, [contractAddress]);
    const onDropAccepted = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setLoading(true);

        try {
            await createSmartContract(file);
            contractInstantiate.localDeploy();
        } catch (err) {
            console.log("Error while uploading file: ");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: "application/wasm",
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
                <StyledInput
                    value={contractAddress}
                    placeholder="Enter the address of a deployed smart contract"
                    onChange={handleAddressChange}
                />
                <StyledButton onClick={handleLoadClick}>
                    Load Contract
                </StyledButton>
            </InputWrapper>
            {loading && <Loader>Uploading Contract...</Loader>}
        </Wrapper>
    );
};

export default ContractUploader;
