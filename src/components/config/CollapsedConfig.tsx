import * as React from "react";
import Button from "../Button";
import styled from "styled-components";
import {
    Collapse,
    FormGroup,
    ButtonGroup,
    InputGroup
} from "@blueprintjs/core";

const Wrapper = styled.div``;

interface IState {
    isCollapsed: boolean;
}

export default class CollapsedConfig extends React.Component<{}, IState> {
    public state = {
        isCollapsed: true
    };

    public render() {
        const { isCollapsed } = this.state;

        return (
            <>
                {isCollapsed && (
                    <Button text="Show Config" onClick={this.onExpandClick} />
                )}
                <Collapse isOpen={!isCollapsed}>
                    <ButtonGroup>
                        <Button text="Hide" onClick={this.onCollapseClick} />
                        <div style={{ marginLeft: "0.5em" }}>
                            <Button text="Edit" />
                        </div>
                    </ButtonGroup>
                </Collapse>
            </>
        );
    }

    private onExpandClick = () => {
        this.setState(() => ({ isCollapsed: false }));
    };

    private onCollapseClick = () => {
        this.setState(() => ({ isCollapsed: true }));
    };
}
