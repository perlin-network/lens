import React, { useCallback, useState } from "react";

import styled from "styled-components";
import { Box, Flex } from "@rebass/grid";

import { Perlin } from "../../Perlin";
import { observer, useComputed } from "mobx-react-lite";
import { ValidatorChart } from "./ValidatorChart";
import { SectionTitle } from "../common/typography";

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

const ValidatorView: React.FunctionComponent<{}> = () => {
    const stake = useWalletStake();
    const reward = perlin.account.reward;

    const [action, setAction] = useState(StakeActions.None);
    const [stakeErrorMessage, setStakeErrorMessage] = useState("");
    const [rewardErrorMessage, setTewardErrorMessage] = useState("");

    const handlePlaceStake = async (amount: number) => {
        setStakeErrorMessage("");
        setAction(StakeActions.None);
        if (!isNaN(amount)) {
            const results = await perlin.placeStake(amount);
            if (results.error) {
                setStakeErrorMessage(`${results.error}`);
            }
        }
        // display error message
    };
    const handleWithdrawStake = async (amount: number) => {
        setStakeErrorMessage("");
        setAction(StakeActions.None);
        if (!isNaN(amount)) {
            const results = await perlin.withdrawStake(amount);
            if (results.error) {
                setStakeErrorMessage(`${results.error}`);
            }
        }
        // display error message
    };

    const handleWithdrawReward = useCallback(async (amount: number) => {
        setTewardErrorMessage("");
        if (!isNaN(amount)) {
            const results = await perlin.withdrawReward(amount);
            if (results.error) {
                setTewardErrorMessage(`${results.error}`);
            }
        }
    }, []);

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
                    onSubmit={
                        action === StakeActions.Place
                            ? handlePlaceStake
                            : handleWithdrawStake
                    }
                    errorMessage={stakeErrorMessage}
                />
            </Box>
            <Box width={6 / 12}>
                <RewardCard
                    reward={reward}
                    onSubmit={handleWithdrawReward}
                    errorMessage={rewardErrorMessage}
                />
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

        return null;
    }, [perlin.ledger]);
    return stake;
};

export default observer(ValidatorView);
