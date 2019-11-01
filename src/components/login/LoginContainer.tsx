import React, { useEffect, useState, useCallback } from "react";
import { Box, Flex } from "@rebass/grid";
import styled from "styled-components";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";
import { observer } from "mobx-react-lite";
import { Perlin, NotificationTypes } from "../../Perlin";
import { withRouter, RouteComponentProps, Redirect } from "react-router";
import "../config/config.scss";
import { Config } from "../config/Config";
import usePrivateKey from "./usePrivateKey";
import {
    LargeInput,
    FileInputWrapper,
    WhiteButton,
    ButtonOutlined,
    FileButton,
    FileInput,
    Textarea
} from "../common/core";
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
    const {
        generateNewKeys,
        privateKey,
        downloadKey,
        handleFileChange,
        handleChange
    } = usePrivateKey(errorNotification);

    const [alert, setAlert] = useState<string>();

    const currentHost = getCurrentHost();

    useEffect(() => {
        generateNewKeys();
    }, []);

    const login = async () => {
        if (!privateKey) {
            errorNotification("Please enter a Private key");
            return;
        }

        if (privateKey.length !== 128) {
            errorNotification("Invalid Private Key.");
            return;
        }

        try {
            setAlert("");
            await perlin.login(privateKey);
            history.push("/");
            perlin.notify({
                type: NotificationTypes.Success,
                message: "You have Logged In"
            });
        } catch (err) {
            console.log(err);
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
                        <form onSubmit={login}>
                            <Box mb={4}>
                                <label>Private Key</label>
                                <div
                                    className="input-row1"
                                    style={{ width: "100%" }}
                                >
                                    <Textarea
                                        onChange={handleChange}
                                        value={privateKey}
                                        rows={4}
                                        style={{
                                            width: "100%",
                                            height: "100px",
                                            fontSize: "14px"
                                        }}
                                    />
                                </div>
                                <Row>
                                    <ButtonOutlined
                                        tabIndex={-1}
                                        type="button"
                                        onClick={generateNewKeys}
                                    >
                                        Generate New Key
                                    </ButtonOutlined>
                                    <FileInputWrapper>
                                        <FileInput
                                            tabIndex={-1}
                                            onChange={handleFileChange}
                                        />
                                        <FileButton tabIndex={-1}>
                                            Import from a file
                                        </FileButton>
                                    </FileInputWrapper>
                                    <ButtonOutlined
                                        tabIndex={-1}
                                        type="button"
                                        onClick={downloadKey}
                                        disabled={!privateKey}
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

                            <WhiteButton width="140px">Login</WhiteButton>
                        </form>
                    </CardBody>
                </Card>
            </Box>
        </Wrapper>
    );
};

export default withRouter(observer(LoginContainer));
