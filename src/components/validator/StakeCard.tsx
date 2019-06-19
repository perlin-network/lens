import * as React from "react";
import styled from "styled-components";
import { useState } from "react";
import {
    WhiteButton,
    RoundButton,
    ErrorMessage,
    LargeInput
} from "../common/core";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";

import { Box, Flex } from "@rebass/grid";

import { StakeActions } from "./ValidatorView";

interface IStakeCardProps {
    stake: number | null;
    action: StakeActions;
    setAction: (action: StakeActions) => void;
    onSubmit: (amount: number) => void;
    errorMessage: string;
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
    stake,
    action,
    setAction,
    onSubmit,
    errorMessage
}) => {
    const [amount, setAmount] = useState("");

    const handleWithdrawStakeClick = () => {
        if (action !== StakeActions.Withdraw) {
            setAction(StakeActions.Withdraw);
        } else {
            setAction(StakeActions.None);
        }
    };

    const handlePlaceStakeClick = () => {
        if (action !== StakeActions.Place) {
            setAction(StakeActions.Place);
        } else {
            setAction(StakeActions.None);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // if (/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:(\.|,)\d+)?$/i.test(value) || (value[value.length -1] === "." && (value.indexOf(".") === value.lastIndexOf("."))) ) {
        if (/^[a-z0-9\.\-\_]+$/i.test(value)) {
            setAmount("" + value);
        } else if (value === "") {
            setAmount("");
        }
    };

    const handleSubmit = () => {
        // todo: add validation
        onSubmit(parseInt(amount, 10));
    };

    return (
        <Card style={{ marginRight: "20px" }}>
            <CardHeader>
                <CardTitle>Your Stake</CardTitle>
            </CardHeader>
            <CardBody>
                <Row>
                    <Col width={1 / 2}>
                        <StakeAmount> {stake ? stake : "0"} </StakeAmount>
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
                                    value={amount}
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
                {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
            </CardBody>
        </Card>
    );
};

export { StakeCard };
