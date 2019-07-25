import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { WalletIcon, StakeIcon, EarningsIcon } from "./common/typography";
import "../index.scss";
import { Flex, Box } from "@rebass/grid";
import { Perlin, NotificationTypes } from "../Perlin";
import { observer } from "mobx-react-lite";
import { CopyIcon } from "./common/typography";
import { QRCodeWidget } from "./common/qr";
import Modal from "./common/modal";
import Faucet from "./Faucet";
import { numberWithCommas, WhiteButton } from "./common/core";

const Header = styled(Flex)`
    padding: 10px 0px 10px 0px;
    border: 0;
    border-radius: 0;
`;
const Value = styled.div`
    white-space: nowrap;
    margin-top: 5px;
    color: #717985;
    display: block;
    font-weight: 400;
    font-size: 14px;
    min-width: 0;

    .truncate {
        display: inline-block;
        max-width: 100%;
        vertical-align: top;
    }
`;
const LinkValue = styled(Value).attrs({
    as: "a"
})`
    .bp3-dark & {
        color: #717985;

        &:focus {
            outline: none;
        }
        &:hover {
            opacity: 0.8;
            color: #717985;
        }
    }
`;
const Container = styled(Flex)`
    width: 100%;
    margin-bottom: 16px;
    margin-right: 0;
    justify-content: flex-end;

    ${CopyIcon} {
        margin-right: 10px;
        width: 10px;
        margin-top: 2px;
    }
`;

const Item = styled(Box)`
    padding: 16px 16px 16px 16px;
    text-align: right;
    font-weight: 600;
    font-size: 14px;
    font-family: HKGrotesk;
    overflow: hidden;

    .icon {
        width: 12px;
        margin-right: 10px;
    }

    &.align-left {
        text-align: left;
    }

    &:last-child {
        padding-right: 0;
    }
`;

const FaucetButton = styled(WhiteButton)`
    padding: 12px 10px;
    font-size: 14px;
`;
const WalletItem = styled(Item)`
    flex: 1;
    text-align: left;
`;
const perlin = Perlin.getInstance();

const Navbar: React.FunctionComponent<{}> = () => {
    const [openedFaucet, setOpenedFaucet] = useState(false);
    const balance = perlin.account.balance;
    const isLoggedIn = perlin.isLoggedIn;

    const stake = perlin.account.stake;
    const pubKey = isLoggedIn ? perlin.publicKeyHex : undefined;
    const reward = perlin.account.reward;

    const copyPubkeyToClipboard = () => {
        const el = document.createElement("textarea");
        if (pubKey !== undefined) {
            el.value = pubKey;
            el.setAttribute("readonly", "");
            el.style.position = "absolute";
            el.style.left = "-9999px";
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);

            perlin.notify({
                type: NotificationTypes.Success,
                message: "Public Key copied to clipboard"
            });
        }
    };
    const openFaucet = useCallback(() => {
        setOpenedFaucet(true);
    }, []);
    const closeFaucet = useCallback(() => {
        setOpenedFaucet(false);
    }, []);

    const LoggedBar = () => {
        return (
            <Header>
                <Container>
                    <QRCodeWidget
                        publicKeyHex={pubKey || ""}
                        clickable={true}
                        width={50}
                        height={50}
                    />
                    <WalletItem>
                        <span className="nowrap">Your Wallet Address</span>
                        <LinkValue
                            title={pubKey}
                            onClick={copyPubkeyToClipboard}
                        >
                            <CopyIcon />
                            <span className="truncate">{pubKey}</span>
                        </LinkValue>
                    </WalletItem>
                    <Item>
                        <span className="nowrap">
                            <WalletIcon className="icon" />
                            Your Balance
                        </span>
                        <Value title={balance}>
                            <span className="truncate">
                                {numberWithCommas(balance)}
                            </span>{" "}
                            PERLs
                        </Value>
                    </Item>
                    <Item flex="0 0 auto">
                        <span className="nowrap">
                            <StakeIcon className="icon" />
                            Your Stake
                        </span>
                        <Value title={stake + ""}>
                            <span className="truncate">
                                {numberWithCommas(stake)}
                            </span>{" "}
                            PERLs
                        </Value>
                    </Item>
                    <Item flex="0 0 auto">
                        <span className="nowrap">
                            <EarningsIcon className="icon" />
                            Available Rewards
                        </span>
                        <Value title={reward + ""}>
                            <span className="truncate">
                                {numberWithCommas(reward)}
                            </span>{" "}
                            PERLs
                        </Value>
                    </Item>
                    <Item flex="0 0 auto">
                        <FaucetButton onClick={openFaucet}>Faucet</FaucetButton>
                        <Modal open={openedFaucet} onClose={closeFaucet}>
                            <Faucet />
                        </Modal>
                    </Item>
                </Container>
            </Header>
        );
    };

    return isLoggedIn ? <LoggedBar /> : <Header />;
};

export default observer(Navbar);
