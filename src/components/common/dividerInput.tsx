import { StyledInput } from "./core";
import styled from "styled-components";

export const DividerInput = styled(StyledInput)`
    border-radius: 5px 0px 0px 5px;
    min-width: 120px;
`;

export const Divider = styled.button`
    height: 48px;
    background-color: #121834;
    font-size: 24px;
    font-weight: 400;
    color: #3a3f5b;
    width: 10px;
    padding: 0px;
    margin: 10px 0;
    border: 0px;

    &:focus {
        border: 0px;
        outline: 0;
    }
`;

export const DividerAside = styled.div`
    height: 48px;
    overflow: hidden;
    border-radius: 0px 5px 5px 0px;
    background-color: #121834;
    font-size: 16px;
    font-weight: 400;
    color: white;
    width: auto;

    display: inline;
    padding: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
    border: 0px;
    flex-shrink: 0;
    white-space: nowrap;

    &:focus {
        border: 0px;
        outline: 0;
    }
`;
