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
import MainBackgroundSVG from "./assets/svg/main-background.svg";

const ContentWrapper = styled(Flex)`
    margin: 0px;
    padding: 0px;
    background-color: #0c112b;
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
`;

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
                <ContentWrapper>
                    <SideWrapper>
                        <SideNav />
                    </SideWrapper>
                    <Content>
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
