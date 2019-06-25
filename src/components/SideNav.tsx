import * as React from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styled from "styled-components";
import DashboardIcon from "../assets/svg/navbar-dashboard.svg";
import DiscordIcon from "../assets/svg/discord-icon.svg";
import ValidatorIcon from "../assets/svg/navbar-validator.svg";
import DeveloperIcon from "../assets/svg/navbar-developer.svg";
import SettingsIcon from "../assets/svg/navbar-settings.svg";
import LogoutIcon from "../assets/svg/navbar-logout.svg";
import perlinLogo from "../assets/svg/perlin-logo.svg";
import { Perlin } from "../Perlin";
import { observer } from "mobx-react-lite";

const NavIcon = styled.img<INavItemProps>`
    max-width: 18px;
    max-height: 18px;
    margin-right: 10px;
    opacity: 0.5;
    position: relative;
    top: -2px;
    ${props =>
        props.active &&
        `{
            font-weight: bold;
            opacity: 1.0;

        }`}
`;
const NavItem = styled.a<INavItemProps>`
    font-family: HKGrotesk;
    font-size: 1em;
    display: flex;
    align-items: center;
    color: inherit !important;
    height: 36.5px;
    padding: 10px 30px;
    margin-bottom: 12px;
    cursor: pointer;
    position: relative;
    text-decoration: none;

    &:hover {
        font-weight: bold;
        color: inherit !important;
        text-decoration: none;
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
    external?: boolean;
}

const items: INavItem[] = [
    { title: "Dashboard", link: "/", icon: DashboardIcon },
    { title: "Developer", link: "/contracts", icon: DeveloperIcon },
    { title: "Validator", link: "/validator", icon: ValidatorIcon },
    { title: "Settings", link: "/settings", icon: SettingsIcon },
    {
        title: "Faucet",
        link: "https://discord.gg/dMYfDPM",
        icon: DiscordIcon,
        external: true
    }
];

const LogoWrapper = styled.img`
    max-width: 170px;
    padding: 30px;
    margin-bottom: 2em;
`;

const perlin = Perlin.getInstance();

const SideNav: React.FunctionComponent<RouteComponentProps> = props => {
    const { pathname } = props.history.location;
    const isLoggedIn = perlin.isLoggedIn;

    const navigateTo = (link: string) => () => {
        props.history.push(link);
    };
    const logout = () => () => {
        perlin.logout();
    };

    const login = () => () => {
        props.history.push("/login");
    };

    return (
        <>
            <LogoWrapper src={perlinLogo} />
            {isLoggedIn && (
                <>
                    {items.map(item => (
                        <NavItem
                            key={item.title}
                            onClick={
                                !external && item.link
                                    ? navigateTo(item.link)
                                    : undefined
                            }
                            active={pathname === item.link}
                            href={external ? item.link : ""}
                            target="_blank"
                        >
                            <NavIcon
                                src={item.icon}
                                active={pathname === item.link}
                            />
                            {item.title}
                        </NavItem>
                    ))}
                    <NavItem onClick={logout()}>
                        <NavIcon src={LogoutIcon} />
                        Logout
                    </NavItem>
                </>
            )}
        </>
    );
};

export default withRouter(observer(SideNav));
