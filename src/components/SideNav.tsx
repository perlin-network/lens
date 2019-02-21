import * as React from "react";
import { Icon } from "@blueprintjs/core";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styled from "styled-components";
import DashboardIcon from "../assets/svg/Dashboard.svg";
import WalletIcon from "../assets/svg/Wallet.svg";
import NetworkIcon from "../assets/svg/Network.svg";
import ValidatorIcon from "../assets/svg/Validator.svg";
import ContractIcon from "../assets/svg/Contracts.svg";
import SettingsIcon from "../assets/svg/Settings.svg";

const NavIcon = styled.img`
    height: 16px;
    margin-right: 10px;
`;
const NavItem = styled.div`
    font-family: Montserrat;
    display: flex;
    align-items: center;
    height: 36.5px;
    padding: 10px 20px;
    margin-bottom: 12px;
    cursor: pointer;
`;

interface INavItem {
    title: string;
    link?: string;
    icon: any;
}

const items: INavItem[] = [
    { title: "Dashboard", link: "/", icon: DashboardIcon },
    { title: "Wallet", link: "/wallet", icon: WalletIcon },
    { title: "Network", link: "/network", icon: NetworkIcon },
    { title: "Validator", link: "/validator", icon: ValidatorIcon },
    { title: "Smart contract", link: "/contracts", icon: ContractIcon },
    { title: "Settings", icon: SettingsIcon }
];

class SideNav extends React.Component<RouteComponentProps, {}> {
    public render() {
        return (
            <>
                {items.map(item => (
                    <NavItem
                        key={item.title}
                        onClick={
                            item.link ? this.navigateTo(item.link) : undefined
                        }
                    >
                        <NavIcon src={item.icon} />
                        {item.title}
                    </NavItem>
                ))}
            </>
        );
    }
    private navigateTo = (link: string) => () => {
        this.props.history.push(link);
    };
}

export default withRouter(SideNav);
