import * as React from "react";
import { Icon } from "@blueprintjs/core";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styled from "styled-components";

const NavIcon = styled(Icon)`
    height: 16px;
    margin-right: 10px;
`;
const NavItem = styled.div`
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
}

const items: INavItem[] = [
    { title: "Dashboard", link: "/" },
    { title: "Wallet", link: "/wallet" },
    { title: "Network", link: "/network" },
    { title: "Validator", link: "/validator" },
    { title: "Smart contract", link: "/contracts" },
    { title: "Settings" }
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
                        <NavIcon icon="clipboard" />
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
