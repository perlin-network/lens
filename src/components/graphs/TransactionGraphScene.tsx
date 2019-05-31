import * as TrackballControls from "three-trackballcontrols";
import * as THREE from "three";
import * as TWEEN from "es6-tween";
import { DistanceConstraint, ParticleSystem } from "particulate";
import * as _ from "lodash";
import { INode } from "./GraphStore";

const MAX_POINTS = 1000000;
export class TransactionGraphScene {
    public lineIndices: any = [];
    public positions: any = [];
    private el: any;
    private scene: any;
    private camera: any;
    private lines: any;
    private dots: any;
    private nodes: any = [];
    private mouse: any;
    private renderer: any;
    private raycaster: any;
    private simulation: any;

    private controls: any;
    private lastIndex: number = 0;
    private dotTexture: any;
    private removedNodes = 0;
    private dotSecondaryTexture: any;
    private dotHoverTexture: any;
    private distanceConstraint: any;
    private setTooltipHander: (newValue: any) => void;
    private clickHandler: (id: string) => void;
    private focusedIndex: any; // node index towards which the camera is pointing
    private width: number;
    private height: number;
    private animationId: number;

    constructor(
        container: any,
        setTooltipHander: (newValue: any) => void,
        clickHandler: (id: string) => void
    ) {
        this.el = container;
        this.dotTexture = this.createDotTexture("#4A41D1", "#0C122B");
        this.dotHoverTexture = this.createDotTexture(
            "#4A41D1",
            "#FFFFFF",
            true
        );
        this.dotSecondaryTexture = this.createDotTexture("#2c2781", "#0C122B");
        this.setTooltipHander = setTooltipHander;
        this.clickHandler = clickHandler;
        this.initScene();
        this.initDots();

        this.initLines();

        this.initRenderer();

        this.initControls();
        setTimeout(() => {
            this.onWindowResize();
            this.initMouseEvents();
            this.animate();
        }, 500);

        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        window.addEventListener("resize", this.onWindowResize, false);
    }

    public updateNodes() {
        this.updateDots();
        this.dots.geometry.attributes.texIndex.needsUpdate = true;
    }

    public renderNodes(nodes: INode[]) {
        this.nodes = nodes;
        const step = 0.5;
        this.positions = this.nodes.map((node: INode) => {
            return [
                step * node.depthPos[0],
                step * 2 * node.globalDepth,
                step * node.depthPos[1]
            ];
        });

        this.lineIndices = this.nodes.reduce((acc: any[], curr: INode) => {
            curr.children.forEach((child: INode) => {
                acc.push(curr.id, child.id);
            });
            return acc;
        }, []);

        this.updateDots();
        this.updateLines();

        if (nodes[nodes.length - 1]) {
            this.pointCamera(nodes[nodes.length - 1].id);
        }
    }

    public destroy() {
        this.lines.geometry.dispose();
        this.dots.geometry.dispose();

        this.scene.dispose();
        this.renderer.dispose();
        window.cancelAnimationFrame(this.animationId);

        window.removeEventListener("resize", this.onWindowResize);
    }

    private initMouseEvents() {
        this.mouse = new THREE.Vector2(1, 1);

        let hoveredDotIndex = -1;
        let mouseDown: boolean = false;

        const disableHover = () => {
            if (hoveredDotIndex !== -1) {
                this.dots.geometry.attributes.texIndex.array[hoveredDotIndex] =
                    this.nodes[hoveredDotIndex].type === "rejected" ? 2.0 : 0.0;
                this.dots.geometry.attributes.texIndex.needsUpdate = true;
                hoveredDotIndex = -1;

                this.setTooltipHander({
                    visible: false
                });
            }
        };
        this.el.addEventListener(
            "mousedown",
            (event: any) => {
                mouseDown = true;
            },
            true
        );
        this.el.addEventListener(
            "mouseout",
            (event: any) => {
                mouseDown = false;
                disableHover();
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

                if (this.focusedIndex === hoveredDotIndex) {
                    const node = this.nodes[hoveredDotIndex];
                    this.clickHandler(node.id);
                } else {
                    this.pointCamera(hoveredDotIndex);
                }
                disableHover();
            },
            true
        );

        this.el.addEventListener(
            "mousemove",
            _.debounce((event: any) => {
                disableHover();
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
                // .filter(
                //     (item: any) =>
                //         this.nodes[item.index] &&
                //         this.nodes[item.index].payload
                // );

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

                    if (node && intersect.distanceToRay < 0.2) {
                        const pos = this.positions[index];

                        this.dots.geometry.attributes.texIndex.array[
                            index
                        ] = 1.0;
                        this.dots.geometry.attributes.texIndex.needsUpdate = true;

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

                        // if (node.payload) {
                        tooltip.title = node.type;
                        tooltip.status = node.id;
                        tooltip.text = ""; // node.payload.amount + " PERLs";
                        // }
                        this.setTooltipHander(tooltip);
                        hoveredDotIndex = index;
                        return;
                    }
                }
                this.setTooltipHander({
                    visible: false
                });
            }, 20),
            true
        );
    }
    private pointCamera(index: number) {
        if (index === -1) {
            return;
        }
        const position = this.camera.position.clone();

        position.z -= 10;
        this.focusedIndex = index;

        const [x, y, z] = this.positions[index];

        const positionTween = new TWEEN.Tween(position)
            .to({ x, y, z }, 1000)
            .delay(200)
            .easing(TWEEN.Easing.Cubic.InOut)
            .on("update", (newPosition: any) => {
                this.camera.position.set(
                    newPosition.x,
                    newPosition.y,
                    newPosition.z + 10
                );
            })
            .start();

        const targetPosition = this.controls.target.clone();
        const targetTween = new TWEEN.Tween(targetPosition)
            .to({ x, y, z }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .on("update", (newPosition: any) => {
                this.controls.target.set(
                    newPosition.x,
                    newPosition.y,
                    newPosition.z
                );
            })
            .start();
    }

    private initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x151a34, 0, 130);
        this.raycaster = new THREE.Raycaster();
        this.raycaster.near = 0;
        this.camera = new THREE.PerspectiveCamera(20, 1, 1, 500);
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(this.scene.position);
    }

    private initControls() {
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
    private createDotTexture(
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
    private getDotMaterial() {
        const fog = this.scene.fog || {};
        const uniforms = {
            textures: {
                type: "tv",
                value: [
                    this.dotTexture,
                    this.dotHoverTexture,
                    this.dotSecondaryTexture
                ]
            },
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

    private initDots() {
        const dotsGeometry = new THREE.BufferGeometry();
        const material = this.getDotMaterial();

        const verticles = new THREE.BufferAttribute(
            new Float32Array(MAX_POINTS * 3),
            3
        );

        const sizes = new THREE.BufferAttribute(
            new Float32Array(MAX_POINTS),
            1
        );

        const texIndices = new THREE.BufferAttribute(
            new Float32Array(MAX_POINTS),
            1
        );

        dotsGeometry.addAttribute("position", verticles);
        dotsGeometry.addAttribute("size", sizes);
        dotsGeometry.addAttribute("texIndex", texIndices);

        this.dots = new THREE.Points(dotsGeometry, material);
        this.dots.renderOrder = 1;
        this.scene.add(this.dots);
    }

    private initLines() {
        const lineGeometry = new THREE.BufferGeometry();

        const verticles = new THREE.BufferAttribute(
            new Float32Array(MAX_POINTS * 3),
            3
        );

        const indices = new THREE.BufferAttribute(
            new Uint32Array(MAX_POINTS * 10),
            1
        );
        // verticles.updateRange.count = MAX_POINTS * 3;
        lineGeometry.addAttribute("position", verticles);
        lineGeometry.setIndex(indices);

        this.lines = new THREE.LineSegments(
            lineGeometry,
            new THREE.LineBasicMaterial({
                color: 0x4a41d1,
                opacity: 0.7,
                transparent: true,
                depthTest: false
            })
        );
        this.lines.renderOrder = 0;
        this.scene.add(this.lines);
    }

    private updateDots() {
        this.dots.geometry.attributes.position.set(
            new Float32Array(this.positions.flat(1))
        );
        this.nodes.forEach((node: any, index: number) => {
            // this.dots.geometry.attributes.size.array[index] =
            //     Math.log((node.payload && node.payload.amount) || 1) + 2;
            // this.dots.geometry.attributes.texIndex.array[index] =
            //     node.status === "applied" ? 0.0 : 2.0;
            this.dots.geometry.attributes.size.array[index] =
                node.type === "critical" ? 5 : 3;
            this.dots.geometry.attributes.texIndex.array[index] =
                node.type === "rejected" ? 2.0 : 0.0;
        });

        this.dots.geometry.setDrawRange(0, this.positions.length || 1);
        this.dots.geometry.computeBoundingSphere();

        this.dots.geometry.attributes.size.needsUpdate = true;
        this.dots.geometry.attributes.position.needsUpdate = true;
    }
    private updateLines() {
        this.lines.geometry.attributes.position.set(
            new Float32Array(this.positions.flat(1))
        );
        // if (this.lineIndices.length) {
        // const indices = [0, 1, 0, 2, 0, 4, 0, 5, 1, 3, 2, 3, 5, 6];
        this.lines.geometry.setIndex(
            new THREE.BufferAttribute(new Uint32Array(this.lineIndices), 1)
        );
        // }

        // this.lines.geometry.setIndex(new Uint32Array(this.lineIndices));
        this.lines.geometry.setDrawRange(0, this.lineIndices.length || 1);
        this.lines.geometry.computeBoundingSphere();
        this.lines.geometry.attributes.position.needsUpdate = true;
    }

    private initRenderer() {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.autoClear = false;
        renderer.setClearColor(0x050505, 1);

        this.el.appendChild(renderer.domElement);
        this.renderer = renderer;
    }

    private onWindowResize() {
        this.width = this.el.offsetWidth;
        this.height = this.el.offsetHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    private update() {
        const length = Math.max(this.camera.position.length(), 20);
        this.scene.fog.far = length * 2;
        this.raycaster.far = length * 2.2;
        this.controls.update();

        TWEEN.update();
    }

    private render() {
        this.renderer.render(this.scene, this.camera);
    }

    private animate() {
        this.animationId = window.requestAnimationFrame(this.animate);
        this.update();
        this.render();
    }
}

const fragmentShader = `
    uniform sampler2D textures[3];
    uniform vec3 color;
    uniform vec3 fogColor;
    uniform float fogNear;
    uniform float fogFar;
    varying float vTexIndex;

    void main() {
        vec4 startColor = vec4(color, 1.0);
        vec4 finalColor;
        
        if (vTexIndex == 0.0) {
            finalColor = texture2D(textures[0], gl_PointCoord);
        } else if (vTexIndex == 1.0) {
            finalColor = texture2D(textures[1], gl_PointCoord);
        } else if (vTexIndex == 2.0) {
            finalColor = texture2D(textures[2], gl_PointCoord);
        }
    
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
    attribute float texIndex;
    varying float vTexIndex;
    void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 90.0 / length( mvPosition.xyz ) );
        vTexIndex = texIndex;
        gl_Position = projectionMatrix * mvPosition;
    }
`;
