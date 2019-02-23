import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { Perlin } from "../../Perlin";
import { observer, useComputed } from "mobx-react-lite";
import SendPerlsForm from "./SendPerlsForm";

const Text = styled.p`
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

const Wrapper = styled(Flex)`
    background-color: #0e1a49;
    border-radius: 2px;
    width: 100%;
    padding: 15px 20px;
    min-height: 100px;
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
        <Wrapper justifyContent="space-between">
            <Box>
                <Title>Wallet Balance</Title>
                <Text>{balance ? balance : "N/A"}</Text>
            </Box>
            <Box>
                <SendPerlsForm onSubmit={handleSendPerls} />
            </Box>
        </Wrapper>
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
