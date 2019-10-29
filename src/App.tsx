import { observer } from "mobx-react";
import * as React from "react";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";
import Navbar from "./components/Navbar";
import SideNav from "./components/SideNav";
import Notification from "./components/common/notification/Notification";
import {
    Switch,
    Route,
    withRouter,
    RouteComponentProps,
    Redirect
} from "react-router";
import Dashboard from "./components/dashboard/DashboardContainer";
import Validator from "./components/validator/ValidatorContainer";
import Contract from "./components/contract/ContractContainer";
import Settings from "./components/settings/SettingsContainer";
import Login from "./components/login/LoginContainer";
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
    margin: 0px;
    padding: 0px;
    width: 170px;
    ${({ isLoggedIn }: { isLoggedIn: boolean }) =>
        isLoggedIn ? "background-color: #0c112b;" : ""}
`;
const Content = styled(Box).attrs({
    flex: 1
})`
    margin: 0px;
    padding-left: 25px;
    padding-right: 25px;
    min-width: 900px;
    width: calc(100% - 170px);
    max-width: 1340px;
    ${({ isLoggedIn }: { isLoggedIn: boolean }) =>
        isLoggedIn ? "" : "margin: 0 auto;"}
`;

const routes = [
    { path: "/", component: Dashboard, restriction: true },
    { path: "/validator", component: Validator, restriction: true },
    { path: "/contracts/:id?", component: Contract, restriction: true },
    { path: "/settings", component: Settings, restriction: true },
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
                    <SideWrapper isLoggedIn={isLoggedIn}>
                        <SideNav />
                    </SideWrapper>
                    <Content isLoggedIn={isLoggedIn}>
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
                <Notification />
            </>
        );
    }
}

export default withRouter(App);
