import * as React from "react";
import styled from "styled-components";
import { Perlin } from "../../Perlin";
import "./config.scss";
import Input from "./Input";

interface IState {
    host: string;
    newHost: string;
}

interface IProps {
    disabled: boolean;
    initialHost: string;
}

const perlin = Perlin.getInstance();

export default class HostInput extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            host: props.initialHost,
            newHost: ""
        };
    }

    public resetHostValue = () => {
        this.setState((_, props) => ({
            host: props.initialHost
        }));
    };

    public getHostValue = () => {
        return this.state.newHost;
    };

    public handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ newHost: e.target.value });
    };

    public render() {
        return (
            <Input
                id="host-input"
                type="text"
                placeholder=" Ex: localhost:9000"
                onChange={this.handleAddressChange}
                value={this.props.disabled ? "" : this.state.newHost}
                disabled={this.props.disabled}
            />
        );
    }
}
