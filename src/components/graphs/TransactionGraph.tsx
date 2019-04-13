import React, { useRef, useEffect, useState } from "react";
import {
    ParticleSystem,
    DistanceConstraint,
    PointConstraint,
    DirectionalForce,
    PointForce,
    Force
} from "particulate";
import * as _ from "lodash";
import { when } from "mobx";
import { Perlin } from "../../Perlin";
import * as THREE from "three";
import styled from "styled-components";
import * as TrackballControls from "three-trackballcontrols";
import Tooltip from "./Tooltip";
import { withRouter, RouteComponentProps } from "react-router";

const perlin = Perlin.getInstance();

const Wrapper = styled.div`
    position: relative;

    .canvas-container {
        width: 100%;
        height: 301px;
    }
`;

const transTooltip = {
    text: "",
    title: "",
    x: 0,
    y: 0,
    visible: false,
    status: ""
};
class MainScene {
    public el: any;
    public scene: any;
    public camera: any;
    public lines: any;
    public dots: any;
    public nodes: any;
    public mouse: any;

    public renderer: any;
    public raycaster: any;
    public simulation: any;
    public hoverDot: any;
    public visIndices: any;
    public linkIndices: any;
    public controls: any;
    public circle: any;
    public circleHover: any;
    public distanceConstraint: any;
    private setTooltipHander: (newValue: any) => void;
    private clickHandler: (id: string) => void;
    private width: number;
    private height: number;
    private animationId: number;
    constructor(
        container: any,
        setTooltipHander: (newValue: any) => void,
        clickHandler: (id: string) => void
    ) {
        this.el = container;
        this.circle = this.createCircleTexture("#4A41D1", "#0C122B");
        this.circleHover = this.createCircleTexture("#4A41D1", "#FFFFFF");
        this.setTooltipHander = setTooltipHander;
        this.clickHandler = clickHandler;
        this.initScene();

        this.initRenderer();
        // this.initPostFX();
        this.initControls();
        this.renderNodes([]);
        setTimeout(() => {
            this.onWindowResize();
            this.initMouseEvents();
            this.animate();
        }, 500);

        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        window.addEventListener("resize", this.onWindowResize, false);
    }

    public destroy() {
        this.lines.dispose();
        this.dots.geometry.dispose();
        this.hoverDot.geometry.dispose();
        this.scene.dispose();
        this.renderer.dispose();
        window.cancelAnimationFrame(this.animationId);

        window.removeEventListener("resize", this.onWindowResize);
    }
    public initMouseEvents() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2(1, 1);
        const fog = this.scene.fog || {};
        const uniforms = {
            textures: { type: "t", value: this.circleHover },
            color: { type: "c", value: new THREE.Color(0xffffff) },
            fogColor: { type: "c", value: fog.color },
            fogNear: { type: "f", value: fog.near },
            fogFar: { type: "f", value: fog.far }
        };

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            depthWrite: true,
            alphaTest: 0.8,
            depthTest: true,
            opacity: 1,
            fog: true
        });

        const dotGeometry = new THREE.BufferGeometry();
        const position = new THREE.BufferAttribute(
            new Float32Array([0, 0, 0]),
            3
        );

        const sizes = new THREE.BufferAttribute(Float32Array.from([20]), 1);
        sizes.dynamic = true;
        position.dynamic = true;
        dotGeometry.addAttribute("position", position);
        dotGeometry.addAttribute("size", sizes);

        this.hoverDot = new THREE.Points(dotGeometry, material);
        this.hoverDot.renderOrder = 2;
        this.hoverDot.visible = false;
        this.scene.add(this.hoverDot);

        let hoveredDotIndex = -1;
        this.el.addEventListener("click", (event: any) => {
            if (hoveredDotIndex >= 0) {
                const node = this.nodes[hoveredDotIndex];
                this.clickHandler(node.id);
            }
        });
        this.el.addEventListener(
            "mousemove",
            _.debounce((event: any) => {
                if (!this.dots) {
                    return;
                }
                const { left, top } = this.el.getBoundingClientRect();

                const clientX = event.clientX - left;
                const clientY = event.clientY - top;

                this.mouse.x = (clientX / this.width) * 2 - 1;
                this.mouse.y = -(clientY / this.height) * 2 + 1;

                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersects = this.raycaster.intersectObject(this.dots);

                if (intersects.length !== 0) {
                    const intersect = intersects.reduce(
                        (curr: any, next: any) => {
                            return curr.distanceToRay < next.distanceToRay
                                ? curr
                                : next;
                        }
                    );
                    const index = intersect.index;
                    const node = this.nodes[index];

                    if (node.payload) {
                        const pos = this.simulation.getPosition(index, []);
                        const newPosition = new THREE.BufferAttribute(
                            new Float32Array(pos),
                            3
                        );
                        const size = this.dots.geometry.attributes.size.array[
                            index
                        ];
                        const newSize = new THREE.BufferAttribute(
                            Float32Array.from([size * 1.1]),
                            1
                        );

                        dotGeometry.addAttribute("position", newPosition);
                        dotGeometry.addAttribute("size", newSize);

                        this.hoverDot.visible = true;
                        this.setTooltipHander({
                            ...transTooltip,
                            x: clientX,
                            y: clientY - 10,
                            title: "Transaction",
                            text: node.payload.amount + " PERLs",
                            visible: true,
                            status: node.status
                        });

                        hoveredDotIndex = index;
                        return;
                    }
                }
                this.hoverDot.visible = false;
                this.setTooltipHander({
                    ...transTooltip,
                    visible: false
                });
                hoveredDotIndex = -1;
            }, 50),
            true
        );
    }
    public renderNodes(nodes: any[]) {
        this.scene.children = this.scene.children.filter(
            (child: any) => child === this.hoverDot
        );
        this.nodes = nodes;

        this.initSimulation();
        this.initVisualization();

        let index = nodes.length - 1;
        for (let i = 0; i <= index; i++) {
            if (this.nodes[i].payload) {
                index = i;
                console.log("last ndoe", this.nodes[i]);
                break;
            }
        }
        console.log("payloads", nodes.filter(item => item.payload));
        const lastPosition = this.simulation.getPosition(index, []);
        const [x, y, z] = lastPosition;
        console.log("lastPosition", lastPosition);
        this.camera.position.set(x, y, z + 10);
        this.controls.target.set(x, y, z);
        this.update();
    }
    public initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x151a34, 10, 150);
        this.camera = new THREE.PerspectiveCamera(30, 1, 1, 5000);
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(this.scene.position);
    }

    public initSimulation() {
        const distance = 1;
        const simulation = ParticleSystem.create(this.nodes.length, 3);

        const bounds = PointForce.create([0, 0, 0], {
            type: Force.REPULSOR,
            intensity: 1,
            radius: 10
        });

        const linkIndices = (this.linkIndices = []);
        const visIndices = (this.visIndices = []);

        // TODO:
        this.nodes.forEach((node: any, index: number) => {
            // @ts-ignore
            linkIndices.push(index, index + 1);
            // @ts-ignore
            visIndices.push(index);
        });

        simulation.each((item: any) => {
            // console.log(item);
            simulation.setPosition(
                item,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
        });

        this.distanceConstraint = DistanceConstraint.create(
            [distance * 0.5, distance],
            linkIndices
        );

        simulation.addConstraint(this.distanceConstraint);
        simulation.addForce(bounds);

        for (let i = 0; i < 5; i++) {
            simulation.tick(0.5);
        }

        this.simulation = simulation;
    }

    public initControls() {
        // @ts-ignore
        const controls = new TrackballControls(this.camera, this.el);
        controls.rotateSpeed = 1.5;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.9;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [65, 17, 16];
        this.controls = controls;
    }
    public createCircleTexture(fillColor: string, strokeColor: string) {
        const size = 256;
        const matCanvas = document.createElement("canvas");
        matCanvas.width = matCanvas.height = size;
        const matContext = matCanvas.getContext("2d");
        // create texture object from canvas.
        const texture = new THREE.CanvasTexture(matCanvas);
        // Draw a circle
        const center = size / 2;
        const strokeSize = 16;
        if (matContext) {
            matContext.beginPath();
            matContext.arc(
                center,
                center,
                size / 2 - strokeSize,
                0,
                2 * Math.PI,
                false
            );
            matContext.closePath();
            matContext.strokeStyle = strokeColor;
            matContext.lineWidth = strokeSize;
            matContext.fillStyle = fillColor;
            matContext.fill();
            matContext.stroke();
        }

        // need to set needsUpdate
        texture.needsUpdate = true;
        // return a texture made from the canvas
        return texture;
    }
    public initVisualization() {
        const vertices = new THREE.BufferAttribute(
            this.simulation.positions,
            3
        );

        const indices = new THREE.BufferAttribute(
            new Uint16Array(this.visIndices),
            1
        );
        const sizes = new THREE.BufferAttribute(
            Float32Array.from(
                this.nodes.map((node: any) => {
                    return (
                        Math.log((node.payload && node.payload.amount) || 1) + 6
                    );
                })
            ),
            1
        );

        const dotsGeometry = new THREE.BufferGeometry();
        dotsGeometry.addAttribute("position", vertices);
        dotsGeometry.addAttribute("size", sizes);

        const fog = this.scene.fog || {};
        const uniforms = {
            textures: { type: "t", value: this.circle },
            color: { type: "c", value: new THREE.Color(0xffffff) },
            fogColor: { type: "c", value: fog.color },
            fogNear: { type: "f", value: fog.near },
            fogFar: { type: "f", value: fog.far }
        };

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            depthWrite: true,
            alphaTest: 0.8,
            depthTest: true,
            opacity: 1,
            fog: true
        });

        this.dots = new THREE.Points(dotsGeometry, material);

        // Connections
        const lines = new THREE.BufferGeometry();
        lines.addAttribute("position", vertices);
        lines.addAttribute("index", indices);

        const visConnectors = new THREE.Line(
            lines,
            new THREE.LineBasicMaterial({
                color: 0x4a41d1,
                opacity: 0.5,
                transparent: true
            })
        );

        this.scene.add(visConnectors);
        this.scene.add(this.dots);

        this.lines = lines;
    }

    public initRenderer() {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.autoClear = false;
        renderer.setClearColor(0x050505, 1);

        this.el.appendChild(renderer.domElement);
        this.renderer = renderer;
    }

    public onWindowResize() {
        this.width = this.el.offsetWidth;
        this.height = this.el.offsetHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    public update() {
        this.scene.fog.far = this.camera.position.length() * 1.75;
        this.lines.attributes.position.needsUpdate = true;
        if (this.hoverDot) {
            this.hoverDot.geometry.attributes.position.needsUpdate = true;
            this.hoverDot.geometry.attributes.size.needsUpdate = true;
        }

        this.controls.update();
    }

    public render() {
        this.renderer.render(this.scene, this.camera);
    }

    public animate() {
        this.animationId = window.requestAnimationFrame(this.animate);
        if (this.nodes.length) {
            this.update();
            this.render();
        }
    }
}

const TransactionGraph: React.FunctionComponent<RouteComponentProps> = ({
    history
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState(transTooltip);

    useEffect(() => {
        const goToTxDetailPage = (id: string) => {
            history.push("/transactions/" + id);
        };
        const scene = new MainScene(
            containerRef.current,
            setTooltip,
            goToTxDetailPage
        );

        perlin.onTransactionsRemoved = () => {
            const nodes = perlin.transactions.recent;
            scene.renderNodes(nodes);
        };

        perlin.onTransactionsCreated = () => {
            const nodes = perlin.transactions.recent;
            scene.renderNodes(nodes);
        };

        when(
            () => perlin.transactions.recent.length > 0,
            () => {
                const nodes = perlin.transactions.recent;
                scene.renderNodes(nodes);
            }
        );

        return () => {
            scene.destroy();
        };
    }, []);

    return (
        <Wrapper>
            <div className="canvas-container" ref={containerRef} />
            <Tooltip {...tooltip} />
        </Wrapper>
    );
};

const fragmentShader = `
    uniform sampler2D textures;
    uniform vec3 color;
    uniform vec3 fogColor;
    uniform float fogNear;
    uniform float fogFar;

    void main() {
        vec4 startColor = vec4(color, 1.0);
        vec4 finalColor = texture2D(textures, gl_PointCoord);
        if ( finalColor.a < 0.5 ) discard;
        gl_FragColor = startColor * finalColor;

        #ifdef USE_FOG
            #ifdef USE_LOGDEPTHBUF_EXT
                float depth = gl_FragDepthEXT / gl_FragCoord.w;
            #else
                float depth = gl_FragCoord.z / gl_FragCoord.w;
            #endif
            float fogFactor = smoothstep( fogNear, fogFar, depth );
            gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
        #endif
    }
`;

const vertexShader = `
    attribute float size;
    void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 30.0 / length( mvPosition.xyz ) );

        gl_Position = projectionMatrix * mvPosition;
    }
`;

export default withRouter(TransactionGraph);
