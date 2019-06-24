import React, { useCallback } from "react";
import styled from "styled-components";
import { useState } from "react";
import {
    WhiteButton,
    RoundButton,
    ErrorMessage,
    LargeInput,
    numberWithCommas
} from "../common/core";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";

import { Box, Flex } from "@rebass/grid";

import { StakeActions } from "./ValidatorView";

interface IStakeCardProps {
    stake?: number;
    action: StakeActions;
    setAction: (action: StakeActions) => void;
    onSubmit: (amount: number) => void;
}

const Row = styled(Flex)`
    padding-top: 10px;
    padding-bottom: 10px;
`;

const Col = styled(Box)`
    font-weight: 500;
`;

const StakeAmount = styled.h2`
    font-size: 36px;
    font-weight: 400;
    color: #fff;
    margin-top: 0px;
    margin-bottom: 0px;
`;

const StakeCard: React.FunctionComponent<IStakeCardProps> = ({
    stake = 0,
    action,
    setAction,
    onSubmit
}) => {
    const [amount, setAmount] = useState();

    const handleWithdrawStakeClick = useCallback(() => {
        if (action !== StakeActions.Withdraw) {
            setAction(StakeActions.Withdraw);
        } else {
            setAction(StakeActions.None);
        }
    }, [action]);

    const handlePlaceStakeClick = useCallback(() => {
        if (action !== StakeActions.Place) {
            setAction(StakeActions.Place);
        } else {
            setAction(StakeActions.None);
        }
    }, [action]);

    const handleAmountChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setAmount(parseInt(value, 10));
        },
        []
    );

    const handleSubmit = useCallback(() => {
        // todo: add validation
        onSubmit(amount);
    }, [amount]);

    return (
        <Card style={{ marginRight: "20px" }}>
            <CardHeader>
                <CardTitle>Your Stake</CardTitle>
            </CardHeader>
            <CardBody>
                <Row>
                    <Col width={1 / 2}>
                        <StakeAmount> {numberWithCommas(stake)} </StakeAmount>
                        PERLs
                    </Col>
                    <Col width={1 / 2} style={{ textAlign: "right" }}>
                        <RoundButton
                            onClick={handleWithdrawStakeClick}
                            inactive={action === StakeActions.Withdraw}
                        >
                            -
                        </RoundButton>
                        <RoundButton
                            onClick={handlePlaceStakeClick}
                            inactive={action === StakeActions.Place}
                        >
                            +
                        </RoundButton>
                    </Col>
                </Row>
                {action !== StakeActions.None && (
                    <div>
                        <Row>
                            <Col width={1}>
                                <LargeInput
                                    placeholder="Enter Amount"
                                    defaultValue={amount}
                                    onChange={handleAmountChange}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col width={1}>
                                <WhiteButton onClick={handleSubmit}>
                                    {action}
                                </WhiteButton>
                            </Col>
                        </Row>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export { StakeCard };
