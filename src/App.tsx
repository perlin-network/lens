import { observer } from "mobx-react";
import * as React from "react";
import { Perlin } from "./Perlin";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";
import Navbar from "./components/Navbar";
import SideNav from "./components/SideNav";
import {
    Switch,
    Route,
    withRouter,
    RouteComponentProps,
    Redirect
} from "react-router";
import Dashboard from "./components/dashboard/DashboardContainer";
import Wallet from "./components/wallet/WalletContainer";
import Network from "./components/network/NetworkContainer";
import Validator from "./components/validator/ValidatorContainer";
import Contract from "./components/contract/ContractContainer";
import Settings from "./components/settings/SettingsContainer";

const ContentWrapper = styled(Flex)`
    margin: 1em 64px;
`;
const SideWrapper = styled(Box).attrs({
    width: 1 / 6
})`
    min-width: 150px;
`;
const Content = styled(Box).attrs({
    width: 5 / 6
})``;

const perlin = Perlin.getInstance();

const routes = [
    { path: "/", component: Dashboard },
    {
        path: "/wallet",
        component: Wallet
    },
    { path: "/network", component: Network },
    { path: "/validator", component: Validator },
    { path: "/contracts", component: Contract },
    { path: "/settings", component: Settings }
];

@observer
class App extends React.Component<RouteComponentProps, {}> {
    public render() {
        return (
            <>
                <ContentWrapper className="app-size">
                    <SideWrapper className="sidebar-background">
                        <SideNav />
                    </SideWrapper>
                    <Content className="main-background">
                        <Navbar />
                        <Switch>
                            {routes.map(route => (
                                <Route
                                    key={route.path}
                                    exact={true}
                                    path={route.path}
                                    component={route.component}
                                />
                            ))}
                            <Redirect to={{ pathname: "/" }} />
                        </Switch>
                    </Content>
                </ContentWrapper>
            </>
        );
    }
}

export default withRouter(App);
