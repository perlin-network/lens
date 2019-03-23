import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../common/typography";

interface IProps {
    heading: string;
    value: string;
    unit: string;
}

export default class DataCard extends React.Component<IProps, {}> {
    constructor(props: IProps) {
        super(props);
    }
    public render() {
        return (
            <>
                <div>{this.props.heading}</div>
                <div>{this.props.value}</div>
                <div>{this.props.unit}</div>
            </>
        );
    }
}
