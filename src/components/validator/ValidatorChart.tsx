import * as React from "react";
import { createRef } from "react";
import * as PIXI from "pixi.js";
import * as d3 from "d3";
// @ts-ignore
import { withSize } from "react-sizeme";

class Chart extends React.Component<{ size: any }, {}> {
    private chartRef: React.RefObject<any> = createRef();
    private renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;

    public componentDidMount() {
        const width = this.props.size.width;
        const height = this.props.size.height || 400;

        const stage = new PIXI.Container();
        this.renderer = PIXI.autoDetectRenderer({
            width,
            height,
            transparent: true,
            antialias: true
        });

        const links = new PIXI.Graphics();
        stage.addChild(links);

        this.chartRef.current.appendChild(this.renderer.view);

        /*
        // parse the date / time
        const parseTime = d3.timeParse("%d-%b-%y");

        // set the ranges
        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);

        const valueline = d3.line()
            .x((d: any) =>  (x(d.date)) )
            .y((d: any) => y(d.close));
        
        
        */
    }

    public render() {
        return (
            <div
                style={{ width: "100%", height: 400, marginBottom: 0 }}
                ref={this.chartRef}
            />
        );
    }
}

const ValidatorChart = withSize()(Chart);

export { ValidatorChart };
