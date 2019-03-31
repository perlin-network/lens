import * as React from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styled from "styled-components";
import DashboardIcon from "../assets/svg/navbar-dashboard.svg";
import NetworkIcon from "../assets/svg/navbar-network.svg";
import ValidatorIcon from "../assets/svg/navbar-validator.svg";
import DeveloperIcon from "../assets/svg/navbar-developer.svg";
import SettingsIcon from "../assets/svg/navbar-settings.svg";
import LogoutIcon from "../assets/svg/navbar-logout.svg";
import perlinLogo from "../assets/svg/perlin-logo.svg";

const NavIcon = styled.img<INavItemProps>`
    height: 16px;
    margin-right: 10px;
    opacity: 0.5;
    ${props =>
        props.active &&
        `{
            font-weight: bold;
            opacity: 1.0;

        }`}
`;
const NavItem = styled.div<INavItemProps>`
    font-family: HKGrotesk;
    font-size: 1em;
    display: flex;
    align-items: center;
    height: 36.5px;
    padding: 10px 20px;
    margin-bottom: 12px;
    cursor: pointer;
    position: relative;
    width: 135px;
    &:hover {
        font-weight: bold;
        color: white;
    }
    ${props =>
        props.active &&
        `{
            font-weight: bold;
            opacity: 1.0;

        }`}
`;

interface INavItemProps {
    active?: boolean;
}

interface INavItem {
    title: string;
    link?: string;
    icon: any;
}

const items: INavItem[] = [
    { title: "Dashboard", link: "/", icon: DashboardIcon },
    { title: "Network", link: "/network", icon: NetworkIcon },
    { title: "Validator", link: "/validator", icon: ValidatorIcon },
    { title: "Developer", link: "/contracts", icon: DeveloperIcon },
    { title: "Settings", link: "/settings", icon: SettingsIcon },
    { title: "Logout", link: "/logout", icon: LogoutIcon }
];

class SideNav extends React.Component<RouteComponentProps, {}> {
    public render() {
        const { pathname } = this.props.history.location;

        return (
            <>
                <img
                    src={perlinLogo}
                    style={{
                        maxWidth: "150px",
                        padding: "20px",
                        marginBottom: "2em"
                    }}
                />

                {items.map(item => (
                    <NavItem
                        key={item.title}
                        onClick={
                            item.link ? this.navigateTo(item.link) : undefined
                        }
                        active={pathname === item.link}
                    >
                        <NavIcon
                            src={item.icon}
                            active={pathname === item.link}
                        />
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
