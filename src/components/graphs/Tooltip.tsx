import React from "react";
import styled from "styled-components";

const Wrapper = styled.div<{
    position: { x: number; y: number };
    status: string;
}>`
    .popup {
        position: absolute;
        left: ${({ position }) => position.x}px;
        top: ${({ position }) => position.y}px;
        font-size: 14px;
        opacity: 0;
        border-radius: 5px;
        pointer-events: none;
        transition: opacity 0.15s ease, transform 0.1s ease;
        transform: translate(-50%, calc(-100% - 6px));
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        transform-origin: 50% 0;
        background: #222948;
        border-radius: 3px;
        padding: 10px 15px;
        text-align: center;
        line-height: 1.4;

        &.active {
            opacity: 1;
            transform: translate(-50%, calc(-100% - 12px));
        }

        &:after {
            content: "";
            display: block;
            position: absolute;
            top: 100%;
            left: 50%;
            border: solid 9px transparent;
            border-top-color: #222948;
            transform: translateX(-50%);
        }

        .title {
            font-size: 14px;
            margin: 0;
            opacity: 0.6;
            font-weight: normal;
        }

        p {
            margin: 0;
        }

        .text {
            white-space: nowrap;
        }
        .status {
            color: ${({ status }) => getStatusType(status).color || "inherit"};
            display: ${({ status }) => getStatusType(status).color || "block"};
        }
    }
`;

const statusTypes = {
    applied: {
        color: "#7668cb",
        display: "block",
        text: "applied"
    },
    critical: {
        color: "#4788f1",
        display: "block",
        text: "critical"
    },
    start: {
        color: "#4788f1",
        display: "block",
        text: "critical"
    },
    rejected: {
        color: "#ff4422",
        display: "block",
        text: "rejected"
    }
};

const getStatusType = (key: string) => statusTypes[key] || {};

interface ITooltipProps {
    x: number;
    y: number;
    text: string;
    title?: string;
    status?: string;
    visible: boolean;
}

const Tooltip: React.SFC<ITooltipProps> = props => {
    const { title, text, x, y, visible, status = "" } = props;
    const position = { x, y };
    return (
        <Wrapper position={position} status={status}>
            <div className={"popup " + (visible ? "active" : "")}>
                {title && <h5 className="title">{title}</h5>}
                <p className="text">{text}</p>
                <p className="status">{getStatusType(status).text}</p>
            </div>
        </Wrapper>
    );
};

export default Tooltip;
