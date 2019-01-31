import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
    html {
        background-color: #060b24;
    }

    .tag-list {
        justify-self: right;
        width: auto;
    }

    .tag-list > *:not(:first-child) {
        margin-left: 0.75em;
    }

    .justify-between {
        justify-content: space-between;
    }

    .ReactTable .-pagination .-btn {
        color: #F5F8FA; // $pt-dark-text-color
    }

    .ReactTable .rt-expander:after {
        border-top: 7px solid #F5F8FA; // $pt-dark-text-color
    }

    .text-center {
        text-align: center;
    }

    canvas,
    svg {
        border-radius: 3px;
        box-shadow: inset 0 0 0 1px rgba(16, 22, 26, 0.4);
        background: #13162e;
        color: #f5f8fa;
    }

    .bp3-icon {
        background: transparent !important;
        box-shadow: inherit !important;
        color: white !important;
    }

    .bp3-dark .bp3-code-block {
        background-color: #13162e;
    }

    .link {
        stroke: #777;
        stroke-opacity: 0.3;
        stroke-width: 1.5px;
    }

    .node circle {
        fill: #ccc;
        stroke: #000;
        stroke-width: 1.5px;
    }

    .node text {
        display: none;
        font: 10px monospace;
        fill: white;
    }

    .node:hover circle {
        fill: #000;
    }

    .node:hover text {
        display: inline;
    }

    .cardStyle {
        background-color: #1f2137 !important;
        border-radius: 1em;
    }

    .statuses {
        display: flex;
        flex-direction: row;
        width: calc(100%);
    }

    .statuses > *:not(:last-child) {
        margin-right: 1em;
    }

    .status-border {
        flex: 1;
        display: flex;
        border-radius: 1em;
        background: linear-gradient(
            135deg,
            rgb(255, 165, 165) 0%,
            rgb(255, 149, 149) 10%,
            rgb(160, 120, 255) 45%,
            rgb(116, 255, 228) 100%
        );
        padding: 8px 3px 3px 4px;
    }

    .status-container {
        flex: 1;
        display: flex;
        border-radius: calc(1em - 5px);
        background: #060b24;
        margin-left: -0.175em;
    }

    .status {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 1em;
    }

    .status-container > div {
        background-color: #060b24 !important;
    }`;

const theme = {
    breakpoint: {
        xs: "400px",
        s: "600px",
        m: "900px",
        l: "1200px"
    },
    colors: {
        bgDark: "#14162d"
    }
};

const invertTheme = {
    breakpoint: {
        xs: "400px",
        s: "600px",
        m: "900px",
        l: "1200px"
    },
    colors: {}
};

export { theme, invertTheme, GlobalStyle };
