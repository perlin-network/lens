import React, { useCallback, useState } from "react";
import { ErrorMessage, Input, RoundButton, LargeInput } from "../common/core";
import { Box, Flex } from "@rebass/grid";
import { WhiteButton } from "../common/core";
import styled from "styled-components";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";

const Row = styled(Flex)`
    padding-top: 10px;
    padding-bottom: 10px;
`;

const Col = styled(Box)`
    font-weight: 500;
`;

const Wrapper = styled(Card)``;
const RewardAmount = styled.h2`
    font-size: 36px;
    font-weight: 400;
    color: #fff;
    margin-top: 0px;
    margin-bottom: 0px;
`;

interface IRewardCardProps {
    reward: number;
    onSubmit: (amount: number) => void;
    errorMessage: string;
}
const RewardCard: React.FunctionComponent<IRewardCardProps> = ({
    reward,
    onSubmit,
    errorMessage
}) => {
    const [amount, setAmount] = useState();
    const [showAmountBox, setShowAmountBox] = useState(false);
    const handleOnClick = useCallback(() => {
        onSubmit(amount);
        setShowAmountBox(false);
    }, [amount]);

    const handleShowAmountBox = useCallback(() => {
        setAmount(reward);
        setShowAmountBox(!showAmountBox);
    }, [showAmountBox, reward]);

    const handleAmountChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            // if (/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:(\.|,)\d+)?$/i.test(value) || (value[value.length -1] === "." && (value.indexOf(".") === value.lastIndexOf("."))) ) {
            if (/^[a-z0-9\.\-\_]+$/i.test(value)) {
                setAmount(parseInt(value, 10));
            } else if (value === "") {
                setAmount(0);
            }
        },
        []
    );
    return (
        <Wrapper>
            <CardHeader>
                <CardTitle>Your Available Rewards</CardTitle>
            </CardHeader>
            <CardBody>
                <Row>
                    <Col width={1 / 2}>
                        <RewardAmount>{reward || 0}</RewardAmount>
                        PERLs
                    </Col>
                    <Col width={1 / 2} style={{ textAlign: "right" }}>
                        <RoundButton
                            onClick={handleShowAmountBox}
                            inactive={showAmountBox}
                        >
                            -
                        </RoundButton>
                    </Col>
                </Row>
                {showAmountBox && (
                    <div>
                        <Row>
                            <Col width={1}>
                                <LargeInput
                                    placeholder="Enter Amount"
                                    defaultValue={reward + ""}
                                    onChange={handleAmountChange}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col width={1}>
                                <WhiteButton onClick={handleOnClick}>
                                    Withdraw
                                </WhiteButton>
                            </Col>
                        </Row>
                    </div>
                )}
                {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
            </CardBody>
        </Wrapper>
    );
};

export default RewardCard;
