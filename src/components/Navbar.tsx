import * as React from "react";
import styled from "styled-components";
import "../index.scss";
import perlinLogo from "../assets/svg/perlin-logo.svg";
import { Flex, Box } from "@rebass/grid";
import { interpolateGreys } from "d3";
import { Perlin } from "../Perlin";
import { QRCode } from "react-qr-svg";
import { observer } from "mobx-react";

const Wrapper = styled(Flex)`
    margin: 46px 40px;
`;

const perlin = Perlin.getInstance();

@observer
export default class Navbar extends React.Component<{}, {}> {
    public render() {
        return (
            <Wrapper>
                <Box width={1 / 6}>
                    <img src={perlinLogo} style={{ width: "12em" }} />
                </Box>
                <Box width={3 / 6} />
                <Box width={2 / 6}>
                    <div className="QR-grid">
                        <div className="QR-grid-row1">
                            {perlin.publicKeyHex}
                        </div>
                        <div className="QR-grid-row2">
                            <QRCode
                                value={perlin.publicKeyHex}
                                style={{ width: "100%", height: "100%" }}
                            />
                        </div>
                    </div>
                </Box>
            </Wrapper>
        );
    }
}
