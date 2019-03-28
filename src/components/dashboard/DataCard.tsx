import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../common/typography";
import { propTypes } from "mobx-react";
import {
    WalletIcon,
    StakeIcon,
    NetworkIcon,
    EarningsIcon
} from "../common/typography";

interface IProps {
    heading: string;
    value: string;
    unit: string;
}

const CardSection = styled.div`
    border: 1px solid #ffffff22;
    word-wrap: break-word;
    margin: 0px;
    font-size: 12px;
    border-radius: 5px;
    margin-right: "20px";
`;

function GetIcon(heading: string) {
    switch (heading) {
        case "Wallet Balance":
            return <WalletIcon style={{ marginRight: "10px" }} />;
        case "Network Load":
            return <NetworkIcon style={{ marginRight: "10px" }} />;
        case "Your Earnings":
            return <EarningsIcon style={{ marginRight: "10px" }} />;
        case "Your Stake":
            return <StakeIcon style={{ marginRight: "10px" }} />;
        default:
            return null;
    }
}

export default class DataCard extends React.Component<IProps, {}> {
    constructor(props: IProps) {
        super(props);
    }
    public render() {
        return (
            <CardSection>
                <div
                    style={{
                        borderBottom: "1px solid #ffffff22",
                        padding: "20px"
                    }}
                >
                    {GetIcon(this.props.heading)}
                    {this.props.heading}
                </div>
                <div style={{ padding: "20px" }}>
                    <span
                        style={{
                            fontSize: "36px",
                            fontWeight: 600,
                            borderTop: "0px solid white"
                        }}
                    >
                        {this.props.value}
                    </span>
                    <br />
                    {this.props.unit}
                </div>
            </CardSection>
        );
    }
}
