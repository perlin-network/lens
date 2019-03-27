import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../common/typography";
import DashboardIcon from "../assets/svg/navbar-dashboard.svg";
import EarningsIcon from "../../assets/svg/datacard-earnings.svg";
import NetworkIcon from "../../assets/svg/datacard-network.svg";
import StakeIcon from "../../assets/svg/datacard-stake.svg";
import WalletIcon from "../../assets/svg/datacard-wallet.svg";
import { propTypes } from "mobx-react";

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
                    {this.getIcon}
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
    private getIcon = () => {
        if (this.props.heading === "Wallet Balance") {
            return <EarningsIcon />;
        }
        if (this.props.heading === "Network Load") {
            return <NetworkIcon />;
        }
        if (this.props.heading === "Your Earnings") {
            return <EarningsIcon />;
        }
        if (this.props.heading === "Your Stake") {
            return <StakeIcon />;
        } else {
            console.error("Unexpected heading retrieved");
            return;
        }
    };
}
