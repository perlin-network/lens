import * as React from "react";
import styled from "styled-components";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";

import { Box, Flex } from "@rebass/grid";

import { StakeActions } from "./ValidatorView";

interface IStakeProps {
    stake: number | null;
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

const Input = styled.input`
    border: none;
    outline: none;
    width: 100%;
    color: #fff;
    background-color: #171d39;
    border-radius: 5px;
    border: 1px solid #2e345100;
    padding: 20px;
    font-size: 16px;
    font-family: HKGrotesk;
`;

const Button = styled.button`
    width: 100%;
    background-color: #fff;
    cursor: pointer;
    text-align: center;
    font-weight: 600;
    border: none;
    padding: 20px;
    text-decoration: none;
    display: inline-block;
    color: #151b35;
    transparenfont-size: 16px;
`;

interface IButtonProps {
    inactive?: boolean;
}

const RoundButton = styled.button`
    border: none;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 42px;
    cursor: pointer;
    height: 48px;
    width: 48px;
    margin: 4px 4px;
    background-color: #171d39;
    border-radius: 50%;
    color: ${(props: IButtonProps) => (props.inactive ? "#5D6175" : "#FFFFFF")};
    &:focus {
        outline: none;
    }
`;

const StakeAmount = styled.h2`
    font-size: 36px;
    font-weight: 400;
    color: #fff;
    margin-top: 0px;
    margin-bottom: 0px;
`;

const StakeCard: React.SFC<IStakeProps> = ({
    stake,
    action,
    setAction,
    onSubmit
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
                <StakeAmount> {stake ? stake : "N/A"} </StakeAmount>
                <Row>
                    <Col width={1 / 2}>PERLs</Col>
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
                                <Input
                                    placeholder="Enter Amount"
                                    value={amount}
                                    onChange={handleAmountChange}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col width={1}>
                                <Button onClick={handleSubmit}>{action}</Button>
                            </Col>
                        </Row>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export { StakeCard };
