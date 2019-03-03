import * as React from "react";
import { Alert, ButtonGroup, Icon, Intent } from "@blueprintjs/core";
import HostnameInputContainer from "./HostnameInput/Container";
import HostInput from "./HostInput";
import { Perlin } from "../../Perlin";
import * as storage from "../../storage";
import styled from "styled-components";
import "./config.scss";

import { any } from "prop-types";
import { Box, Flex } from "@rebass/grid";

const perlin = Perlin.getInstance();

const Button = styled.button`
    width: 160px;
    height: 40px;
    border: 0;
    outline: 0;
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

const InfoWrapper = styled(Box)`
    margin-right: 40px;
`;

interface IState {
    disabled: boolean;
    isChangeAlertOpen: boolean;
    isDiscardAlertOpen: boolean;
}

export default class APIHostConfig extends React.Component {
    public state = {
        disabled: true,
        isChangeAlertOpen: false,
        isDiscardAlertOpen: false
    };

    private hostInputRef = React.createRef<HostInput>();

    public render() {
        const { disabled, isChangeAlertOpen, isDiscardAlertOpen } = this.state;

        return (
            <>
                <div className="grid-container">
                    <div className="inputHost">
                        <HostInput
                            disabled={disabled}
                            initialHost={perlin.api.host}
                            ref={this.hostInputRef}
                        />
                    </div>
                    {!disabled && (
                        <div
                            style={{ marginRight: "0.5em" }}
                            className="discardButton"
                        >
                            <Button onClick={this.showDiscardAlert}>
                                Discard Changes
                            </Button>
                        </div>
                    )}
                    <div className="editSaveButton">
                        <Button onClick={this.onToggleSave}>
                            {disabled ? "Edit" : "Save"}
                        </Button>
                    </div>
                </div>

                <Alert
                    isOpen={isChangeAlertOpen}
                    cancelButtonText="Cancel"
                    confirmButtonText="Confirm"
                    intent={Intent.PRIMARY}
                    onCancel={this.handleChangeAlertClose}
                    onConfirm={this.handleChangeAlertConfirm}
                >
                    <p>
                        Are you sure you want to save this configuration? <br />
                        <br />
                        The page will need to reload for these configuration
                        changes to take places.
                    </p>
                </Alert>
                <Alert
                    isOpen={isDiscardAlertOpen}
                    cancelButtonText="Cancel"
                    confirmButtonText="Confirm"
                    intent={Intent.PRIMARY}
                    onCancel={this.handleDiscardAlertClose}
                    onConfirm={this.handleDiscardAlertConfirm}
                >
                    <p>
                        Are you sure you want to discard these configuration
                        changes?
                    </p>
                </Alert>
            </>
        );
    }

    private handleChangeAlertConfirm = () => {
        const newHost = this.hostInputRef.current!.getHostValue();
        storage.setCurrentHost(newHost);
        this.setState(() => ({
            disabled: true,
            isChangeAlertOpen: false
        }));
        location.reload();
    };

    private handleChangeAlertClose = () => {
        this.setState(() => ({
            isChangeAlertOpen: false
        }));
    };

    private get wereChangesMade(): boolean {
        const changesMade =
            storage.getCurrentHost() !==
            this.hostInputRef.current!.getHostValue();
        return changesMade;
    }

    private onToggleSave = () => {
        console.log(this.hostInputRef.current!.getHostValue());
        if (this.state.disabled) {
            this.setState(() => ({ disabled: false }));
        } else {
            if (this.wereChangesMade) {
                this.setState(() => ({
                    isChangeAlertOpen: true
                }));
            } else {
                this.setState(() => ({
                    disabled: true
                }));
            }
        }
    };

    private showDiscardAlert = () => {
        if (this.wereChangesMade) {
            this.setState(() => ({
                isDiscardAlertOpen: true
            }));
        } else {
            this.setState(() => ({
                disabled: true
            }));
        }
    };

    private handleDiscardAlertClose = () => {
        this.setState(() => ({
            isDiscardAlertOpen: false
        }));
    };

    private handleDiscardAlertConfirm = () => {
        this.hostInputRef.current!.resetHostValue();
        this.setState(() => ({
            disabled: true,
            isDiscardAlertOpen: false
        }));
    };
}

export { APIHostConfig };
