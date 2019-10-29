import React, { useState, useCallback } from "react";
import { Box, Flex } from "@rebass/grid";
import styled from "styled-components";
import {} from "../common/core";
import { Config } from "../config/Config";
import {
    getCurrentHost,
    setCurrentHost,
    getSecretKey,
    setSecretKey
} from "../../storage";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";
import { Perlin, NotificationTypes } from "../../Perlin";
import {
    ButtonOutlined,
    Input,
    LargeInput,
    FileInputWrapper,
    FileButton,
    FileInput,
    Textarea
} from "../common/core";
import usePrivateKey from "../login/usePrivateKey";

const perlin = Perlin.getInstance();
const Title = styled.p`
    font-family: Montserrat;
    font-size: 30px;
    color: #fff;
    margin-bottom: 15px;
    font-weight: 400;
`;

const errorNotification = (message: string) => {
    perlin.notify({
        type: NotificationTypes.Danger,
        message
    });
};

const SettingsContainer = () => {
    const currentHost = getCurrentHost();
    const storedKey = getSecretKey();
    const {
        generateNewKeys,
        privateKey,
        setPrivateKey,
        downloadKey,
        handleFileChange
    } = usePrivateKey(errorNotification, storedKey);
    const privakeKeyChange = useCallback(
        value => {
            setSecretKey(value);
            setPrivateKey(value);
        },
        [privateKey]
    );
    return (
        <>
            <Title>Settings</Title>

            <Box width={2 / 3} mb={4}>
                <Card>
                    <CardHeader>
                        <CardTitle>Private Key</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <Config
                            onChange={privakeKeyChange}
                            value={privateKey}
                            textarea={true}
                            confirmationMessage="Are you sure you want to change your Private Key?"
                        >
                            <Flex mt={3}>
                                <ButtonOutlined onClick={generateNewKeys}>
                                    Generate New Key
                                </ButtonOutlined>
                                <FileInputWrapper>
                                    <FileInput onChange={handleFileChange} />
                                    <FileButton>Import from a file</FileButton>
                                </FileInputWrapper>
                                <ButtonOutlined
                                    onClick={downloadKey}
                                    disabled={!privateKey}
                                >
                                    Download Key
                                </ButtonOutlined>
                            </Flex>
                        </Config>
                    </CardBody>
                </Card>
            </Box>

            <Box width={2 / 3}>
                <Card>
                    <CardHeader>
                        <CardTitle>API Address</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <Config
                            value={currentHost}
                            onChange={setCurrentHost}
                            confirmationMessage="Are you sure you want to reconfigure your API host?"
                        />
                    </CardBody>
                </Card>
            </Box>
        </>
    );
};

export default SettingsContainer;
