import * as React from "react";
import Button from "../Button";
import { ButtonGroup, Alert, Intent, Icon } from "@blueprintjs/core";
import HostnameInputContainer from "./HostnameInput/Container";
import { Perlin } from "../../Perlin";
import * as storage from "../../storage";
import styled from "styled-components";

const perlin = Perlin.getInstance();
const StyledIcon = styled(Icon)`
    margin-left: -20px;
    margin-right 17px;
`;

interface IState {
    isCollapsed: boolean;
    disabled: boolean;
    isChangeAlertOpen: boolean;
    isDiscardAlertOpen: boolean;
}

export default class CollapsedConfig extends React.Component<{}, IState> {
    public state = {
        isCollapsed: true,
        disabled: true,
        isChangeAlertOpen: false,
        isDiscardAlertOpen: false
    };

    private hostInputRef = React.createRef<HostnameInputContainer>();

    public render() {
        const {
            isCollapsed,
            disabled,
            isChangeAlertOpen,
            isDiscardAlertOpen
        } = this.state;

        return (
            <>
                <Button
                    icon={
                        isCollapsed ? (
                            <StyledIcon icon="caret-right" />
                        ) : (
                            <StyledIcon icon="caret-down" />
                        )
                    }
                    text={isCollapsed ? "Show Config" : "Hide Config"}
                    onClick={this.toggleCollapsed}
                />
                {!isCollapsed && (
                    <div style={{ marginTop: "20px" }}>
                        <HostnameInputContainer
                            disabled={disabled}
                            initialHost={perlin.api.host}
                            ref={this.hostInputRef}
                        />
                        <ButtonGroup>
                            {!disabled && (
                                <div style={{ marginRight: "0.5em" }}>
                                    <Button
                                        text="Discard Changes"
                                        onClick={this.showDiscardAlert}
                                    />
                                </div>
                            )}
                            <Button
                                text={disabled ? "Edit" : "Save"}
                                onClick={this.onToggleSave}
                            />
                        </ButtonGroup>
                        <Alert
                            isOpen={isChangeAlertOpen}
                            cancelButtonText="Cancel"
                            confirmButtonText="Confirm"
                            intent={Intent.PRIMARY}
                            onCancel={this.handleChangeAlertClose}
                            onConfirm={this.handleChangeAlertConfirm}
                        >
                            <p>
                                Are you sure you want to save this
                                configuration? <br />
                                <br />
                                The page will need to reload for these
                                configuration changes to take places.
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
                                Are you sure you want to discard these
                                configuration changes?
                            </p>
                        </Alert>
                    </div>
                )}
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

    private onToggleSave = () => {
        if (this.state.disabled) {
            this.setState(() => ({ disabled: false }));
        } else {
            // Show Alert
            this.setState(() => ({
                isChangeAlertOpen: true
            }));
        }
    };

    private toggleCollapsed = () => {
        this.setState(({ isCollapsed }) => ({
            isCollapsed: !isCollapsed
        }));
    };

    private showDiscardAlert = () => {
        this.setState(() => ({
            isDiscardAlertOpen: true
        }));
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
