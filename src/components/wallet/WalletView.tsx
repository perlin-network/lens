import * as React from "react";
import { Box } from "@rebass/grid";
import { Perlin } from "../../Perlin";
import { observer, useComputed } from "mobx-react-lite";
import SendPerlsForm from "./SendPerlsForm";

import { Card } from "../common/layout";
import { InfoTitle, InfoText, InfoIcon } from "../common/typography";

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
                <InfoTitle>Wallet Balance</InfoTitle>
                <InfoText>
                    <InfoIcon />
                    {balance ? balance : "N/A"}
                </InfoText>
            </Box>
            <Box>
                <SendPerlsForm onSubmit={handleSendPerls} />
            </Box>
        </Card>
    );
});

export const useWalletBalance = () => {
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
