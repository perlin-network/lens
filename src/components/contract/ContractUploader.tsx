import * as React from "react";
import { useCallback, useState } from "react";
import { Button as RawButton, Card, Input } from "../common/core";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import { Perlin, NotificationTypes } from "../../Perlin";
import ContractStore from "./ContractStore";
import * as Wabt from "wabt";
import { observer } from "mobx-react-lite";

// @ts-ignore
const wabt = Wabt();

const perlin = Perlin.getInstance();
const contractStore = ContractStore.getInstance();

const Wrapper = styled(Card)`
    position: relative;
    padding: 10px 0px;
    background-color: transparent;
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
const StyledInput = styled(Input)`
    border-radius: 5px 0px 0px 5px;
    flex-grow: 1;
    height: 48px;
    font-size: 16px;
    background-color: #171d39;
    font-weight: 400;
    border: 1px solid #2e345100;
    font-family: HKGrotesk;
    color: white;
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

const Button = styled(RawButton)`
    height: 48px;

    font-size: 16px;
    font-weight: 600;
    background-color: #fff;
    color: #151b35;
    border-radius: 5px;
    &:active {
        background-color: #d4d5da;
    }
`;

const StyledButton = styled(RawButton).attrs({ hideOverflow: true })`
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    height: 48px;
    line-height: 35px;
    border-radius: 0px 5px 5px 0px;
    background-color: #fff;
    font-size: 16px;
    font-weight: 600;
    color: #151b35;
    width: auto;
    padding: 0 18px;
    &:active {
        background-color: #d4d5da;
    }
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
const errorNotification = (message: string) => {
    perlin.notify({
        type: NotificationTypes.Danger,
        message
    });
};

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

    contractStore.contract.errorMessage = "";
    contractStore.contract.transactionId = "";

    try {
        const resp = await perlin.createSmartContract(bytes);

        if (resp.error) {
            contractStore.contract.errorMessage = `${resp.status} : ${
                resp.error
            }`;
        } else {
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
            contractStore.contract.errorMessage = "";
        }
    } catch (error) {
        contractStore.contract.errorMessage = `${"Error"} : ${`Connection Failed`}`;
    }
};

const loadContract = async (contractId: string) => {
    try {
        const account = await perlin.getAccount(contractId);

        /*
        if (!account.is_contract) {
            contractStore.contract.errorMessage = "Account is not a contract.";
            console.log("Account is not a contract.");
            return;
        } 
        */

        contractStore.contract.errorMessage = "";
        contractStore.contract.transactionId = "";

        const pages = [];

        for (let i = 0; i < account.num_mem_pages; i++) {
            try {
                pages.push(await perlin.getContractPage(contractId, i));
            } catch (err) {
                pages.push([]);
            }
        }

        console.log(pages);

        // todo: import memory page to local wasm instance

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
        contractStore.contract.errorMessage = "";
    } catch (err) {
        contractStore.contract.errorMessage = err.message;
    }
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

            if (contractStore.contract.transactionId) {
                await contractStore.onLoadContract();
                // load state here
            }
        } catch (err) {
            errorNotification(err.message);
        }
    }, [contractAddress]);

    const onDropAccepted = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setLoading(true);
        try {
            await createSmartContract(file);
            if (contractStore.contract.transactionId) {
                await contractStore.onLoadContract();
            }
        } catch (err) {
            console.log("Error while uploading file: ");
            errorNotification(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: "application/wasm",
        onDropAccepted,
        multiple: false
    });
    if (contractStore.contract.errorMessage !== "") {
        errorNotification(contractStore.contract.errorMessage);
        contractStore.contract.errorMessage = "";
    }
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

            {contractStore.contract.transactionId !== "" && (
                <div
                    style={{
                        textAlign: "center",
                        marginTop: "25px",
                        color: "#4A41D1"
                    }}
                >
                    {`Success! Your smart contracts ID is: ${
                        contractStore.contract.transactionId
                    }`}
                </div>
            )}
        </Wrapper>
    );
};

export default observer(ContractUploader);
