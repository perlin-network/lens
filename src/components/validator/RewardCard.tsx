import React, { useCallback, useState } from "react";
import { ErrorMessage, Input, RoundButton, LargeInput } from "../common/core";
import { Box, Flex } from "@rebass/grid";
import { LargeWhiteButton, formatBalance } from "../common/core";
import styled from "styled-components";
import { Card, CardHeader, CardTitle, CardBody } from "../common/card";
import BigNumber from "bignumber.js";

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
            const inputPerls = e.target.value.replace(/\,/g, "") || "0";
            const kens = new BigNumber(inputPerls)
                .times(Math.pow(10,9))
                .toString(10)
                .replace(/\..*/, "");
            setAmount(kens);
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
                                <LargeWhiteButton onClick={handleOnClick}>
                                    Withdraw {formatBalance(amount)}
                                </LargeWhiteButton>
                            </Col>
                        </Row>
                    </div>
                )}
            </CardBody>
        </Wrapper>
    );
};

export default RewardCard;
