import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../common/typography";
import SendFail from "./SendFail";
import PerlsSent from "./PerlsSent";
import AccountDetected from "./AccountDetected";

interface IState {
    visibleComponent: string;
    inputValue: string;
}

export default class QuickSend extends React.Component<{}, IState> {
    constructor(props: any) {
        super(props);
        this.state = {
            visibleComponent: "",
            inputValue: ""
        };
        this.updateInputValue = this.updateInputValue.bind(this);
    }

    public render() {
        return (
            <>
                <SectionTitle>Transaction Graph</SectionTitle>
                <p>Lorem ipsum </p>
                <input
                    placeholder="Enter an account ID, Contract ID or Transaction ID"
                    value={this.state.inputValue}
                    onChange={this.updateInputValue}
                />
                <button onClick={this.handleButtonClick}>Test button</button>
                <div
                    className={
                        this.state.visibleComponent === "showPerlsSent"
                            ? "displayComp"
                            : "hideComp"
                    }
                >
                    <PerlsSent />
                </div>
                <div
                    className={
                        this.state.visibleComponent === "showDetectedAccount"
                            ? "displayComp"
                            : "hideComp"
                    }
                >
                    <AccountDetected />
                </div>
                <div
                    className={
                        this.state.visibleComponent === "showSendFail"
                            ? "displayComp"
                            : "hideComp"
                    }
                >
                    <SendFail />
                </div>
            </>
        );
    }
    private handleButtonClick = () => {
        if (this.state.inputValue === "a") {
            this.setState({ visibleComponent: "showDetectedAccount" });
        } else if (this.state.inputValue === "b") {
            this.setState({ visibleComponent: "showPerlsSent" });
        } else {
            this.setState({ visibleComponent: "showSendFail" }); // if fail, toggle fail component
        }
    };
    private updateInputValue(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        console.log("This is recognised", value);
        this.setState({ inputValue: value });
    }
}
