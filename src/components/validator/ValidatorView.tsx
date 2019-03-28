import * as React from "react";
import { useState } from "react";
import styled from "styled-components";
import { Box, Flex } from "@rebass/grid";
import { Card } from "../common/core";
import { InfoIcon, InfoText, InfoTitle } from "../common/typography";
import { Perlin } from "../../Perlin";
import { observer, useComputed } from "mobx-react-lite";
import PlaceStakeIcon from "../../assets/svg/place-stake-icon.svg";
import WithdrawStakeIcon from "../../assets/svg/withdraw-stake-icon.svg";
import StakeModal, { StakeModalActions } from "./StakeModal";

import { useWalletBalance } from "../wallet/WalletView";

import { SectionTitle } from "../common/typography";
import { StakeCard } from "./StakeCard";

const LeftBlock = styled(Flex)``;
const ConnectionWrapper = styled(Box)`
    margin-left: 40px;
`;
const InfoWrapper = styled(Box)`
    margin-right: 40px;
`;
const Divider = styled.hr`
    height: inherit;
    width: 0;
    margin: 0;
    border: 0;
    border-left: 1px solid #fff;
`;
const StakeText = styled.p`
    margin: 0 15px;
    display: flex;
    align-items: center;
    font-size: 18px;
    font-family: HKGrotesk;
`;
const ButtonIcon = styled.img`
    height: 24px;
    width: 24px;
    cursor: pointer;
`;

const perlin = Perlin.getInstance();

export enum StakeActions {
    Place = "Place",
    Withdraw = "Withdraw",
    None = ""
}

const ValidatorView: React.SFC<{}> = observer(() => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(StakeModalActions.Place);
    const balance = useWalletBalance();

    const handlePlaceStakeClick = () => {
        setModalOpen(true);
        setModalAction(StakeModalActions.Place);
    };
    const handleWithdrawStakeClick = () => {
        setModalAction(StakeModalActions.Withdraw);
        setModalOpen(true);
    };
    const handleClose = () => {
        setModalOpen(false);
    };

    const stake = useWalletStake();

    const [action, setAction] = useState(StakeActions.None);

    const handlePlaceStake = async (amount: number) => {
        if (!isNaN(amount)) {
            try {
                await perlin.placeStake(amount);
                // setModalOpen(false);
            } catch (err) {
                console.log(err);
            }
        }
        // display error message
    };
    const handleWithdrawStake = async (amount: number) => {
        if (!isNaN(amount)) {
            try {
                await perlin.withdrawStake(amount);
                // setModalOpen(false);
            } catch (err) {
                console.log(err);
            }
        }
        // display error message
    };

    return (
        <Flex>
            <Box width={7 / 12}>
                <SectionTitle>Chart here...</SectionTitle>
            </Box>
            <Box width={5 / 12}>
                <StakeCard
                    stake={stake}
                    balance={balance}
                    setAction={setAction}
                    action={action}
                    onSubmit={
                        action === StakeActions.Place
                            ? handlePlaceStake
                            : handleWithdrawStake
                    }
                />
            </Box>
        </Flex>
    );
});

const useWalletStake = () => {
    const stake = useComputed(() => {
        if (perlin.account !== undefined) {
            return perlin.account.stake;
        }

        return null;
    }, [perlin.ledger]);
    return stake;
};

export default ValidatorView;
