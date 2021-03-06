import "normalize.css/normalize.css";
import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./App";
import { Perlin } from "./Perlin";
import * as serviceWorker from './serviceWorker';
import { ThemeProvider } from "styled-components";
import { theme } from "./theme";
import { HashRouter as Router } from "react-router-dom";
import "./index.scss";

Perlin.getInstance(); // Initialize Perlin Instance

ReactDOM.render(
    <ThemeProvider theme={theme}>
        <Router>
            <>
                <App />
            </>
        </Router>
    </ThemeProvider>,
    document.getElementById("root") as HTMLElement
);
serviceWorker.unregister();
