import styled from "styled-components";
import { Flex } from "@rebass/grid";

export const ErrorMessage = styled.div`
    margin: 10px 0;
    color: red;
`;
interface ICardProps {
    showBoxShadow?: boolean;
}
export const Card = styled(Flex)`
    background-color: #0e1a49;
    border-radius: 2px;
    width: 100%;
    padding: 15px 20px;
    min-width: 300px;
    min-height: 100px;
    ${(props: ICardProps) =>
        props.showBoxShadow
            ? "box-shadow: 0 0 12px 6px rgba(155, 155, 155, 0.045);"
            : ""}
`;
Card.defaultProps = {
    showBoxShadow: true
};

interface IButtonProps {
    width?: string;
    fontSize?: string;
    hideOverflow?: boolean;
}

export const Button = styled.button`
    width: ${(props: IButtonProps) => props.width};
    height: 40px;
    border: 0;
    outline: 0;
    border-radius: 3px;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    font-family: HKGrotesk;
    font-size: ${(props: IButtonProps) => props.fontSize};
    font-weight: normal;
    color: #fff;
    background-color: #23228e;
    cursor: pointer;
    ${(props: IButtonProps) =>
        props.hideOverflow
            ? `
        text-overflow: ellipsis;
        overflow: hidden;
    `
            : ""}

    &:active {
        background: rgba(34, 34, 142, 0.5);
    }

    &:focus {
        outline: none;
    }
`;
Button.defaultProps = {
    width: "160px",
    fontSize: "16px",
    hideOverflow: false
};

interface IInputProps {
    width?: string;
    fontSize?: string;
}
export const Input = styled.input`
    outline: none;
    border: none;
    min-width: 200px;
    border-radius: 2px;
    height: 35px;
    background-color: #fff;
    padding: 10px 15px;
    font-family: HKGrotesk;
    font-weight: normal;
    font-size: ${(props: IInputProps) => props.fontSize};
    width: ${(props: IInputProps) => props.width};

    &:focus {
        outline: none;
    }
    &::placeholder {
        color: #717985;
        opacity: 0.8;
    }
    &:disabled {
        background-color: #ddd;
    }
`;
Input.defaultProps = {
    width: "auto",
    fontSize: "14px"
};

interface IButtonProps {
    inactive?: boolean;
}

export const RoundButton = styled.button`
    border: none;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 42px;
    cursor: pointer;
    height: 48px;
    width: 48px;
    margin: 4px 4px;
    background-color: #171d39;
    border-radius: 50%;
    color: ${(props: IButtonProps) => (props.inactive ? "#5D6175" : "#FFFFFF")};
    &:focus {
        outline: none;
    }
`;
export const WhiteButton = styled.button`
    width: 100%;
    background-color: #fff;
    cursor: pointer;
    text-align: center;
    font-weight: 600;
    border: none;
    padding: 20px;
    text-decoration: none;
    display: inline-block;
    color: #151b35;
    font-size: 16px;
    border-radius: 5px;
`;

export const LargeInput = styled.input`
    border: none;
    outline: none;
    width: 100%;
    color: #fff;
    background-color: #171d39;
    border-radius: 5px;
    border: 1px solid #2e345100;
    padding: 20px;
    font-size: 16px;
    font-family: HKGrotesk;

    &:hover {
        cursor: text;
        border: 1px solid #4a41d1;
    }
    &:focus {
        cursor: text;
        border: 1px solid #4a41d1;
        outline: 0;
    }
`;

export const randomRange = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
// @ts-ignore
export const uniqueRandomRange = (window.uniqueRandomRange = (
    min: number,
    max: number
) => {
    if (min > max) {
        throw new Error(`Invalid random ranges ${min} - ${max}`);
    }
    const extracted: any = {};
    let extractedCount = 0;
    const info = {
        done: false,
        extracted
    };
    const random = (overrideMin: number = min, overrideMax: number = max) => {
        let value: number;

        while (!info.done) {
            value = randomRange(overrideMin, overrideMax);
            if (!extracted[value]) {
                extracted[value] = true;
                extractedCount++;
                break;
            }
        }

        info.done = extractedCount > max - min;
        // @ts-ignore
        return value;
    };

    return {
        random,
        info
    };
});

export const numberWithCommas = (x: number | string = 0) => {
    x = x + "";
    const parts = x.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
};
