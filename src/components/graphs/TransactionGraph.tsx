import React, { useRef, useEffect, useState, memo } from "react";
import { when } from "mobx";
import { Perlin } from "../../Perlin";
import { INode } from "./GraphStore";
import styled from "styled-components";
import { TransactionGraphScene } from "./TransactionGraphScene";
import Tooltip from "./Tooltip";
import { withRouter, RouteComponentProps } from "react-router";
import { GraphStore } from "./GraphStore";

const perlin = Perlin.getInstance();
const graphStore = GraphStore.getInstance();

const Wrapper = styled.div<{
    isHovered: boolean;
}>`
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
            goToTxDetailPage,
            graphStore.cameraSpeed
        );

        const addRoundDisposer = graphStore.subscribe(
            "addRound",
            (data: any, cb?: (params?: any) => void) => {
                scene.renderNodes(data.info, data.roundNum, cb);
            }
        );

        const pruneTxDisposer = graphStore.subscribe(
            "pruneTx",
            (tx: number) => {
                scene.removeNodes(tx);
            }
        );

        when(
            () => perlin.initRound,
            () => {
                const round = perlin.initRound;
                graphStore.addRound(
                    round.applied,
                    round.end_id,
                    true // for rerender of initial round
                );
            }
        );

        return () => {
            scene.destroy();
            graphStore.destroy();
            addRoundDisposer();
            pruneTxDisposer();
        };
    }, []);

    return (
        <Wrapper isHovered={tooltip.visible}>
            <div className="canvas-container" ref={containerRef} />
            <Tooltip {...tooltip} />
        </Wrapper>
    );
};

export default withRouter(memo(TransactionGraph));
