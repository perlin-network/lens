import * as React from "react";
import Button from "../Button";
import {Alert, ButtonGroup, Icon, Intent} from "@blueprintjs/core";
import HostnameInputContainer from "./HostnameInput/Container";
import {Perlin} from "../../Perlin";
import * as storage from "../../storage";
import styled from "styled-components";

const perlin = Perlin.getInstance();
const ConfigWrapper = styled.div`
    padding: 20px;
    margin-top: 20px;
    background-color: ${props => props.theme.colors.bgDark};
    border-bottom-left-radius: 1em;
    border-bottom-right-radius: 1em;
    margin-left: -20px;
    margin-right: -20px;
    margin-bottom: -20px;
`;
const CollapseButton = styled.div`
    margin-top: 1em;
    display: flex;
    align-items: center;
    font-weight: bold;
    font-size: 1.1em
    cursor: pointer;

    .bp3-icon {
        margin-right: 0.5em;
    }
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
                <CollapseButton onClick={this.toggleCollapsed}>
                    {isCollapsed ? (
                        <Icon icon="caret-right" />
                    ) : (
                        <Icon icon="caret-down" />
                    )}
                    {isCollapsed ? "Show Config" : "Hide Config"}
                </CollapseButton>
                {!isCollapsed && (
                    <ConfigWrapper>
                        <HostnameInputContainer
                            disabled={disabled}
                            initialHost={perlin.api.host}
                            ref={this.hostInputRef}
                        />
                        <ButtonGroup>
                            {!disabled && (
                                <div style={{ marginRight: "0.5em" }}>
                                    <Button
                                        noBorder={true}
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
                    </ConfigWrapper>
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

    private get wereChangesMade(): boolean {
        const changesMade = storage.getCurrentHost() !== this.hostInputRef.current!.getHostValue();
        return changesMade;
    }

    private onToggleSave = () => {
        if (this.state.disabled) {
            this.setState(() => ({ disabled: false }));
        } else {
            if (this.wereChangesMade) {
                this.setState(() => ({
                    isChangeAlertOpen: true
                }));
            } else {
                this.setState(() => ({
                    disabled: true,
                    isCollapsed: true
                }))
            }
        }
    };

    private toggleCollapsed = () => {
        this.setState(({ isCollapsed }) => ({
            isCollapsed: !isCollapsed
        }));
    };

    private showDiscardAlert = () => {
        if (this.wereChangesMade) {
            this.setState(() => ({
                isDiscardAlertOpen: true
            }));
        } else {
            this.setState(() => ({
                disabled: true,
                isCollapsed: true
            }))
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
