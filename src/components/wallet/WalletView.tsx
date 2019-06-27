import * as React from "react";
import { Box } from "@rebass/grid";
import { Perlin } from "../../Perlin";
import { observer, useComputed } from "mobx-react-lite";
import PaymentForm from "./PaymentForm";

import { Card } from "../common/core";
import { InfoIcon, InfoText, InfoTitle } from "../common/typography";

const perlin = Perlin.getInstance();

const handleTransfer = async (recipient: string, amount: number) => {
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
                <PaymentForm onSubmit={handleTransfer} />
            </Box>
        </Card>
    );
});

export const useWalletBalance = () => {
    const balance = useComputed(() => {
        if (perlin.account !== undefined) {
            return perlin.account.balance;
        }

        return null;
    }, [perlin.ledger]);
    return balance;
};

export default WalletView;
