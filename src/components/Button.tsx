import * as React from "react";
import styled from "styled-components";
import { Button as BButton, IButtonProps } from "@blueprintjs/core";

interface IWrapperProps {
    noBorder: boolean;
}
interface IProps extends IButtonProps {
    noBorder?: boolean;
}

const Wrapper = styled.div`
    ${(props: IWrapperProps) =>
        !props.noBorder &&
        `background: linear-gradient(
        135deg,
        rgb(255, 165, 165) 0%,
        rgb(255, 149, 149) 10%,
        rgb(160, 120, 255) 45%,
        rgb(116, 255, 228) 100%
    );
    border-radius: 1em;`}
    padding: 2px;
    width: 12em;

    > button {
        position: relative;
        display: flex;
        cursor: pointer;
        font-weight: 600;
        width: 100%;
        background-color: #1f2137 !important;
        ${(props: IWrapperProps) => !props.noBorder && `border-radius: 1em;`}
    }
`;

// interface IButtonProps extends IBButtonProps {}

const Button: React.FC<IProps> = ({ noBorder = false, ...props }) => {
    return (
        <Wrapper noBorder={noBorder}>
            <BButton {...props} />
        </Wrapper>
    );
};

export default Button;
