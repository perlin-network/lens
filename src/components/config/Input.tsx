import React from "react";
import styled from "styled-components";

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
    padding: 10px;
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

export default Input;
