import * as React from "react";
import styled from "styled-components";
import { Box } from "@rebass/grid";
import { Perlin } from "../../Perlin";
import { observer, useComputed } from "mobx-react-lite";
import SendPerlsForm from "./SendPerlsForm";
import PerlMiniIcon from "../../assets/svg/perl-mini-icon.svg";
import { Card } from "../common/layout";

const Text = styled.p`
    display: flex;
    align-items: center;
    font-family: HKGrotesk;
    font-size: 18px;
    color: #fff;
`;
const Title = styled.h2`
    font-family: HKGrotesk;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
`;
const Icon = styled.img.attrs({ src: PerlMiniIcon })`
    height: 20px;
    width: 20px;
    margin-right: 5px;
`;

const perlin = Perlin.getInstance();
const handleSendPerls = async (recipient: string, amount: number) => {
    try {
        await perlin.transfer(recipient, amount);
    } catch (err) {
        console.log(err);
    }
};

const WalletView: React.SFC<{}> = observer(() => {
    const balance = useWalletBalance();

    return (
        <Card justifyContent="space-between">
            <Box>
                <Title>Wallet Balance</Title>
                <Text>
                    <Icon />
                    {balance ? balance : "N/A"}
                </Text>
            </Box>
            <Box>
                <SendPerlsForm onSubmit={handleSendPerls} />
            </Box>
        </Card>
    );
});

const useWalletBalance = () => {
    const balance = useComputed(() => {
        const account = perlin.ledger.state[perlin.ledger.public_key];
        if (account !== undefined) {
            return account.State.balance;
        }
        return null;
    }, [perlin.ledger]);
    return balance;
};

export default WalletView;
