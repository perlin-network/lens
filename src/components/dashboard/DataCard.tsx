import React, { useState, useEffect, useRef, memo } from "react";
import styled from "styled-components";
import {
    WalletIcon,
    StakeIcon,
    NetworkIcon,
    EarningsIcon
} from "../common/typography";
import DeltaTag from "../common/deltaTag";
import { Flex } from "@rebass/grid";

interface IProps {
    heading: string;
    value: string;
    unit: string;
}

const CardSection = styled.div`
    border: 1px solid #34374a;
    word-wrap: break-word;
    margin: 0px;
    font-size: 12px;
    border-radius: 5px;

    ${EarningsIcon} {
        position: relative;
        top: 3px;
    }
`;
const CardHeading = styled(Flex)`
    border-bottom: 1px solid #34374a;
    padding: 15px 20px;
    height: 60px;
    align-items: center;
`;
const Value = styled.span`
    display: block;
    font-size: 36px;
    font-weight: 400;
    border-top: 0px solid white;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

function GetIcon(heading: string) {
    switch (heading) {
        case "Wallet Balance":
            return <WalletIcon style={{ marginRight: "10px" }} />;
        case "Network Load":
            return <NetworkIcon style={{ marginRight: "10px" }} />;
        case "Your Reward":
            return <EarningsIcon style={{ marginRight: "10px" }} />;
        case "Your Stake":
            return <StakeIcon style={{ marginRight: "10px" }} />;
        default:
            return null;
    }
}

const DataCard: React.FunctionComponent<IProps> = ({
    heading,
    value,
    unit
}) => {
    return (
        <CardSection>
            <CardHeading justifyContent="space-between">
                <div>
                    {GetIcon(heading)}
                    {heading}
                </div>
                <DeltaTag value={value} />
            </CardHeading>
            <div style={{ padding: "20px" }}>
                <Value title={value}>{value}</Value>
                <br />
                {unit}
            </div>
        </CardSection>
    );
};

export default memo(DataCard);
