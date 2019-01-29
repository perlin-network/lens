import * as React from "react";
import styled from "styled-components";
import {
    Button as BButton,
    IButtonProps as IBButtonProps
} from "@blueprintjs/core";

const Wrapper = styled.div`
    background: linear-gradient(
        135deg,
        rgb(255, 165, 165) 0%,
        rgb(255, 149, 149) 10%,
        rgb(160, 120, 255) 45%,
        rgb(116, 255, 228) 100%
    );
    padding: 2px;
    width: 12em;
    border-radius: 1em;

    > button {
        position: relative;
        display: flex;
        cursor: pointer;
        font-weight: 600;
        border-radius: 1em;
        width: 100%;
        background-color: #1f2137 !important;
    }
`;

// interface IButtonProps extends IBButtonProps {}

const Button: React.FC<IBButtonProps> = props => {
    return (
        <Wrapper>
            <BButton {...props} />
        </Wrapper>
    );
};

export default Button;
