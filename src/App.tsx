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
    background-size: 100% auto;
    min-height: 100vh;
    background-repeat: no-repeat;
`;
const SideWrapper = styled(Box)`
    background-color: #0c112b;
    margin: 0px;
    padding: 0px;
    width: 160px;
`;
const Content = styled(Box).attrs({
    flex: 1
})`
    margin: 0px;
    padding-left: 25px;
    padding-right: 25px;
    max-width: 1340px;
    min-width: 900px;
    width: calc(100% - 160px);
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
        const isLoggedIn = perlin.isLoggedIn;
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
