import * as React from "react";
import styled from "styled-components";

import "../index.scss";
import { Flex, Box } from "@rebass/grid";
import { Perlin } from "../Perlin";
import { observer } from "mobx-react-lite";
import { CopyIcon, QrCodeIcon } from "./common/typography";
import { QRCodeWidget } from "./common/qr";
import Address from "./common/address";

const Header = styled(Flex)`
    padding: 10px 0px 10px 0px;
    border: 0;
    border-radius: 0;
`;

const Container = styled.div`
    width: 100%;
    height: 50px;
    display: flex;
    margin-bottom: 16px;
    margin-right: 16px;
    justify-content: flex-end;
`;

const Item = styled.div`
    padding: 16px 16px 16px 16px;
    text-align: right;
    font-weight: 600;
    font-size: 14px;
    font-family: HKGrotesk;
    & > span {
        color: #717985;
        display: block;
        font-weight: 400;
        font-size: 14px;
        margin-top: 3px;
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

const Navbar: React.FunctionComponent<{}> = () => {
    const balance = perlin.account.balance;
    const pubKey = perlin.publicKeyHex;
    const stake = perlin.account.stake;

    return (
        <Header>
            <Container>
                <Item>
                    My Address
                    <Address width={100} value={pubKey} />
                </Item>
                <Item>
                    My Balance
                    <span>{balance ? balance : "0"}&nbsp;PERLs</span>
                </Item>
                <Item>
                    My Stake
                    <span>{stake ? stake : "0"}&nbsp;PERLs</span>
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
};

export default observer(Navbar);
