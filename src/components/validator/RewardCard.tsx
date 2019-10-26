import React, { useCallback, useState } from "react";
import { ErrorMessage, Input, RoundButton, LargeInput } from "../common/core";
import { Box, Flex } from "@rebass/grid";
import { WhiteButton, formatBalance } from "../common/core";
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
    font-size: 30px;
    font-weight: 400;
    color: #fff;
    margin-top: 0px;
    margin-bottom: 0px;
`;

interface IRewardCardProps {
    reward: number;
    onSubmit: (amount: number) => Promise<boolean>;
}
const RewardCard: React.FunctionComponent<IRewardCardProps> = ({
    reward,
    onSubmit
}) => {
    const [amount, setAmount] = useState();
    const [showAmountBox, setShowAmountBox] = useState(false);
    const handleOnClick = useCallback(async () => {
        if (await onSubmit(amount)) {
            setShowAmountBox(false);
        }
    }, [amount]);

    const handleShowAmountBox = useCallback(() => {
        setAmount(reward);
        setShowAmountBox(!showAmountBox);
    }, [showAmountBox, reward]);

    const handleAmountChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputPerls = e.target.value;
            const kens =
                Math.floor(parseFloat(inputPerls) * Math.pow(10, 9)) + "";
            setAmount(parseInt(kens, 10));
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
                    <Col flex="1" mt={2}>
                        <RewardAmount>{formatBalance(reward)}</RewardAmount>
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
                                    onChange={handleAmountChange}
                                    defaultValue={(
                                        reward / Math.pow(10, 9)
                                    ).toFixed(9)}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col width={1}>
                                <WhiteButton onClick={handleOnClick}>
                                    Withdraw {formatBalance(amount)}
                                </WhiteButton>
                            </Col>
                        </Row>
                    </div>
                )}
            </CardBody>
        </Wrapper>
    );
};

export default RewardCard;
