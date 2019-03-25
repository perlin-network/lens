import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../../common/typography";
import SendFail from "./SendFail";
import AccountDetected from "./AccountDetected";
import DashboardCard from "../DataCard";
import "./quicksend.scss";
import { Card } from "../../common/core";

const QuickSendHeading = styled.p`
    font-family: Montserrat;
    font-size: 30px;
    color: #fff;
    margin-bottom: 15px;
    font-weight: 600;
`;

const QuickSendInput = styled.input`
    font-family: HKGrotesk;
    background-color: #171d39;
    border: 1px solid #2e3451;
    color: white;
    width: 100%;
    padding: 20px;
    margin-top: 10px;
    margin-bottom: 10px;
`;

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
        this.onEnter = this.onEnter.bind(this);
    }

    public render() {
        return (
            <>
                <QuickSendHeading>Quick Send</QuickSendHeading>
                <p style={{ color: "#D8D8D8" }}>Lorem ipsum </p>
                <QuickSendInput
                    placeholder="Enter an account ID, Contract ID or Transaction ID"
                    value={this.state.inputID}
                    onChange={this.updateinputID}
                    onKeyDown={this.onEnter}
                />
                <div
                    className={
                        this.state.toggleComponent === "showDetectedAccount"
                            ? "displayComp"
                            : "hideComp"
                    }
                >
                    <AccountDetected recipientID={this.state.inputID} />
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
    private onEnter(e: any) {
        if (e.keyCode === 13) {
            if (this.validInputID()) {
                this.setState({ toggleComponent: "showDetectedAccount" });
            } else {
                this.setState({ toggleComponent: "showSendFail" }); // if fail, toggle fail component
            }
        }
    }
    private validInputID = () => {
        const re = /[0-9A-Fa-f]{64}/g;
        return re.test(this.state.inputID);
    };
}
