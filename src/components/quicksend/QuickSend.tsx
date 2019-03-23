import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../common/typography";
import SendFail from "./SendFail";
import AccountDetected from "./AccountDetected";
import DashboardCard from "../dashboard/DataCard";
import "./quicksend.scss";
import { Card } from "../common/core";

interface IState {
    toggleComponent: string;
    inputID: string;
}

export default class QuickSend extends React.Component<{}, IState> {
    constructor(props: any) {
        super(props);
        this.state = {
            toggleComponent: "",
            inputID: ""
        };
        this.updateinputID = this.updateinputID.bind(this);
    }

    public render() {
        return (
            <>
                <SectionTitle>Transaction Graph</SectionTitle>
                <p>Lorem ipsum </p>
                <input
                    placeholder="Enter an account ID, Contract ID or Transaction ID"
                    value={this.state.inputID}
                    onChange={this.updateinputID}
                />
                <button onClick={this.handleButtonClick}>Test button</button>
                <div
                    className={
                        this.state.toggleComponent === "showDetectedAccount"
                            ? "displayComp"
                            : "hideComp"
                    }
                >
                    <AccountDetected />
                </div>
                <div
                    className={
                        this.state.toggleComponent === "showSendFail"
                            ? "displayComp"
                            : "hideComp"
                    }
                >
                    <SendFail />
                </div>
            </>
        );
    }
    private updateinputID(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        this.setState({ inputID: value });
    }
    private handleButtonClick = () => {
        if (this.validInputID()) {
            this.setState({ toggleComponent: "showDetectedAccount" });
        } else {
            this.setState({ toggleComponent: "showSendFail" }); // if fail, toggle fail component
        }
    };
    private validInputID = () => {
        const re = /[0-9A-Fa-f]{64}/g;
        return re.test(this.state.inputID);
    };
}
