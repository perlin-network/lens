import * as React from "react";
import HostInput from "./HostInput";
import { Perlin } from "../../Perlin";
import * as storage from "../../storage";
import styled from "styled-components";
import "./config.scss";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { Box } from "@rebass/grid";
import { EditIcon, QuestionIcon } from "../common/typography";

const perlin = Perlin.getInstance();

const SaveButton = styled.button`
    width: 160px;
    height: 40px;
    border: 0;
    outline: 2px solid #23228e;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: normal;
    color: #fff;
    background-color: #23228e;
    cursor: pointer;
`;

const EditButton = styled.button`
    width: 160px;
    height: 40px;
    border: 0;
    outline: 2px solid #23228e;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: normal;
    color: #fff;
    background-color: #23228e;
    cursor: pointer;
`;

const DiscardButton = styled.button`
    width: 160px;
    height: 40px;
    border: 0;
    outline: 2px solid #ffffff;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: normal;
    background-color: #0e1a49;
    color: #ffffff;
    cursor: pointer;
`;

export default class APIHostConfig extends React.Component {
    public state = {
        disabled: true
    };

    private newHost = "";
    private hostInputRef = React.createRef<HostInput>();

    saveConfigAlert = () => {
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className="alert-style alert-grid">
                        <div className="alert-row1">
                            <h1>
                                Are you sure you want to reconfigure your host
                                to {this.newHost}?
                            </h1>
                            <p>
                                The page will need to reload for these
                                configuration changes to take place.
                            </p>
                        </div>
                        <div className="alert-row2">
                            <QuestionIcon />
                        </div>
                        <div className="alert-row3">
                            <DiscardButton
                                style={{ marginRight: "10px" }}
                                onClick={onClose}
                            >
                                Cancel
                            </DiscardButton>
                            <SaveButton
                                onClick={() => {
                                    this.handleChangeAlertConfirm();
                                    onClose();
                                }}
                            >
                                Confirm
                            </SaveButton>
                        </div>
                    </div>
                );
            }
        });
    };

    discardChangesAlert = () => {
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className="alert-style alert-grid">
                        <div className="alert-row1">
                            <h1>
                                Are you sure you want to discard these
                                configuration changes?
                            </h1>
                        </div>
                        <div className="alert-row2">
                            <QuestionIcon />
                        </div>
                        <div className="alert-row3">
                            <DiscardButton
                                style={{
                                    marginRight: "10px",
                                    verticalAlign: "middle"
                                }}
                                onClick={onClose}
                            >
                                Cancel
                            </DiscardButton>
                            <SaveButton
                                onClick={() => {
                                    this.handleDiscardAlertConfirm();
                                    onClose();
                                }}
                            >
                                Confirm
                            </SaveButton>
                        </div>
                    </div>
                );
            }
        });
    };

    public render() {
        const { disabled } = this.state;

        return (
            <>
                <div className="inputHost" style={{ width: "100%" }}>
                    <HostInput
                        disabled={disabled}
                        initialHost={perlin.api.host}
                        ref={this.hostInputRef}
                    />
                </div>
                <div>
                    <SaveButton
                        onClick={this.onToggleSave}
                        style={{ marginLeft: "10px" }}
                    >
                        {disabled ? "Edit" : "Save"}
                    </SaveButton>
                    {!disabled && (
                        <DiscardButton
                            onClick={this.showDiscardAlert}
                            style={{ marginLeft: "10px" }}
                        >
                            Discard Changes
                        </DiscardButton>
                    )}
                </div>
            </>
        );
    }

    private handleChangeAlertConfirm = () => {
        this.newHost = this.hostInputRef.current!.getHostValue();
        storage.setCurrentHost(this.newHost);
        this.setState(() => ({
            disabled: true
        }));
        location.reload();
    };

    private get wereChangesMade(): boolean {
        if (
            storage.getCurrentHost() !==
                this.hostInputRef.current!.getHostValue() &&
            this.hostInputRef.current!.getHostValue() !== ""
        ) {
            return true;
        }
        return false;
    }

    private onToggleSave = () => {
        this.newHost = this.hostInputRef.current!.getHostValue();
        if (this.state.disabled) {
            this.setState(() => ({ disabled: false }));
        } else {
            if (this.wereChangesMade) {
                this.saveConfigAlert();
            } else {
                this.setState(() => ({
                    disabled: true
                }));
            }
        }
    };

    private showDiscardAlert = () => {
        if (this.wereChangesMade) {
            this.discardChangesAlert();
        } else {
            this.setState(() => ({
                disabled: true
            }));
        }
    };

    private handleDiscardAlertConfirm = () => {
        this.hostInputRef.current!.resetHostValue();
        this.setState(() => ({
            disabled: true
        }));
    };
}

export { APIHostConfig };
