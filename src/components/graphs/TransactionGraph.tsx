import React, { useRef, useEffect, useState, useCallback } from "react";
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
import { timeHour } from "d3";

const perlin = Perlin.getInstance();

const Wrapper = styled.div`
    position: relative;

    .canvas-container {
        width: 100%;
        height: 301px;
    }
`;

const MAX_POINTS = 1000000;
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
    public visIndices: any = [];
    public linkIndices: any = [];
    public controls: any;
    public circle: any;
    public circleHover: any;
    public distanceConstraint: any;
    private setTooltipHander: (newValue: any) => void;
    private clickHandler: (id: string) => void;
    private width: number;
    private height: number;
    private animationId: number;

    private linePositions: number;
    constructor(
        container: any,
        setTooltipHander: (newValue: any) => void,
        clickHandler: (id: string) => void
    ) {
        this.el = container;
        this.circle = this.createCircleTexture("#4A41D1", "#0C122B");
        this.circleHover = this.createCircleTexture("#4A41D1", "#FFFFFF", true);
        this.setTooltipHander = setTooltipHander;
        this.clickHandler = clickHandler;
        this.initScene();

        this.initDots();
        this.initHoverDot();
        this.initLines();

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
        this.lines.geometry.dispose();
        this.dots.geometry.dispose();
        this.hoverDot.geometry.dispose();
        this.scene.dispose();
        this.renderer.dispose();
        window.cancelAnimationFrame(this.animationId);

        window.removeEventListener("resize", this.onWindowResize);
    }
    public initMouseEvents() {
        this.mouse = new THREE.Vector2(1, 1);

        let hoveredDotIndex = -1;
        let mouseDown: boolean = false;

        this.el.addEventListener(
            "mousedown",
            (event: any) => {
                hoveredDotIndex = -1;
                mouseDown = true;
                this.setTooltipHander({
                    visible: false
                });
            },
            true
        );
        this.el.addEventListener(
            "mouseout",
            (event: any) => {
                mouseDown = false;
                this.setTooltipHander({
                    visible: false
                });
            },
            true
        );
        this.el.addEventListener(
            "mouseup",
            (event: any) => {
                mouseDown = false;
                if (hoveredDotIndex < 0) {
                    return;
                }
                const node = this.nodes[hoveredDotIndex];
                this.clickHandler(node.id);
            },
            true
        );

        this.el.addEventListener(
            "mousemove",
            _.throttle((event: any) => {
                if (!this.dots || mouseDown) {
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
                    const size = this.dots.geometry.attributes.size.array[
                        index
                    ];

                    if (intersect.distanceToRay < 0.5) {
                        const pos = this.simulation.getPosition(index, []);
                        const newPosition = new THREE.BufferAttribute(
                            new Float32Array(pos),
                            3
                        );

                        this.hoverDot.geometry.addAttribute(
                            "position",
                            newPosition
                        );
                        this.hoverDot.geometry.attributes.size.array[0] = size;
                        this.hoverDot.visible = true;

                        const vec = new THREE.Vector3(...pos);
                        const out = vec.project(this.camera);

                        const widthHalf = this.width / 2;
                        const heightHalf = this.height / 2;

                        const x = out.x * widthHalf + widthHalf;
                        const y = -(out.y * heightHalf) + heightHalf;

                        const tooltip = {
                            x,
                            y: y - 10,
                            title: "Transaction",
                            text: "nop",
                            status: "",
                            visible: true
                        };

                        if (node.payload) {
                            tooltip.title = "Transfer";
                            tooltip.status = node.status;
                            tooltip.text = node.payload.amount + " PERLs";
                        }
                        this.setTooltipHander(tooltip);
                        hoveredDotIndex = index;
                        return;
                    }
                }
                this.hoverDot.visible = false;
                this.setTooltipHander({
                    visible: false
                });
                hoveredDotIndex = -1;
            }, 50),
            true
        );
    }
    public sortNodes(nodes: any) {
        let lastNode: any = {};
        const parentsMap = nodes.reduce((acc: any, node: any) => {
            if (!node.parents) {
                lastNode = node;
            } else {
                acc[node.parents[0]] = node;
            }

            return acc;
        }, {});

        const visited: any[] = [lastNode];
        const visit = (node: any) => {
            if (!node) {
                return;
            }
            visited.push(node);
            visit(parentsMap[node.id]);
        };

        visit(parentsMap[lastNode.id]);

        return visited;
    }
    public renderNodes(nodes: any[]) {
        this.nodes = this.sortNodes(nodes);

        this.initSimulation();
        this.updateDots();
        this.updateLines();

        const index = nodes.length - 1;
        // for (let i = index; i >= 0; i--) {
        //     if (this.nodes[i].payload) {
        //         index = i;
        //         break;
        //     }
        // }
        const lastPosition = this.simulation.getPosition(index, []);
        const [x, y, z] = lastPosition;

        this.camera.position.set(x, y, z + 10);
        this.controls.target.set(x, y, z);
        this.update();

        this.dots.geometry.attributes.position.needsUpdate = true;
        this.dots.geometry.attributes.size.needsUpdate = true;
        this.lines.geometry.attributes.position.needsUpdate = true;

        if (this.hoverDot) {
            this.hoverDot.geometry.attributes.position.needsUpdate = true;
            this.hoverDot.geometry.attributes.size.needsUpdate = true;
        }
    }
    public initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x151a34, 0, 130);
        this.raycaster = new THREE.Raycaster();
        this.raycaster.near = 0;
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

        this.linkIndices = [];
        this.visIndices = [];

        this.nodes.forEach((node: any, index: number) => {
            this.linkIndices.push(index, index + 1);
            this.visIndices.push(index);
        });

        simulation.each((item: any) => {
            simulation.setPosition(
                item,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
        });

        this.distanceConstraint = DistanceConstraint.create(
            [distance * 0.5, distance],
            this.linkIndices
        );

        simulation.addConstraint(this.distanceConstraint);
        simulation.addForce(bounds);

        for (let i = 0; i < 10; i++) {
            simulation.tick(0.3);
        }

        this.simulation = simulation;
    }

    public initControls() {
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
    public createCircleTexture(
        fillColor: string,
        strokeColor: string,
        glow = false
    ) {
        const size = 512;

        const matCanvas = document.createElement("canvas");
        matCanvas.width = matCanvas.height = size;
        const matContext = matCanvas.getContext("2d");

        const texture = new THREE.CanvasTexture(matCanvas);

        const center = size / 2;
        const strokeSize = 12;
        if (matContext) {
            matContext.beginPath();
            matContext.arc(
                center,
                center,
                size / 4 - strokeSize,
                0,
                2 * Math.PI,
                false
            );
            matContext.closePath();
            matContext.strokeStyle = strokeColor;
            matContext.lineWidth = strokeSize;
            matContext.fillStyle = fillColor;
            if (glow) {
                matContext.shadowBlur = size / 4;
                matContext.shadowColor = "#3326ff";
            }
            matContext.fill();
            matContext.shadowColor = "transparent";
            matContext.stroke();
        }

        texture.needsUpdate = true;

        return texture;
    }
    public getDotMaterial(texture: any) {
        const fog = this.scene.fog || {};
        const uniforms = {
            textures: { type: "t", value: texture },
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

            depthTest: true,
            alphaTest: 0.01,
            side: THREE.DoubleSide,
            opacity: 1,
            fog: true,
            transparent: true
        });

        return material;
    }

    public initHoverDot() {
        const dotGeometry = new THREE.BufferGeometry();
        const material = this.getDotMaterial(this.circleHover);

        const position = new THREE.BufferAttribute(
            new Float32Array([0, 0, 0]),
            3
        );

        const sizes = new THREE.BufferAttribute(new Float32Array(1), 1);
        // sizes.dynamic = true;
        // position.dynamic = true;
        dotGeometry.addAttribute("position", position);
        dotGeometry.addAttribute("size", sizes);

        this.hoverDot = new THREE.Points(dotGeometry, material);
        this.hoverDot.renderOrder = 2;
        this.hoverDot.visible = false;

        this.scene.add(this.hoverDot);
    }

    public initDots() {
        const dotsGeometry = new THREE.BufferGeometry();

        const material = this.getDotMaterial(this.circle);
        // const material = new THREE.PointsMaterial({size: 2});

        const verticles = new THREE.BufferAttribute(
            new Float32Array(MAX_POINTS * 3),
            3
        );
        // verticles.setDynamic(true);
        const sizes = new THREE.BufferAttribute(
            new Float32Array(MAX_POINTS),
            1
        );
        // sizes.setDynamic(true);

        dotsGeometry.addAttribute("position", verticles);
        dotsGeometry.addAttribute("size", sizes);

        this.dots = new THREE.Points(dotsGeometry, material);
        this.dots.renderOrder = 1;
        this.scene.add(this.dots);
    }

    public initLines() {
        const lineGeometry = new THREE.BufferGeometry();

        const verticles = new THREE.BufferAttribute(
            new Float32Array(MAX_POINTS * 3),
            3
        );
        // verticles.setDynamic(true);
        verticles.updateRange.count = MAX_POINTS * 3;

        lineGeometry.addAttribute("position", verticles);
        lineGeometry.setIndex(this.visIndices);

        this.lines = new THREE.Line(
            lineGeometry,
            new THREE.LineBasicMaterial({
                color: 0x4a41d1,
                opacity: 0.5,
                transparent: true,
                depthTest: false
            })
        );
        this.lines.renderOrder = 0;
        this.scene.add(this.lines);
    }

    public updateDots() {
        this.dots.geometry.attributes.position.set(this.simulation.positions);
        this.nodes.forEach((node: any, index: number) => {
            this.dots.geometry.attributes.size.array[index] =
                Math.log((node.payload && node.payload.amount) || 1) + 6;
        });

        this.dots.geometry.setDrawRange(0, this.nodes.length);
        this.dots.geometry.computeBoundingSphere();
    }
    public updateLines() {
        this.lines.geometry.attributes.position.set(this.simulation.positions);
        this.lines.geometry.setIndex(this.visIndices);

        this.lines.geometry.setDrawRange(0, this.nodes.length);
        this.lines.geometry.computeBoundingSphere();
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
        this.raycaster.far = this.scene.fog.far;

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

let transTooltip = {
    text: "",
    title: "",
    x: 0,
    y: 0,
    visible: false,
    status: ""
};
const useTooltip = (defaultTooltip: any) => {
    const [tooltip, setTooltip] = useState(defaultTooltip);

    const updateTooltip = (newTooltip: any) => {
        transTooltip = {
            ...transTooltip,
            ...newTooltip
        };
        setTooltip(transTooltip);
    };

    return [tooltip, updateTooltip];
};
const TransactionGraph: React.FunctionComponent<RouteComponentProps> = ({
    history
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useTooltip(transTooltip);

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
        #ifdef ALPHATEST
            if ( finalColor.a < ALPHATEST ) 
                discard;
        #endif
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
        gl_PointSize = size * ( 60.0 / length( mvPosition.xyz ) );

        gl_Position = projectionMatrix * mvPosition;
    }
`;

export default withRouter(TransactionGraph);
