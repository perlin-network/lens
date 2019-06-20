import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { CopyIcon } from "../common/typography";

const copyPubkeyToClipboard = (event: any) => {
    const el = document.createElement("textarea");
    el.value = event.target.innerText;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
};

export const AddressWrapper = styled.div<{ width?: number }>`
    position: relative;
    color: #717985;
    font-size: 14px;
    display: inline-block;
    margin-top: 3px;
    cursor: pointer
    font-weight: 400;
    white-space: nowrap;

    .overflow {
        color: #717985;
        transition: all 0.8s ease;
        display: inline-block;
        vertical-align: middle;
        max-width: ${({ width }) =>
            width ? `${width}px` : "calc(100% - 20px)"};
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &:hover .overflow {
        color: #3c3858;
        max-width: 100vw;
    }

    
`;

export const Tooltip = styled.div`
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    color: #fff;
    background: #3c3858;
    padding: 3px 4px;
    border-radius: 4px;

    &::before {
        content: "";
        border: solid 3px transparent;
        border-bottom-color: #3c3858;
        display: block;
        position: absolute;
        bottom: 100%;
        right: 10px;
    }
`;

let timeout: any;
interface IAddressProps {
    width?: number;
    value: string;
}
const Address: React.FunctionComponent<IAddressProps> = ({ width, value }) => {
    const [showTooltip, setShowTootltip] = useState(false);

    const onClickHandler = useCallback((event: any) => {
        copyPubkeyToClipboard(event);
        setShowTootltip(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            setShowTootltip(false);
        }, 2000);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <AddressWrapper onClick={onClickHandler} width={width}>
            <span className="overflow">{value}</span>
            {showTooltip && <Tooltip>Address copied</Tooltip>}
        </AddressWrapper>
    );
};

export default Address;
