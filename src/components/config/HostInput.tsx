import * as React from "react";
import styled from "styled-components";
import { Perlin } from "../../Perlin";
import "./config.scss";

const Input = styled.input`
    outline: none;
    border: none;
    border-radius: 5px;
    width: 80%;
    height: 48px;
    font-size: 16px;
    font-weight: 400;
    font-family: HKGrotesk;
    color: #fff;
    background-color: #171d39;
    &:hover {
        cursor: text;
        border: 1px solid #4a41d1;
    }
    &:focus {
        cursor: text;
        border: 1px solid #4a41d1;
        outline: 0;
    }
    &::placeholder {
        color: #717985;
        opacity: 0.8;
        font-size: 18px;
    }
`;

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
