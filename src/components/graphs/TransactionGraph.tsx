import React, { useRef, useEffect, useState, useCallback } from "react";
import { when } from "mobx";
import { Perlin } from "../../Perlin";

import styled from "styled-components";
import { TransactionGraphScene } from "./TransactionGraphScene";
import Tooltip from "./Tooltip";
import { withRouter, RouteComponentProps } from "react-router";

const perlin = Perlin.getInstance();

const Wrapper = styled.div`
    position: relative;

    .canvas-container {
        width: 100%;
        height: 301px;
    }
`;

let transTooltip = {
    text: "",
    title: "",
    x: 0,
    y: 0,
    visible: false,
    status: ""
};
const useTooltip = (defaultTooltip: any) => {
    const [tooltip, setTooltip] = useState(defaultTooltip);

    const updateTooltip = (options: any) => {
        const newTooltip = {
            ...transTooltip,
            ...options
        };

        if (JSON.stringify(newTooltip) !== JSON.stringify(transTooltip)) {
            transTooltip = newTooltip;
            setTooltip(transTooltip);
        }
    };

    return [tooltip, updateTooltip];
};
const TransactionGraph: React.FunctionComponent<RouteComponentProps> = ({
    history
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useTooltip(transTooltip);

    useEffect(() => {
        const goToTxDetailPage = (id: string) => {
            history.push("/transactions/" + id);
        };

        const scene = new TransactionGraphScene(
            containerRef.current,
            setTooltip,
            goToTxDetailPage
        );

        perlin.onTransactionsRemoved = () => {
            const nodes = perlin.transactions.recent;
            scene.renderNodes(nodes);
        };

        perlin.onTransactionsCreated = () => {
            const nodes = perlin.transactions.recent;
            scene.renderNodes(nodes);
        };

        when(
            () => perlin.transactions.recent.length > 0,
            () => {
                const nodes = perlin.transactions.recent;
                scene.renderNodes(nodes);
            }
        );

        return () => {
            scene.destroy();
        };
    }, []);

    return (
        <Wrapper>
            <div className="canvas-container" ref={containerRef} />
            <Tooltip {...tooltip} />
        </Wrapper>
    );
};

export default withRouter(TransactionGraph);
