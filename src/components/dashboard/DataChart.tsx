import React, { useEffect, memo, useRef } from "react";
import * as d3 from "d3";
import styled from "styled-components";

const Wrapper = styled.div`
    position: relative;
    border: solid 1px #34374a;
    border-left: none;
    height: 100px;
    width: 33px;
    flex: 1;
    min-width: 0;

    &:first-child {
        border-left: solid 1px #34374a;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
    }
    &:last-child {
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
    }

    svg {
        background: none;
    }
    .svg-container {
        display: inline-block;
        position: absolute;
        width: 100%;
        height: 33%; /* aspect ratio */
        vertical-align: top;
        overflow: hidden;
        border-radius: 5px;
        left: 0;
        bottom: 0;
    }
`;
interface IValue {
    time: number;
    value: number;
}

const useLineChart = (ref: any) => {
    const width = 300;
    const height = 100;
    const dataSet = useRef<IValue[]>([]);
    const x = useRef(d3.scaleTime().range([0, width]));
    const y = useRef(d3.scaleLinear().range([height, 0]));
    const svg = useRef<any>();

    useEffect(() => {
        const now = Date.now();
        let counter = 2;

        while (counter--) {
            dataSet.current.push({
                time: now - (counter + 1) * 1000,
                value: 0
            });
        }
        // append the svg object to the body of the page
        svg.current = d3
            .select(ref.current)
            .append("div")
            .classed("svg-container", true)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("preserveAspectRatio", "none")
            .attr("viewBox", `0 0 ${width} ${height}`);

        update(true);
    }, []);

    const update = (initial: boolean = false) => {
        const data = dataSet.current;
        // @ts-ignore
        x.current.domain(d3.extent(data, (d: IValue) => d.time));

        const yDomain = initial
            ? [0, d3.max(data, (d: IValue) => d.value)]
            : d3.extent(data, (d: IValue) => d.value);

        // @ts-ignore
        y.current.domain(yDomain);
        const u = svg.current
            .selectAll(".lineTest")
            .data([data], (d: any) => d.time);

        const area = d3
            .area()
            // @ts-ignore
            .x((d: any) => x.current(d.time))
            .y0(height)
            // @ts-ignore
            .y1((d: any) => y.current(d.value));

        u.enter()
            .append("path")
            .attr("class", "lineTest")
            // @ts-ignore
            .merge(u)
            .attr("d", area)
            .attr("fill", "#151a34");
    };

    const addValue = (value: number) => {
        if (dataSet.current.length > 30) {
            dataSet.current.shift();
        }
        dataSet.current.push({
            time: Date.now(),
            value
        });

        update();
    };
    return { addValue };
};

const Content = styled.div`
    position: relative;
    z-index: 2;
    padding: 20px;
    h4 {
        margin: 0 0 5px;
    }
`;

interface IDataChartProps {
    value?: number;
    title: string;
    decimals?: number;
}
const DataChart: React.FunctionComponent<IDataChartProps> = ({
    value = null,
    title,
    decimals = 4
}) => {
    const svgRef = useRef(null);
    const timeout = useRef<any>();
    const { addValue } = useLineChart(svgRef);

    useEffect(() => {
        if (value !== null) {
            addValue(value);

            clearInterval(timeout.current);
            timeout.current = setInterval(() => {
                addValue(value);
            }, 5000);
        }

        return () => {
            clearInterval(timeout.current);
        };
    }, [value]);
    const intValue = value || 0;
    return (
        <Wrapper ref={svgRef}>
            <Content>
                <h4>{title}</h4>
                <p>{intValue.toFixed(decimals)}</p>
            </Content>
        </Wrapper>
    );
};

export default memo(DataChart);
