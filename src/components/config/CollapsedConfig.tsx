import * as React from "react";
import Button from "../Button";
import { ButtonGroup } from "@blueprintjs/core";
import EndpointHostInput from "./EndpointHostInput";
import { Perlin } from "../../Perlin";

const perlin = Perlin.getInstance();

interface IState {
    isCollapsed: boolean;
    disabled: boolean;
}

export default class CollapsedConfig extends React.Component<{}, IState> {
    public state = {
        isCollapsed: true,
        disabled: true
    };

    private hostInputRef = React.createRef<EndpointHostInput>();

    public render() {
        const { isCollapsed, disabled } = this.state;

        return (
            <>
                {isCollapsed && (
                    <Button
                        text="Show Config"
                        onClick={this.onToggleCollapse}
                    />
                )}
                {!isCollapsed && (
                    <div style={{ marginTop: "20px" }}>
                        <EndpointHostInput
                            disabled={disabled}
                            ref={this.hostInputRef}
                        />
                        <ButtonGroup>
                            <Button
                                text="Hide Config"
                                onClick={this.onToggleCollapse}
                            />
                            <div style={{ marginLeft: "0.5em" }}>
                                <Button
                                    text={disabled ? "Edit" : "Save"}
                                    onClick={this.onToggleSave}
                                />
                            </div>
                        </ButtonGroup>
                    </div>
                )}
            </>
        );
    }

    private onToggleSave = () => {
        if (this.state.disabled) {
            this.setState(() => ({ disabled: false }));
        } else {
            const newHost = this.hostInputRef.current!.getHostValue();
            perlin.setCurrentHost(newHost);
            this.setState(() => ({ disabled: true }));
            // reload dialog
        }
    };

    private onToggleCollapse = () => {
        this.setState(({ isCollapsed }) => ({ isCollapsed: !isCollapsed }));
    };
}
