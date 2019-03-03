import styled from "styled-components";
import { Flex } from "@rebass/grid";

const Card = styled(Flex)`
    background-color: #0e1a49;
    border-radius: 2px;
    box-shadow: 0 0 12px 6px rgba(155, 155, 155, 0.045);
    width: 100%;
    padding: 15px 20px;
    min-height: 100px;
`;

interface IButtonProps {
    width?: string;
}
const Button = styled.button`
    width: ${(props: IButtonProps) => props.width};
    height: 40px;
    border: 0;
    outline: 0;
    border-radius: 3px;
    margin-top: 18px;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: normal;
    color: #fff;
    background-color: #23228e;
    cursor: pointer;

    &:focus {
        outline: none;
    }
`;
Button.defaultProps = {
    width: "160px"
};

export { Card, Button };
