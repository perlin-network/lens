import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { Card } from "../common/layout";
import { InfoTitle, InfoText, InfoIcon } from "../common/typography";
import { Perlin } from "../../Perlin";

const LeftBlock = styled(Flex)``;
const InfoWrapper = styled(Box)`
    margin-right: 40px;
`;
const Divider = styled.hr`
    height: 70px;
    width: 0;
    margin: 0;
    border: 0;
    border-left: 1px solid #fff;
`;

const ValidatorView: React.SFC<{}> = () => {
    return (
        <Card>
            <LeftBlock justifyContent="space-around">
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
                        1000 PERLs
                    </InfoText>
                </InfoWrapper>
            </LeftBlock>
            <Divider />
        </Card>
    );
};

export default ValidatorView;
