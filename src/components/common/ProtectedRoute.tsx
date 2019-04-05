import * as React from "react";
import { Perlin } from "src/Perlin";
import { Redirect, Route, RouteProps } from "react-router";

const perlin = Perlin.getInstance();

const ProtectedRoute: React.FunctionComponent<RouteProps> = ({
    component: Component,
    ...rest
}: {
    component: React.ComponentType<RouteProps>;
}) => {
    const render = (props: any) =>
        perlin.isAuthenticated() === true ? (
            <Component {...props} />
        ) : (
            <Redirect to="/login" />
        );

    return <Route {...rest} render={render} />;
};
export default ProtectedRoute;
