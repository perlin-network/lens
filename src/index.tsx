import "normalize.css/normalize.css";
import "@blueprintjs/core/src/blueprint.scss";
import "react-table/react-table.css";
import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./App";
import { Perlin } from "./Perlin";
import registerServiceWorker from "./registerServiceWorker";
import { ThemeProvider } from "styled-components";
import { theme } from "./theme";
import { BrowserRouter as Router } from "react-router-dom";
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
registerServiceWorker();
