import * as React from "react";
import { useCallback, useState } from "react";
import { Button as RawButton, Card, Input } from "../common/core";
import { InlineNotification } from "../common/notification/Notification";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import { NotificationTypes, Perlin } from "../../Perlin";
import ContractStore from "./ContractStore";
import * as Wabt from "wabt";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import LoadingSpinner from "../common/loadingSpinner";
import GasLimit from "../common/gas-limit/GasLimit";
import { Contract, TAG_CONTRACT } from "wavelet-client";
import JSBI from "jsbi";
import { TX_FEE } from "src/constants";

// @ts-ignore
const wabt = Wabt();

const perlin = Perlin.getInstance();
const contractStore = ContractStore.getInstance();

const Wrapper = styled(Card)`
    position: relative;
    padding: 0;
    background-color: transparent;
`;

const IntroText = styled.p`
    font-size: 15px;
    line-height: 1.5;
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
const InputWrapper = styled.form`
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
    top: -20px;
    bottom: -20px;
    left: -20px;
    right: -20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.75);
    z-index: 10;
    font-size: 20px;
    font-family: HKGrotesk;
    font-weight: 600;
`;

const errorNotification = (message: string, duration?: number) => {
    perlin.notify({
        type: NotificationTypes.Danger,
        message,
        dismiss: typeof duration !== "undefined" ? { duration } : undefined
    });
};

const successNotification = (title: string, txId: string) => {
    perlin.notify({
        title,
        type: NotificationTypes.Success,
        content: (
            <p>
                You can view your smart contract
                <Link to={"/transactions/" + txId} title={txId} target="_blank">
                    here
                </Link>
            </p>
        ),
        dismiss: { duration: 10000 }
    });
};

const createSmartContract = async (file: File, gasLimit: JSBI) => {
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

    contractStore.contract.transactionId = "";

    try {
        const resp = await perlin.createSmartContract(bytes, gasLimit);

        if (resp.error) {
            errorNotification(`${resp.status}: ${resp.error}`);
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
        }
    } catch (err) {
        errorNotification(`${err.message}`);
    }
};

export const loadContractFromNetwork = async (
    contractId: string
): Promise<number> => {
    const account = await perlin.getAccount(contractId);

    if (!account.is_contract) {
        throw new Error("Contract couldn't be spawned.");
    }

    try {
        const numPages = account.num_mem_pages || 0;

        const bytes = await perlin.getContractCode(contractId);

        const module = wabt.readWasm(bytes, { readDebugNames: false });
        module.applyNames();

        contractStore.contract.name = contractId;
        contractStore.contract.transactionId = contractId;
        contractStore.contract.textContent = module.toText({
            foldExprs: true,
            inlineExport: false
        });

        return numPages;
    } catch (err) {
        errorNotification(err.message || err);
        return 0;
    }
};

const ContractUploader: React.FunctionComponent = () => {
    const [loading, setLoading] = useState(false);
    const [gasLimit, setGasLimit] = useState();
    const [contractAddress, setContractAddress] = useState("");
    const [inlineMessage, setInlineMessage] = useState();
    const handleAddressChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setContractAddress(e.target.value);
        },
        []
    );

    const handleUpdateGasLimit = useCallback((value: string) => {
        setGasLimit(value);
    }, []);
    const delay = (time: any) =>
        new Promise((res: any) => setTimeout(res, time));

    const handleLoad = useCallback(
        async (event: any) => {
            event.preventDefault();
            setLoading(true);
            setInlineMessage(undefined);
            try {
                await loadContractFromNetwork(contractAddress);

                if (contractStore.contract.transactionId) {
                    contractStore.waveletContract = new Contract(
                        perlin.client,
                        contractStore.contract.transactionId
                    );
                    await contractStore.waveletContract.init();

                    successNotification(
                        "",
                        contractStore.contract.transactionId
                    );
                    setInlineMessage({
                        type: "success"
                    });
                }
            } catch (err) {
                errorNotification(err.message || err);
            } finally {
                setLoading(false);
                setGasLimit(undefined);
            }
        },
        [contractAddress]
    );

    const onDropAccepted = useCallback(
        async (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            setLoading(true);
            let gasLimitNumber = JSBI.BigInt(Math.floor(gasLimit || 0));
            gasLimitNumber = JSBI.subtract(gasLimitNumber, JSBI.BigInt(TX_FEE));
            setInlineMessage(undefined);
            try {
                if (
                    // gasLimitNumber.isNaN() ||
                    JSBI.lessThanOrEqual(gasLimitNumber, JSBI.BigInt(0)) ||
                    JSBI.greaterThan(
                        gasLimitNumber,
                        JSBI.BigInt(perlin.account.balance)
                    )
                ) {
                    errorNotification("Invalid Gas Limit");
                    return;
                }
                await createSmartContract(file, gasLimitNumber);

                if (contractStore.contract.transactionId) {
                    const tx = await contractStore.listenForApplied(
                        TAG_CONTRACT,
                        contractStore.contract.transactionId
                    );

                    contractStore.waveletContract = new Contract(
                        perlin.client,
                        tx.id
                    );
                    await contractStore.waveletContract.init();

                    successNotification(
                        "",
                        contractStore.contract.transactionId
                    );
                    setInlineMessage({
                        type: "success"
                    });
                }
            } catch (err) {
                errorNotification(err.message || err, 8000);
                setInlineMessage({
                    type: "error",
                    message: "Failed to spawn contract."
                });
            } finally {
                setLoading(false);
                setGasLimit(undefined);
            }
        },
        [gasLimit]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: "application/wasm",
        onDropAccepted,
        multiple: false
    });

    if (contractStore.contract.errorMessage) {
        errorNotification(contractStore.contract.errorMessage);
    }
    return (
        <Wrapper showBoxShadow={false} flexDirection="column">
            <IntroText>
                Learn how to write your first WebAssembly smart contract by
                clicking{" "}
                <a
                    href="https://wavelet.perlin.net/docs/smart-contracts"
                    target="_blank"
                >
                    here
                </a>
                .
            </IntroText>
            <GasLimit
                balance={perlin.account.balance}
                onChange={handleUpdateGasLimit}
                value={gasLimit}
            />
            <Button fontSize="14px" width="100%" {...getRootProps()}>
                {isDragActive ? "Drop Contract Here" : "Upload Smart Contract"}
                <input {...getInputProps()} />
            </Button>

            <DividerWrapper>
                <Divider />
                <DividerText>OR</DividerText>
                <Divider />
            </DividerWrapper>
            <InputWrapper onSubmit={handleLoad}>
                <StyledInput
                    value={contractAddress}
                    placeholder="Enter the address of a deployed smart contract"
                    onChange={handleAddressChange}
                />
                <StyledButton type="submit">Load Contract</StyledButton>
            </InputWrapper>
            {loading ? (
                <LoadingSpinner />
            ) : (
                inlineMessage && (
                    <InlineNotification className={inlineMessage.type}>
                        <div className="notification-body">
                            <h4 className="notification-title">
                                {inlineMessage.type}
                            </h4>
                            <div className="notification-message">
                                {inlineMessage.message}
                                {contractStore.contract.transactionId && (
                                    <div>
                                        Your smart contract ID:
                                        <span className="result break">
                                            {
                                                contractStore.contract
                                                    .transactionId
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </InlineNotification>
                )
            )}
        </Wrapper>
    );
};

export default observer(ContractUploader);
