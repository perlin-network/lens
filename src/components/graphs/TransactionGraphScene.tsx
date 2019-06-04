import * as TrackballControls from "three-trackballcontrols";
import * as THREE from "three";
import * as TWEEN from "es6-tween";
import * as _ from "lodash";
import { INode } from "./GraphStore";

const MAX_POINTS = 5000000;
export class TransactionGraphScene {
    public lineIndices: any = new Uint32Array(MAX_POINTS * 3);
    public lineIndicesCount: number = 0;
    public dashIndices: any = new Uint32Array(MAX_POINTS * 3);
    public dashIndicesCount: number = 0;

    private el: any;
    private scene: any;
    private camera: any;
    private lines: any;
    private dashes: any;
    private dots: any;
    private nodes: any = [];
    private mouse: any;
    private renderer: any;
    private raycaster: any;
    private pointCamera = _.throttle(
        positions => {
            const position = this.camera.position.clone();

            position.z -= 10;
            // this.focusedIndex = index;

            const [x, y, z] = positions;
            // const [x,y,z] = [0,0,0];

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
        },
        1200,
        {
            leading: true
        }
    );

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
    private rounds: any = {};

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

    public renderNodes(nodes: INode[], roundNum: number, prevCritical: INode) {
        this.rounds[roundNum] = {};
        this.rounds[roundNum].nodes = nodes;

        console.log("Transaction Graph Nodes #", nodes.length);
        const step = 0.75;

        let count = 0;
        const tmpPositions: number[] = [];
        const tmpTexIndices: number[] = [];
        const tmpLineIndices: number[] = [];
        const tmpSizes: number[] = [];
        const tmpDashIndices: number[] = [];
        if (prevCritical) {
            nodes.unshift(prevCritical);
        }

        const offsetId = (node: INode) => {
            if (!prevCritical) {
                return node.id;
            }
            if (node === prevCritical) {
                return 0;
            }
            return node.id + 1;
        };

        nodes.forEach(node => {
            tmpPositions[count++] = step * node.depthPos[0];
            tmpPositions[count++] = step * 1.2 * node.globalDepth;
            tmpPositions[count++] = step * node.depthPos[1];

            tmpSizes.push(node.type === "critical" ? 5 : 3);
            tmpTexIndices.push(node.type === "rejected" ? 2.0 : 0.0);

            node.children.forEach((child: any) => {
                if (node.type === "rejected" || child.type === "rejected") {
                    tmpDashIndices.push(offsetId(node));
                    tmpDashIndices.push(offsetId(child));
                } else {
                    tmpLineIndices.push(offsetId(node));
                    tmpLineIndices.push(offsetId(child));
                }
            });
        });

        const lineIndices = new Uint32Array(tmpLineIndices);
        const dashIndices = new Uint32Array(tmpDashIndices);

        const positions = new Float32Array(tmpPositions);
        const sizes = new Float32Array(tmpSizes);
        const texIndices = new Float32Array(tmpTexIndices);

        this.addDots(positions, sizes, texIndices, roundNum);
        this.addLines(positions, lineIndices, dashIndices, roundNum);
        const lastNodeIndex = nodes.length - 1;
        if (nodes[lastNodeIndex]) {
            this.pointCamera([
                positions[3 * lastNodeIndex],
                positions[3 * lastNodeIndex + 1],
                positions[3 * lastNodeIndex + 2]
            ]);
        }
    }

    public removeNodes(roundNum: number) {
        if (!this.rounds[roundNum]) {
            return;
        }

        this.scene.remove(this.rounds[roundNum].dots);
        this.scene.remove(this.rounds[roundNum].lines);
        this.scene.remove(this.rounds[roundNum].dashes);

        this.rounds[roundNum].dots.material.dispose();
        this.rounds[roundNum].lines.material.dispose();
        this.rounds[roundNum].dashes.material.dispose();

        this.rounds[roundNum].dots.geometry.dispose();
        this.rounds[roundNum].lines.geometry.dispose();
        this.rounds[roundNum].dashes.geometry.dispose();

        delete this.rounds[roundNum];
    }

    public destroy() {
        this.lines.geometry.dispose();
        this.dots.geometry.dispose();

        this.scene.dispose();
        this.renderer.dispose();
        window.cancelAnimationFrame(this.animationId);

        window.removeEventListener("resize", this.onWindowResize);
    }

    private addDots(
        positions: Float32Array,
        sizes: Float32Array,
        texIndices: Float32Array,
        roundNum: number
    ) {
        const dotsGeometry = new THREE.BufferGeometry();
        const material = this.getDotMaterial();

        const verticles = new THREE.BufferAttribute(positions, 3);
        const sizesAttr = new THREE.BufferAttribute(sizes, 1);
        const texIndicesAttr = new THREE.BufferAttribute(texIndices, 1);

        dotsGeometry.addAttribute("position", verticles);
        dotsGeometry.addAttribute("size", sizesAttr);
        dotsGeometry.addAttribute("texIndex", texIndicesAttr);

        dotsGeometry.computeBoundingSphere();

        const dots = new THREE.Points(dotsGeometry, material);
        dots.renderOrder = 1;

        this.scene.add(dots);
        this.rounds[roundNum].dots = dots;
    }

    private addLines(
        positions: Float32Array,
        lineIndices: Uint32Array,
        dashIndices: Uint32Array,
        roundNum: number
    ) {
        const lineGeometry = new THREE.BufferGeometry();
        const dashGeometry = new THREE.BufferGeometry();

        const verticles = new THREE.BufferAttribute(positions, 3);

        lineGeometry.addAttribute("position", verticles);
        dashGeometry.addAttribute("position", verticles);
        lineGeometry.setIndex(new THREE.BufferAttribute(lineIndices, 1));
        dashGeometry.setIndex(new THREE.BufferAttribute(dashIndices, 1));

        lineGeometry.computeBoundingSphere();
        dashGeometry.computeBoundingSphere();

        const lines = new THREE.LineSegments(
            lineGeometry,
            new THREE.LineBasicMaterial({
                color: 0x4a41d1,
                opacity: 0.8,
                transparent: true,
                depthTest: false
            })
        );

        const dashes = new THREE.LineSegments(
            dashGeometry,
            new THREE.LineBasicMaterial({
                color: 0x4a41d1,
                opacity: 0.4,
                transparent: true,
                depthTest: false
            })
        );

        lines.renderOrder = 0;
        dashes.renderOrder = 0;

        this.scene.add(lines);
        this.scene.add(dashes);

        this.rounds[roundNum].lines = lines;
        this.rounds[roundNum].dashes = dashes;
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

                // if (intersects.length !== 0) {
                //     const intersect = intersects.reduce(
                //         (curr: any, next: any) => {
                //             return curr.distanceToRay < next.distanceToRay
                //                 ? curr
                //                 : next;
                //         }
                //     );
                //     const index = intersect.index;
                //     const node = this.nodes[index];

                //     if (node && intersect.distanceToRay < 0.2) {
                //         const pos = [
                //             this.positions[index * 3],
                //             this.positions[index * 3 + 1],
                //             this.positions[index * 3 + 2]
                //         ];

                //         this.dots.geometry.attributes.texIndex.array[
                //             index
                //         ] = 1.0;
                //         this.dots.geometry.attributes.texIndex.needsUpdate = true;

                //         const vec = new THREE.Vector3(...pos);
                //         const out = vec.project(this.camera);

                //         const widthHalf = this.width / 2;
                //         const heightHalf = this.height / 2;

                //         const x = out.x * widthHalf + widthHalf;
                //         const y = -(out.y * heightHalf) + heightHalf;

                //         const tooltip = {
                //             x,
                //             y: y - 10,
                //             title: "Transaction",
                //             text: "nop",
                //             status: "",
                //             visible: true
                //         };

                //         // if (node.payload) {
                //         tooltip.title = node.type;
                //         tooltip.status = node.id;
                //         tooltip.text = ""; // node.payload.amount + " PERLs";
                //         // }
                //         this.setTooltipHander(tooltip);
                //         hoveredDotIndex = index;
                //         return;
                //     }
                // }
                this.setTooltipHander({
                    visible: false
                });
            }, 20),
            true
        );
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

    // private updateDots() {
    //     this.dots.geometry.attributes.position.set(this.positions);
    //     this.nodes.forEach((node: any, index: number) => {
    //         this.dots.geometry.attributes.size.array[index] =
    //             node.type === "critical" ? 5 : 3;
    //         this.dots.geometry.attributes.texIndex.array[index] =
    //             node.type === "rejected" ? 2.0 : 0.0;
    //     });

    //     this.dots.geometry.setDrawRange(0, this.nodes.length);
    //     this.dots.geometry.computeBoundingSphere();

    //     this.dots.geometry.attributes.size.needsUpdate = true;
    //     this.dots.geometry.attributes.position.needsUpdate = true;
    //     this.dots.geometry.attributes.texIndex.needsUpdate = true;
    // }
    // private updateLines() {
    //     this.lines.geometry.attributes.position.set(this.positions);
    //     this.dashes.geometry.attributes.position.set(this.positions);

    //     this.lines.geometry.setIndex(
    //         new THREE.BufferAttribute(this.lineIndices, 1)
    //     );

    //     this.dashes.geometry.setIndex(
    //         new THREE.BufferAttribute(this.dashIndices, 1)
    //     );

    //     this.dashes.geometry.setDrawRange(0, this.dashIndicesCount);
    //     this.dashes.geometry.computeBoundingSphere();
    //     this.dashes.geometry.attributes.position.needsUpdate = true;

    //     this.lines.geometry.setDrawRange(0, this.lineIndicesCount);
    //     this.lines.geometry.computeBoundingSphere();
    //     this.lines.geometry.attributes.position.needsUpdate = true;
    // }

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
