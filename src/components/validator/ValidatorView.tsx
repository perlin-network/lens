import React, { useCallback, useState } from "react";

import styled from "styled-components";
import { Box, Flex } from "@rebass/grid";

import { Perlin, NotificationTypes } from "../../Perlin";
import { observer, useComputed } from "mobx-react-lite";
import { ValidatorChart } from "./ValidatorChart";
import { SectionTitle } from "../common/typography";
import { Link } from "react-router-dom";

import { StakeCard } from "./StakeCard";
import RewardCard from "./RewardCard";

const perlin = Perlin.getInstance();

export enum StakeActions {
    Place = "Place",
    Withdraw = "Withdraw",
    None = ""
}

const ChartWrapper = styled.div`
    border: 0;
    word-wrap: break-word;
    margin: 0px;
    background-color: #151b35;
    border-radius: 5px;
    margin-right: 20px;
    font-family: HKGrotesk;
    padding: 20px;
`;

const ChartHeader = styled.div`
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 10px;
`;

const ChartSubtitle = styled.span`
    display: block;
    margin-top: 5px;
    color: #717985;
    font-size: 14px;
    font-weight: 500;
`;

const errorNotification = (message: string) => {
    perlin.notify({
        type: NotificationTypes.Danger,
        message
    });
};

const successNotification = (title: string, txId: string) => {
    perlin.notify({
        title,
        type: NotificationTypes.Success,
        // message: "You can view your transactions details here"
        content: (
            <p>
                You can view your transaction
                <Link to={"/transactions/" + txId} title={txId} target="_blank">
                    here
                </Link>
            </p>
        ),
        dismiss: { duration: 10000 }
    });
};

const ValidatorView: React.FunctionComponent<{}> = () => {
    const stake = useWalletStake();
    const reward = perlin.account.reward;

    const [action, setAction] = useState(StakeActions.None);
    const handlePlaceStake = useCallback(async (amount: number) => {
        if (
            amount <= 0 ||
            isNaN(amount) ||
            amount > parseInt(perlin.account.balance, 10)
        ) {
            errorNotification("You have entered and invalid amount");
        } else {
            const results = await perlin.placeStake(amount);
            if (results.error) {
                errorNotification(results.error);
            } else {
                setAction(StakeActions.None);
                successNotification("Stake Placed", results.tx_id);
            }
        }
    }, []);
    const handleWithdrawStake = useCallback(
        async (amount: number) => {
            if (amount <= 0 || isNaN(amount) || amount > stake) {
                errorNotification("You have entered and invalid amount");
            } else {
                const results = await perlin.withdrawStake(amount);
                if (results.error) {
                    errorNotification(results.error);
                } else {
                    setAction(StakeActions.None);
                    successNotification("Stake Withdrawn", results.tx_id);
                }
            }
        },
        [stake]
    );

    const handleWithdrawReward = useCallback(
        async (amount: number) => {
            if (amount <= 0 || isNaN(amount) || amount > reward) {
                errorNotification("You have entered and invalid amount");
                return false;
            } else {
                const results = await perlin.withdrawReward(amount);
                if (results.error) {
                    errorNotification(results.error);
                    return false;
                } else {
                    successNotification("Reward Withdrawn", results.tx_id);
                    return true;
                }
            }
        },
        [reward]
    );

    return (
        <Flex>
            {/*
            <Box width={7 / 12}>
                <ChartWrapper>
                    <ChartHeader>
                        Validator Performance
                        <ChartSubtitle>Transactions Per Second</ChartSubtitle>
                    </ChartHeader>
                    <ValidatorChart csv={getSampleData()} />
                </ChartWrapper>
            </Box>
            <Box width={5 / 12}>
                <StakeCard
                    stake={stake}
                    setAction={setAction}
                    action={action}
                    onSubmit={
                        action === StakeActions.Place
                            ? handlePlaceStake
                            : handleWithdrawStake
                    }
                />
            </Box>
            */}
            <Box width={6 / 12}>
                <StakeCard
                    stake={stake}
                    setAction={setAction}
                    action={action}
                    onPlace={handlePlaceStake}
                    onWithdraw={handleWithdrawStake}
                />
            </Box>
            <Box width={6 / 12}>
                <RewardCard reward={reward} onSubmit={handleWithdrawReward} />
            </Box>
        </Flex>
    );
};

const getSampleData = (): string => {
    return `date,temperature
    201901,0
    201902,0
    201903,0
    201904,0
    201905,0
    201906,0
    201907,0
    201908,0
    201909,0
    201910,0
    201911,0
    201912,-10`;
};

const useWalletStake = () => {
    const stake = useComputed(() => {
        if (perlin.account !== undefined) {
            return perlin.account.stake;
        }

        return 0;
    }, [perlin.ledger]);
    return stake;
};

export default observer(ValidatorView);
