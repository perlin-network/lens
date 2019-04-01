import * as React from "react";
import styled from "styled-components";

import "../index.scss";
import { Flex, Box } from "@rebass/grid";
import { Perlin } from "../Perlin";
import { observer } from "mobx-react-lite";
import { CopyIcon } from "./common/typography";
import { QRCodeWidget } from "./common/qr";
import { useWalletBalance } from "./wallet/WalletView";

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

const QRWrapper = styled.button`
    border: none;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    height: 50px;
    width: 50px;
    margin: 8px 0px 8px 0px;
    background-color: white;
    border-radius: 50%;

    & > * {
        margin-top: 6px;
        width: 65%;
        height: 65%;
    }

    &:focus {
        outline: none;
    }
    &:hover {
        opacity: 0.8;
    }
`;

const perlin = Perlin.getInstance();

const Navbar: React.SFC<{}> = observer(() => {
    const balance = useWalletBalance();
    const pubKey = perlin.publicKeyHex;

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
                    My Address
                    <div onClick={copyPubkeyToClipboard}>
                        <CopyIcon />
                        &nbsp;&nbsp;{pubKey}
                    </div>
                </Item>
                <Item>
                    My Balance
                    <span>{balance ? balance : "N/A"}&nbsp;PERLs</span>
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
