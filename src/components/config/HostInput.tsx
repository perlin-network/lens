import * as React from "react";
import styled from "styled-components";
import { Perlin } from "../../Perlin";
import "./config.scss";

const Input = styled.input`
    outline: none;
    border: none;
    border-radius: 2px;
    width: 100%;
    height: 40px;
    background-color: #fff;
    padding: 5px 10px;
    font-family: HKGrotesk;
    font-size: 14px;
    font-weight: normal;
    &::placeholder {
        color: #717985;
        opacity: 0.8;
    }
`;

interface IState {
    host: string;
    newHost: string;
}

interface IHostItem {
    id: number;
    value: string;
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
        console.log("hostInputHost", this.state.newHost);
        return this.state.newHost;
    };

    public handleAddressChange = e => {
        this.setState({ newHost: e.target.value });
    };

    public render() {
        return (
            <Input
                id="host-input"
                type="text"
                placeholder="ex: localhost:9000"
                onChange={this.handleAddressChange}
                value={this.props.disabled ? "" : this.state.newHost}
                disabled={this.props.disabled}
            />
        );
    }
}
