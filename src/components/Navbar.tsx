import * as React from "react";
import styled from "styled-components";
import {
    WalletIcon,
    StakeIcon,
    NetworkIcon,
    EarningsIcon
} from "./common/typography";
import "../index.scss";
import { Flex, Box } from "@rebass/grid";
import { Perlin } from "../Perlin";
import { observer } from "mobx-react-lite";
import { CopyIcon, QrCodeIcon } from "./common/typography";
import { QRCodeWidget } from "./common/qr";

const Header = styled(Flex)`
    padding: 10px 0px 10px 0px;
    border: 0;
    border-radius: 0;
`;
const Value = styled.div`
    white-space: nowrap;
    margin-top: 5px;

    .truncate {
        display: inline-block;
        max-width: calc(100% - 30px);
        vertical-align: top;
    }
`;
const Container = styled(Flex)`
    width: 100%;
    margin-bottom: 16px;
    margin-right: 16px;
    justify-content: flex-end;

    ${CopyIcon} {
        margin-right: 10px;
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

    & > div {
        color: #717985;
        display: block;
        font-weight: 400;
        font-size: 14px;
        cursor: pointer;
        &:focus {
            outline: none;
        }
        &:hover {
            opacity: 0.8;
        }
    }
`;

const perlin = Perlin.getInstance();

const Navbar: React.FunctionComponent<{}> = observer(() => {
    const balance = perlin.account.balance;
    const pubKey = perlin.publicKeyHex;
    const stake = perlin.account.stake;
    const reward = perlin.account.reward;

    const copyPubkeyToClipboard = () => {
        const el = document.createElement("textarea");
        el.value = pubKey;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);

        // todo : show success message
    };

    return (
        <Header>
            <Container>
                <Item>
                    <span className="nowrap">Your Wallet Address</span>
                    <Value title={pubKey} onClick={copyPubkeyToClipboard}>
                        <CopyIcon />
                        <span className="truncate">{pubKey}</span>
                    </Value>
                </Item>
                <Item>
                    <span className="nowrap">
                        <WalletIcon className="icon" />
                        Your Balance
                    </span>
                    <Value title={balance}>
                        <span className="truncate">{balance || 0}</span> PERLs
                    </Value>
                </Item>
                <Item flex="0 0 auto">
                    <span className="nowrap">
                        <StakeIcon className="icon" />
                        Your Stake
                    </span>
                    <Value title={stake + ""}>
                        <span className="truncate">{stake || 0}</span> PERLs
                    </Value>
                </Item>
                <Item flex="0 0 auto">
                    <span className="nowrap">
                        <EarningsIcon className="icon" />
                        Available Rewards
                    </span>
                    <Value title={reward + ""}>
                        <span className="truncate">{reward || 0}</span> PERLs
                    </Value>
                </Item>
                <QRCodeWidget
                    publicKeyHex={pubKey}
                    clickable={true}
                    width={50}
                    height={50}
                />
            </Container>
        </Header>
    );
});

export default Navbar;
