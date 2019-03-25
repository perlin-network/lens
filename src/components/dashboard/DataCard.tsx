import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../common/typography";

interface IProps {
    heading: string;
    value: string;
    unit: string;
}

const CardSection = styled.div`
    border: 1px solid #ffffff22;
    word-wrap: break-word;
    padding: 10px;
    margin: 0px;
    font-size: 12px;
`;

export default class DataCard extends React.Component<IProps, {}> {
    constructor(props: IProps) {
        super(props);
    }
    public render() {
        return (
            <div style={{ marginRight: "20px" }}>
                <CardSection>{this.props.heading}</CardSection>
                <CardSection>
                    <span
                        style={{
                            fontSize: "36px",
                            fontWeight: 600,
                            borderTop: "0px solid white"
                        }}
                    >
                        {this.props.value}
                    </span>
                    <br />
                    {this.props.unit}
                </CardSection>
            </div>
        );
    }
}
