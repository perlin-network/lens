import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { Card } from "../common/layout";
import { InfoTitle, InfoText, InfoIcon } from "../common/typography";
import { Perlin } from "../../Perlin";
import { observer } from "mobx-react-lite";
import AddStakeIcon from "../../assets/svg/add-stake-icon.svg";
import WithdrawStakeIcon from "../../assets/svg/withdraw-stake-icon.svg";

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

const ValidatorView: React.SFC<{}> = observer(() => {
    return (
        <Card>
            <LeftBlock>
                <InfoWrapper>
                    <InfoTitle>Your Earnings</InfoTitle>
                    <InfoText>
                        <InfoIcon />
                        1000 PERLs
                    </InfoText>
                </InfoWrapper>
                <InfoWrapper>
                    <InfoTitle>Your Stakes</InfoTitle>
                    <Flex alignItems="center">
                        <ButtonIcon src={AddStakeIcon} />
                        <StakeText>
                            <InfoIcon />
                            1000
                        </StakeText>
                        <ButtonIcon src={WithdrawStakeIcon} />
                    </Flex>
                </InfoWrapper>
            </LeftBlock>
            <Divider />
            <ConnectionWrapper>
                <InfoTitle>Connected As:</InfoTitle>
                <InfoText breakWord={true}>{perlin.ledger.public_key}</InfoText>
            </ConnectionWrapper>
        </Card>
    );
});

export default ValidatorView;
