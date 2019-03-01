import * as React from "react";
import styled from "styled-components";
import { Box, Flex } from "@rebass/grid";
import { Card } from "../common/layout";
import { InfoIcon, InfoText, InfoTitle } from "../common/typography";
import { Perlin } from "../../Perlin";
import { observer, useComputed } from "mobx-react-lite";

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

const perlin = Perlin.getInstance();

const ValidatorView: React.SFC<{}> = observer(() => {
    const stake = useWalletStake();

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
                    <InfoText>
                        <InfoIcon />
                        {stake ? `${stake} PERLs` : "N/A"}
                    </InfoText>
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

const useWalletStake = () => {
    const balance = useComputed(() => {
        if (perlin.account !== undefined) {
            return perlin.account.stake;
        }

        return null;
    }, [perlin.ledger]);
    return balance;
};

export default ValidatorView;
