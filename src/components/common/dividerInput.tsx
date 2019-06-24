import styled from "styled-components";

export const DividerInput = styled.input`
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: 400;
    background-color: #121834;
    border-radius: 5px 0px 0px 5px;
    border: 1px solid #2e345100;
    color: white;
    width: 100%;
    padding: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
    height: 48px;
    transition: all 0.2s ease;

    &:hover {
        cursor: text;
        border: 1px solid #4a41d1;
    }
    &:focus {
        border: 1px solid #4a41d1;
        outline: 0;
    }
    &::placeholder {
        font-size: 16px;
    }
`;

export const Divider = styled.button`
    height: 48px;
    background-color: #121834;
    font-size: 24px;
    font-weight: 400;
    color: #3a3f5b;
    width: auto;
    display: inline;
    padding: 0px;
    margin: 10px 0;
    border: 0px;

    &:focus {
        border: 0px;
        outline: 0;
    }
`;

export const DividerAside = styled.button.attrs({ hideOverflow: true })`
    height: 48px;
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
    white-space: nowrap;

    &:focus {
        border: 0px;
        outline: 0;
    }
`;
