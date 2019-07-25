import React, { useCallback, useState, useEffect, useRef } from "react";
import {
    WhiteButton,
    ButtonOutlined,
    StyledInput,
    Button
} from "./common/core";
import DiscordIcon from "../assets/svg/discord-icon.svg";
import DiscordIconBlack from "../assets/svg/discord-icon-black.svg";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";
import { Perlin, NotificationTypes } from "../Perlin";
import LoadingSpinner, { Spinner } from "./common/loadingSpinner";

const perlin = Perlin.getInstance();

const Wrapper = styled.div`
    text-align: center;
    font-weight: normal;

    h1 {
        margin-top: 0;
    }

    ${WhiteButton} {
        width: auto;
    }

    ${StyledInput} {
        margin: 20px;
    }

    ${Spinner} {
        margin-top: 0;
    }
`;
const FormWrapper = styled.form`
    width: calc(100% - 40px);
    display: flex;

    ${StyledInput} {
        border-radius: 5px 0px 0px 5px;
        flex-grow: 1;
        height: 48px;
        margin: 0;
        width: auto;
    }
    ${Button} {
        height: 48px;
        font-size: 16px;
        font-weight: 600;
        background-color: #fff;
        color: #151b35;
        border-radius: 5px;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        width: auto;
        padding-left: 20px;
        padding-right: 20px;
    }
        &:active {
            background-color: #d4d5da;
        }
    }
`;

const CenterContent = styled(Flex)`
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 70px;
    margin-bottom: 40px;
`;
const FaucetLink = styled(ButtonOutlined)`
    text-decoration: none;
    display: inline-block;
    margin-left: 10px;
    padding: 0px 10px 0px 30px;
    line-height: 30px;
    font-size: 14px;
    background-position: 10px 50%;
    background-repeat: no-repeat;
    background-image: url(${DiscordIcon});
    background-size: 14px auto;

    &:active,
    &:hover {
        background-image: url(${DiscordIconBlack});
    }
`;
const Faucet: React.FunctionComponent = () => {
    const [count, setCount] = useState();
    const [loading, setLoading] = useState();
    const [address, setAddress] = useState(perlin.publicKeyHex);

    useEffect(() => {
        const intv = setInterval(checkDiff, 1000);
        checkDiff();
        return () => {
            clearInterval(intv);
        };
    }, []);

    const fetchPerls = useCallback(async () => {
        const diff = Date.now() - perlin.lastFaucetFetch;
        if (diff > 10000) {
            setLoading(true);
            try {
                const response = await perlin.getPerls(address);
                if (response.result === "ok") {
                    perlin.notify({
                        type: NotificationTypes.Success,
                        message: "Wallet received some PERLs"
                    });
                } else {
                    throw new Error(response.result);
                }
                checkDiff();
            } catch (err) {
                perlin.notify({
                    type: NotificationTypes.Danger,
                    message: err.message || err
                });
            }
            setLoading(false);
        }
    }, [address]);

    const checkDiff = useCallback(() => {
        const diff = Date.now() - perlin.lastFaucetFetch;
        if (diff < 10000) {
            setCount(Math.ceil((10000 - diff) / 1000));
        } else {
            setCount(0);
        }
    }, []);

    const addressChangeHandle = useCallback((event: any) => {
        setAddress(event.target.value);
    }, []);
    return (
        <Wrapper>
            <h1>Quick Faucet</h1>
            <CenterContent>
                {loading ? (
                    <LoadingSpinner />
                ) : count === 0 ? (
                    <FormWrapper onSubmit={fetchPerls}>
                        <StyledInput
                            value={address}
                            placeholder="Enter a wallet"
                            onChange={addressChangeHandle}
                        />
                        <Button type="submit" disabled={!address}>
                            Get PERLs
                        </Button>
                    </FormWrapper>
                ) : (
                    count && <h3>You need wait another {count} seconds.</h3>
                )}
            </CenterContent>
            <div>
                You can get more PERLs on the chat
                <a href="https://discord.gg/dMYfDPM" target="_blank">
                    <FaucetLink>Faucet</FaucetLink>
                </a>
            </div>
        </Wrapper>
    );
};

export default Faucet;
