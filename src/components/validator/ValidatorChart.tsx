import * as React from "react";
import { createRef } from "react";
import * as d3 from "d3";

// @ts-ignore
import { withSize } from "react-sizeme";

interface IChartProps {
    size: any;
}

interface IState {
    data: any[] | null;
}

class Chart extends React.Component<IChartProps, IState> {
    private width: number;
    private height: number;
    private x: any;
    private y: any;
    private area: any;
    private valueline: any;

    private margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 50
    };

    constructor(props: IChartProps) {
        super(props);
        this.state = {
            data: null
        };
    }

    public componentDidMount() {
        this.width =
            this.props.size.width - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;
        this.x = d3.scaleTime().range([0, this.width]);
        this.y = d3.scaleLinear().range([this.height, 0]);

        const parseDate = d3.timeParse("%Y%m%d");
        this.area = d3
            .area()
            .x((d: any) => this.x(d.date))
            .y0(this.height)
            .y1((d: any) => this.y(d.temperature));

        this.valueline = d3
            .line()
            .x((d: any) => this.x(d.date))
            .y((d: any) => this.y(d.temperature));

        const rawData = d3.csvParse(this.getData());
        rawData.forEach((d: any) => {
            d.date = parseDate(d.date.replace(/\s/g, ""));
            d.temperature = +d.temperature;
        });
        // @ts-ignore
        this.x.domain([rawData[0].date, rawData[rawData.length - 1].date]);
        // @ts-ignore
        this.y.domain(d3.extent(rawData, (d: any) => d.temperature));

        this.setState({
            data: rawData
        });
    }

    public render() {
        return (
            <svg
                width={this.width + this.margin.left + this.margin.right}
                height={this.height + this.margin.top + this.margin.bottom}
                style={{ backgroundColor: "#151b35" }}
            >
                <defs>
                    <linearGradient id="gradient" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#9D92FD" />
                        <stop offset="50%" stopColor="#151b35" />
                    </linearGradient>
                </defs>
                <g
                    transform={`translate(${this.margin.left}, ${
                        this.margin.top
                    })`}
                >
                    {this.state.data ? (
                        <path
                            style={{
                                fill: "none",
                                strokeWidth: "3px",
                                stroke: "#5A4DFF"
                            }}
                            d={this.valueline(this.state.data)}
                        />
                    ) : null}
                    {this.state.data ? (
                        <path
                            fill="url(#gradient)"
                            style={{ strokeWidth: "5px" }}
                            d={this.area(this.state.data)}
                        />
                    ) : null}
                </g>
            </svg>
        );
    }

    public getData() {
        return `date,temperature
        20120912,55.7
        20120913,54.3
        20120914,55.2
        20120915,54.3
        20120916,52.9
        20120917,54.8
        20120918,54.8
        20120919,56.8
        20120920,55.4
        20120921,55.8
        20120922,55.9
        20120923,52.8
        20120924,54.5
        20120925,53.3
        20120926,53.6
        20120927,52.1
        20120928,52.6
        20120929,53.9
        20120930,55.1`;
    }
}

const ValidatorChart = withSize()(Chart);

export { ValidatorChart };
