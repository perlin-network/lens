import React, { useEffect, useState, useCallback } from "react";
import { Box, Flex } from "@rebass/grid";
import styled from "styled-components";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";
import { observer } from "mobx-react-lite";
import { Perlin } from "../../Perlin";
import { withRouter, RouteComponentProps } from "react-router";
import "../config/config.scss";

const Title = styled.p`
    font-family: Montserrat;
    font-size: 30px;
    color: #fff;
    margin-bottom: 15px;
    font-weight: 400;
`;

const Button = styled.button`
    width: 160px;
    height: 40px;
    border: 0;
    border-radius: 5px;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: 600;
    color: #151b35;
    background-color: #fff;
    cursor: pointer;
    &:active {
        background-color: #d4d5da;
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
    padding: 10px;
    &:hover {
        cursor: text;
        border: 1px solid #4a41d1;
    }
    &:focus {
        cursor: text;
        border: 1px solid #4a41d1;
        outline: 0;
    }
    &::placeholder {
        color: #717985;
        opacity: 0.8;
        font-size: 16px;
    }
`;

const Alert = styled.p`
    color: red;
`;

const Row = styled(Flex)`
    margin-top: 25px;
    margin-bottom: ${props => props.theme.margin.row};
`;

const perlin = Perlin.getInstance();

const DEFAULT_SECRET_KEY =
    "87a6813c3b4cf534b6ae82db9b1409fa7dbd5c13dba5858970b56084c4a930eb400056ee68a7cc2695222df05ea76875bc27ec6e61e8e62317c336157019c405";

const LoginContainer: React.FunctionComponent<RouteComponentProps> = ({
    history
}) => {
    const [secretKey, setSecretKey] = useState<string>(DEFAULT_SECRET_KEY);

    const [alert, setAlert] = useState<string>();

    const handleChange = useCallback((e: any) => {
        setSecretKey(e.target.value);
    }, []);

    const login = async () => {
        if (!secretKey) {
            setAlert("Field is Empty.");
            return;
        }

        if (secretKey.length !== 128) {
            setAlert("Invalid Secret Key.");
            return;
        }

        try {
            setAlert("");
            await perlin.setSecretKey(secretKey);
            history.push("/");
        } catch (err) {
            setAlert(`Cannot find the host.`);
        }
    };

    return (
        <>
            <Row>
                <Box width={2 / 3}>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                &nbsp;Login&nbsp;using&nbsp;a&nbsp;private&nbsp;key
                            </CardTitle>
                        </CardHeader>
                        <CardBody>
                            <p>&nbsp;Input&nbsp;private&nbsp;key&nbsp;:</p>
                            <div className="input-grid">
                                <div
                                    className="input-row1"
                                    style={{ width: "100%" }}
                                >
                                    <Input
                                        placeholder={`${DEFAULT_SECRET_KEY}`}
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
                                <div className="input-row2">
                                    <Button onClick={login}>Import</Button>
                                </div>
                                <div style={{ paddingTop: "20px" }}>
                                    {alert && <Alert>{alert}</Alert>}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Box>
            </Row>
        </>
    );
};

export default withRouter(observer(LoginContainer));
