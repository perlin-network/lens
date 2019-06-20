import React from "react";
import styled from "styled-components";

export const Spinner = styled.div`
    margin: 100px auto 0;
    width: 70px;
    text-align: center;

    & > div {
        width: 18px;
        height: 18px;
        background-color: #3c3858;

        border-radius: 100%;
        display: inline-block;
        animation: sk-bouncedelay 1.4s infinite ease-in-out both;
    }

    .bounce1 {
        animation-delay: -0.32s;
    }

    .bounce2 {
        animation-delay: -0.16s;
    }

    @keyframes sk-bouncedelay {
        0%,
        80%,
        100% {
            transform: scale(0);
        }
        40% {
            transform: scale(0.8);
        }
    }
`;
const LoadingSpinner = () => {
    return (
        <Spinner>
            <div className="bounce1" />
            <div className="bounce2" />
            <div className="bounce3" />
        </Spinner>
    );
};

export default LoadingSpinner;
