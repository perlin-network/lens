import React, { useRef, useEffect } from "react";
import {
    ParticleSystem,
    DistanceConstraint,
    PointConstraint,
    DirectionalForce,
    PointForce,
    Force
} from "particulate";
import * as THREE from "three";
import styled from "styled-components";
import * as TrackballControls from "three-trackballcontrols";
import CircleImage from "../../assets/svg/circle.png";

console.log("CircleImage", CircleImage);
const Wrapper = styled.div`
    width: 100%;
    height: 301px;
`;

class MainScene {
    public distances = [2.5, 10, 7.5, 0.5];
    public distIndex = 0;
    public el: any;
    public frame: any;
    public scene: any;
    public distTarget: any;
    public camera: any;
    public composer: any;
    public debugRepulsor: any;
    public lines: any;
    public dots: any;
    public mousePoint: any;
    public mouse: any;
    public width: any;
    public height: any;
    public renderer: any;
    public raycaster: any;
    public distance: any;
    public simulation: any;
    public pointRepulsor: any;
    public tick = 1;
    public mouseWorld: any;
    public visIndices: any;
    public linkIndices: any;
    public controls: any;
    public circle: any;
    public distanceConstraint: any;
    constructor(container: any) {
        this.el = container;
        this.circle = this.createCircleTexture();
        this.initScene();

        const count = 1000;

        this.initRenderer();
        // this.initPostFX();
        this.initControls();

        this.onWindowResize();
        this.initMouseEvents();

        this.renderNodes(count);

        // setTimeout(() => {
        //     count += 500;
        //     this.renderNodes(count);
        // }, 5000);

        this.frame = 0;
        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        // this.onMouseMove = this.onMouseMove.bind(this);

        window.addEventListener("resize", this.onWindowResize, false);

        // document.addEventListener("mousemove", this.onMouseMove, false);
    }
    public initMouseEvents() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2(1, 1);

        this.el.addEventListener(
            "mousemove",
            (event: any) => {
                const clientX = event.clientX - this.el.offsetLeft;
                const clientY = event.clientY - this.el.offsetTop;

                this.mouse.x = (clientX / this.width) * 2 - 1;
                this.mouse.y = -(clientY / this.height) * 2 + 1;

                // this.mouse.x = event.clientX - this.width * 0.5;
                // this.mouse.y = event.clientY - this.height * 0.5;

                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersects = this.raycaster.intersectObject(
                    this.scene.children[1]
                );
                if (intersects.length !== 0) {
                    const { index } = intersects[0];

                    const dotGeometry = new THREE.Geometry();
                    const position = this.simulation.getPosition(index, []);
                    dotGeometry.vertices.push(new THREE.Vector3(...position));

                    const material = new THREE.PointsMaterial({
                        size: 3,
                        color: 0xffffff,
                        map: this.circle,
                        depthWrite: true,
                        alphaTest: 0.8,
                        opacity: 1
                    });
                    const dot = new THREE.Points(dotGeometry, material);
                    this.scene.add(dot);
                }

                console.log("pos", this.mouse, intersects);
            },
            true
        );
    }
    public renderNodes(count: number) {
        this.scene.children = [];

        this.initSimulation(count);
        this.initVisualization();

        const lastPosition = this.simulation.getPosition(count - 1, []);
        const [x, y, z] = lastPosition;
        console.log("lastPosition", lastPosition);
        this.camera.position.set(x, y, z + 10);
        this.controls.target.set(x, y, z);
        this.update();
    }
    public initScene() {
        this.scene = new THREE.Scene();
        // this.scene.fog = new THREE.Fog(0x151a34, 10, 150);
        this.camera = new THREE.PerspectiveCamera(30, 1, 1, 5000);
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(this.scene.position);
    }

    public initSimulation(particles = 10000) {
        const distance = (this.distance = 1);
        const simulation = ParticleSystem.create(particles, 3);

        const bounds = PointForce.create([0, 0, 0], {
            type: Force.REPULSOR,
            intensity: 1,
            radius: 10
        });

        const linkIndices = (this.linkIndices = []);
        const visIndices = (this.visIndices = []);
        (() => {
            // @ts-ignore
            let a;
            let b;
            let c;
            let i;
            const il = particles;
            for (i = 2; i < il; i++) {
                a = i;
                b = a - 1;
                c = a - 2;
                // @ts-ignore
                linkIndices.push(a, b, b, c, c, a);
                // @ts-ignore
                visIndices.push(a);
            }
        })();

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
            [distance * 1, distance],
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
    public createCircleTexture() {
        const size = 512;
        const matCanvas = document.createElement("canvas");
        matCanvas.width = matCanvas.height = size;
        const matContext = matCanvas.getContext("2d");
        // create texture object from canvas.
        const texture = new THREE.Texture(matCanvas);
        // Draw a circle
        const center = size / 2;
        const strokeSize = 32;
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
            matContext.strokeStyle = "#0C122B";
            matContext.lineWidth = strokeSize;
            matContext.fillStyle = "#4A41D1";
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

        const dots = new THREE.BufferGeometry();
        dots.addAttribute("position", vertices);

        const material = new THREE.PointsMaterial({
            size: 1.5,
            color: 0xffffff,
            map: this.circle,
            depthWrite: true,
            alphaTest: 0.8,
            opacity: 1
        });

        const visParticles = new THREE.Points(dots, material);

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
        this.scene.add(visParticles);

        this.dots = dots;
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

    // public onMouseMove(event: any) {
    //     const width = this.width;
    //     const height = this.height;
    //     const mouse = this.mouse;
    //     const mouseWorld = this.mouseWorld;

    //     mouse[0] = event.clientX - width * 0.5;
    //     mouse[1] = event.clientY - height * 0.5;

    //     mouseWorld[0] = (event.clientX / width) * 2 - 1;
    //     mouseWorld[1] = -(event.clientY / height) * 2 + 1;
    // }

    public onWindowResize() {
        const pxRatio = window.devicePixelRatio || 1;
        // const postWidth = width * pxRatio;
        // const postHeight = height * pxRatio;

        this.width = this.el.offsetWidth;
        this.height = this.el.offsetHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        // this.composer.setSize(postWidth, postHeight);
        this.renderer.setSize(this.width, this.height);
    }

    public update() {
        // this.scene.fog.far = this.camera.position.length() * 1.75;
        this.lines.attributes.position.needsUpdate = true;

        this.controls.update();
    }

    public render() {
        this.renderer.render(this.scene, this.camera);
    }

    public animate() {
        window.requestAnimationFrame(this.animate);
        this.update();
        this.render();
        this.frame++;
    }
}

const TransactionGraph = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const scene = new MainScene(containerRef.current);
        scene.animate();
    });

    return <Wrapper ref={containerRef} />;
};

export default TransactionGraph;
