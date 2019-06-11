import { observer } from "mobx-react";
import * as React from "react";
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
import Login from "./components/login/LoginContainer";
import MainBackgroundSVG from "./assets/svg/main-background.svg";
import TransactionDetail from "./components/transactions/TransactionDetail";
import { Perlin } from "./Perlin";

const ContentWrapper = styled(Flex)`
    margin: 0px;
    padding: 0px;
    background-color: #0c112b;
    min-height: 100vh;
`;
const SideWrapper = styled(Box).attrs({
    width: 1 / 6
})`
    background-color: #0c112b;
    margin: 0px;
    padding: 0px;
    min-width: 150px;
    max-width: 250px;
`;
const Content = styled(Box).attrs({
    width: 5 / 6
})`
    background-image: url(${MainBackgroundSVG});
    margin: 0px;
    padding-left: 2em;
    padding-right: 2em;
    background-size: 100% 1500px;
    background-repeat: no-repeat;
`;

const routes = [
    { path: "/", component: Dashboard, restriction: true },
    { path: "/network", component: Network, restriction: true },
    { path: "/validator", component: Validator, restriction: true },
    { path: "/contracts", component: Contract, restriction: true },
    { path: "/settings", component: Settings, restriction: false },
    {
        path: "/transactions/:id",
        component: TransactionDetail,
        restriction: true
    },
    { path: "/login", component: Login, restriction: false }
];

const perlin = Perlin.getInstance();

@observer
class App extends React.Component<RouteComponentProps, {}> {
    public render() {
        const isLoggedIn = perlin.isLogged;
        return (
            <>
                <ContentWrapper>
                    <SideWrapper>
                        <SideNav />
                    </SideWrapper>
                    <Content>
                        <Navbar />
                        <Switch>
                            {routes.map(
                                route =>
                                    (route.restriction === isLoggedIn ||
                                        !route.restriction) && (
                                        <Route
                                            key={route.path}
                                            exact={true}
                                            path={route.path}
                                            component={route.component}
                                        />
                                    )
                            )}
                            <Redirect to={{ pathname: "/login" }} />
                        </Switch>
                    </Content>
                </ContentWrapper>
            </>
        );
    }
}

export default withRouter(App);
