import {
    Alignment,
    Button,
    Callout,
    Card,
    Code,
    H5,
    Intent,
    Pre,
    Tab,
    Tabs,
    Tag
} from "@blueprintjs/core";
import { observer } from "mobx-react";
import * as React from "react";
import { Perlin } from "./Perlin";
import logo from "./perlin-logo.svg";
import { Flex, Box } from "@rebass/grid";
import styled from "styled-components";
import Navbar from "./components/Navbar";

const Layout = styled(Flex)`
    margin-left: 2em;
    margin-right: 2em;
    > div {
        width: 100%;
    }
`;

const perlin = Perlin.getInstance();

@observer
class App extends React.Component<{}, {}> {
    public render() {
        return (
            <>
                <Navbar />
                <Layout flexDirection="column" alignItems="center" />
            </>
        );
    }
}

export default App;
