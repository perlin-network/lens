import * as React from "react";
import { LargeInput } from "../common/core";
import { Perlin } from "../../Perlin";
import styled from "styled-components";
import "./config.scss";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { EditIcon, QuestionIcon } from "../common/typography";

const Wrapper = styled.div`
    ${LargeInput} {
        display: inline-block;
        max-width: 70%;
        padding: 15px;
        cursor: pointer;
    }
`;
const SaveButton = styled.button`
    width: 160px;
    height: 40px;
    border: 0;
    border-radius: 5px;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: 600;
    color: #151b35;
    background-color: #fff;
    cursor: pointer;
    &:active {
        background-color: #d4d5da;
    }
`;

const EditButton = styled.button`
    max-width: 50px;
    height: 48px;
    margin-left: 10px;
    border: 0;
    border-radius: 5px;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: 400;
    background-color: #fff;
    color: #151b35;
    cursor: pointer;

    &:active {
        background-color: #d4d5da;
    }
`;

const DiscardButton = styled.button`
    width: 160px;
    height: 40px;
    border: 0;
    border-radius: 5px;

    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: 400;
    background-color: #fff;
    color: #151b35;
    cursor: pointer;
    &:active {
        background-color: #d4d5da;
    }
`;

interface IConfigProps {
    confirmationMessage: string;
    onChange: (newValue: string) => void;
    value: string | number;
}
export default class Config extends React.Component<IConfigProps> {
    public state = {
        disabled: true
    };

    private newValue = "";
    private inputRef = React.createRef<HTMLInputElement>();

    public saveConfigAlert = () => {
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className="alert-style alert-grid">
                        <div className="alert-row1">
                            <h1>{this.props.confirmationMessage}</h1>
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
                            <SaveButton onClick={this.handleChangeAlertConfirm}>
                                Confirm
                            </SaveButton>
                        </div>
                    </div>
                );
            }
        });
    };

    public discardChangesAlert = () => {
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
                                onClick={this.handleDiscardAlertConfirm}
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
            <Wrapper>
                <div className="input-grid">
                    <div
                        className="input-row1"
                        style={{ width: "100%" }}
                        onClick={this.toggleDisabled}
                    >
                        <LargeInput
                            type="text"
                            ref={this.inputRef}
                            defaultValue={this.props.value + ""}
                            onChange={this.handleInputChanged}
                            disabled={this.state.disabled}
                            onKeyPress={this.handleInputKeypress}
                        />
                        {disabled && (
                            <EditButton onClick={this.toggleDisabled}>
                                <EditIcon />
                            </EditButton>
                        )}
                    </div>

                    <div className="input-row2">
                        {!disabled && (
                            <DiscardButton onClick={this.showDiscardAlert}>
                                Discard Changes
                            </DiscardButton>
                        )}
                        {!disabled && (
                            <SaveButton
                                onClick={this.onToggleSave}
                                style={{ marginLeft: "10px" }}
                            >
                                Save
                            </SaveButton>
                        )}
                    </div>
                </div>
            </Wrapper>
        );
    }

    private toggleDisabled = () => {
        this.setState(
            () => ({
                disabled: false
            }),
            () => {
                if (this.inputRef.current !== null) {
                    this.inputRef.current.focus();
                }
            }
        );
    };

    private handleChangeAlertConfirm = () => {
        this.props.onChange(this.newValue);
        this.setState(() => ({
            disabled: true
        }));
        location.reload();
    };

    private get wereChangesMade(): boolean {
        return this.newValue !== "";
    }

    private onToggleSave = () => {
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
    private handleInputChanged = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        this.newValue = event.target.value;
    };

    private handleInputKeypress = (event: any) => {
        if (event.key === "Enter") {
            this.onToggleSave();
        }
    };

    private handleDiscardAlertConfirm = () => {
        // this.inputRef.current!.resetHostValue();
        this.newValue = this.props.value + "";
        this.setState(() => ({
            disabled: true
        }));
        location.reload();
    };
}

export { Config };
