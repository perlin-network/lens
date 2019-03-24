import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../../common/typography";

export default class SendFail extends React.Component<{}, {}> {
    public render() {
        return (
            <div style={{ color: "#ff0000" }}>
                <p>Sorry, nothing matched that address</p>
            </div>
        );
    }
}
