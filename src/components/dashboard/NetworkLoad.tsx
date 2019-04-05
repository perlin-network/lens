import React from "react";
import styled from "styled-components";
import { NetworkIcon } from "../common/typography";

const Wrapper = styled.div`
    display: flex;
    margin-right: 15px;

    .info {
        .value {
            font-size: 16px;
            margin-right: 5px;
        }
        .unit {
            font-size: 12px;
            opacity: 0.6;
        }
    }
`;

interface INetworkLoad {
    tps?: number;
}
const NetworkLoad: React.SFC<INetworkLoad> = ({ tps }) => {
    return (
        <Wrapper title="Network Load">
            <NetworkIcon style={{ marginRight: "10px" }} />
            <div className="info">
                <span className="value">{tps || "TBA"}</span>
                <span className="unit">Avg TPS</span>
            </div>
        </Wrapper>
    );
};

export default NetworkLoad;
