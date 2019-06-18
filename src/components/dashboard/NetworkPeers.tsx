import React from "react";
import styled from "styled-components";
import { UserIcon } from "../common/typography";

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
    peers?: number;
}
const NetworkLoad: React.SFC<INetworkLoad> = ({ peers = 0 }) => {
    return (
        <Wrapper title="Network Load">
            <UserIcon style={{ marginRight: "10px" }} />
            <div className="info">
                <span className="value">{peers}</span>
                <span className="unit">Nodes</span>
            </div>
        </Wrapper>
    );
};

export default NetworkLoad;
