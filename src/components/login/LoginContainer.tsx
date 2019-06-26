import React, { useEffect, useState, useCallback } from "react";
import { Box, Flex } from "@rebass/grid";
import styled from "styled-components";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";
import { observer } from "mobx-react-lite";
import { Perlin, NotificationTypes } from "../../Perlin";
import { withRouter, RouteComponentProps, Redirect } from "react-router";
import "../config/config.scss";
import { Config } from "../config/Config";
import { LargeInput } from "../common/core";
import { getCurrentHost, setCurrentHost } from "../../storage";

const Title = styled.h1`
    font-family: Montserrat;
    margin-bottom: 15px;
    font-weight: 600;
    font-size: 35px;
`;
const SubTitle = styled.p`
    font-size: 20px;
`;

const Wrapper = styled(Flex)`
    padding: 70px 70px 50px;
    margin-left: -160px;
    label {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 7px;
        display: block;
    }

    ${LargeInput} {
        width: 80%;
        padding: 15px;
        margin: 10px 0;
    }
`;

// TODO: refactor to reuse Button and ButtonOutlined from core.tsx
const Button = styled.button`
    border: 0;
    border-radius: 5px;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: 600;
    color: #151b35;
    margin-right: 10px;
    background-color: #fff;
    cursor: pointer;
    padding: 10px;
    line-height: 1.3;

    &:disabled,
    &[disabled] {
        pointer-events: none;
        cursor: default;
        opacity: 0.3;
    }

    &:hover,
    &:active {
        background-color: none;
    }
    &:focus {
        outline: none;
    }
`;

const ButtonOutlined = styled(Button)`
    background: none;
    border: solid 1px #fff;
    color: #fff;
    opacity: 0.8;

    &:hover,
    &:active {
        background-color: none;
        opacity: 1;
    }
    &:focus {
        outline: none;
    }
`;

const Input = styled.textarea`
    outline: none;
    border: none;
    border-radius: 5px;
    width: 80%;
    height: 48px;
    font-size: 16px;
    font-weight: 400;
    font-family: HKGrotesk;
    color: #fff;
    background-color: #171d39;
    padding: 10px 15px;
    margin: 10px 0;
    line-height: 1.5;

    &:focus,
    &:active,
    &:hover {
        cursor: text;
        box-shadow: 0 0 0 1px #4a41d1;
        outline: none;
    }
    &::placeholder {
        color: #717985;
        opacity: 0.8;
        font-size: 16px;
    }
`;

const FileInputWrapper = styled.div`
    position: relative;
`;

const FileButton = styled(Button)`
    display: inline-block;
    color: black;
`;

const FileInput = styled.input.attrs({
    type: "file"
})`
    font-size: 200px;
    position: absolute;
    top: 0;
    right: 0;
    opacity: 0;
    cursor: pointer;
`;

const Row = styled(Flex)`
    margin-top: 10px;
`;

const perlin = Perlin.getInstance();

const errorNotification = (message: string) => {
    perlin.notify({
        type: NotificationTypes.Danger,
        message
    });
};

const LoginContainer: React.FunctionComponent<RouteComponentProps> = ({
    history
}) => {
    const [secretKey, setSecretKey] = useState<string>();

    const [alert, setAlert] = useState<string>();

    const handleChange = useCallback((e: any) => {
        setSecretKey(e.target.value);
    }, []);
    const currentHost = getCurrentHost();

    useEffect(() => {
        generateNewKeys();
    }, []);
    const handleFileChange = useCallback((e: any) => {
        try {
            if (e.target.files[0]) {
                const file = e.target.files[0];
                if (file.type !== "text/plain") {
                    errorNotification(
                        `File Type ${file.type} is not supported.`
                    );
                } else {
                    const fileReader = new FileReader();
                    fileReader.onloadend = (readerEvent: any) => {
                        if (typeof fileReader.result === "string") {
                            setSecretKey(fileReader.result);
                        } else {
                            errorNotification(
                                "Can't parse string from the file."
                            );
                        }
                    };
                    fileReader.readAsText(file);
                }
            }
        } catch (err) {
            errorNotification(err);
        }
    }, []);

    const generateNewKeys = () => {
        setSecretKey(perlin.generateNewKeys().secretKey);
    };

    const downloadKey = useCallback(() => {
        const element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," +
                encodeURIComponent(secretKey || "")
        );
        element.setAttribute("download", "private-key.txt");

        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }, [secretKey]);

    const login = async () => {
        if (!secretKey) {
            errorNotification("Please enter a Private key");
            return;
        }

        if (secretKey.length !== 128) {
            errorNotification("Invalid Private Key.");
            return;
        }

        try {
            setAlert("");
            await perlin.login(secretKey);
            history.push("/");
            perlin.notify({
                type: NotificationTypes.Success,
                message: "You have Logged In"
            });
        } catch (err) {
            errorNotification("Cannot find the host.");
        }
    };

    const apiHostChangeHandler = useCallback((event: any) => {
        setCurrentHost(event.target.value);
    }, []);

    if (perlin.isLoggedIn) {
        return <Redirect to={{ pathname: "/" }} />;
    }

    return (
        <Wrapper>
            <Box width={1.2 / 3} pr={5} pt={6}>
                <Title>Welcome to Lens</Title>
                <SubTitle>
                    Please enter your wallet's private key, and Wavelet nodes
                    HTTP API address to continue.
                </SubTitle>
            </Box>
            <Box width={1.8 / 3}>
                <Card>
                    <CardHeader>
                        <CardTitle>Login</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <Box mb={4}>
                            <label>Private Key</label>
                            <div
                                className="input-row1"
                                style={{ width: "100%" }}
                            >
                                <Input
                                    onChange={handleChange}
                                    value={secretKey}
                                    rows={4}
                                    style={{
                                        width: "100%",
                                        height: "100px",
                                        fontSize: "14px"
                                    }}
                                />
                            </div>
                            <Row>
                                <ButtonOutlined onClick={generateNewKeys}>
                                    Generate New Key
                                </ButtonOutlined>
                                <FileInputWrapper>
                                    <ButtonOutlined>
                                        Import from a file
                                    </ButtonOutlined>
                                    <FileInput onChange={handleFileChange} />
                                </FileInputWrapper>
                                <ButtonOutlined
                                    onClick={downloadKey}
                                    disabled={!secretKey}
                                >
                                    Download Key
                                </ButtonOutlined>
                            </Row>
                        </Box>

                        <Box mb={4}>
                            <label>API Address</label>
                            <LargeInput
                                defaultValue={currentHost}
                                onChange={apiHostChangeHandler}
                            />
                        </Box>

                        <Button onClick={login}>Login</Button>
                    </CardBody>
                </Card>
            </Box>
        </Wrapper>
    );
};

export default withRouter(observer(LoginContainer));
