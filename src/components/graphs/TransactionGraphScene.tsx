import * as TrackballControls from "three-trackballcontrols";
import * as THREE from "three";
import * as TWEEN from "es6-tween";
import * as _ from "lodash";
import { INode } from "./GraphStore";

const texIndicesMap = {
    accepted: 0,
    start: 1,
    critical: 1,
    applied: 1,
    rejected: 2
};
const sizeMap = {
    accepted: 3,
    start: 5,
    critical: 5,
    applied: 3,
    rejected: 3
};

export class TransactionGraphScene {
    private focusedNode: INode;
    private el: any;
    private scene: any;
    private camera: any;
    private mouse: any;
    private renderer: any;
    private raycaster: any;
    private pointCamera = _.throttle(
        (node: INode, cb?: () => void) => {
            // @ts-ignore
            this.fastPointCamera(node);
        },
        2400,
        { trailing: true }
    );

    private controls: any;
    private dotTexture: any;
    private dotAppliedTexture: any;
    private dotRejectedTexture: any;
    private dotRejectedHoverTexture: any;
    private dotHoverTexture: any;
    private dotAppliedHoverTexture: any;
    private setTooltipHander: (newValue: any) => void;
    private clickHandler: (id: string) => void;
    private width: number;
    private height: number;
    private animationId: number;
    private rounds: any = {};
    private disposeMouseEvents: () => void;

    constructor(
        container: any,
        setTooltipHander: (newValue: any) => void,
        clickHandler: (id: string) => void
    ) {
        this.el = container;
        this.dotTexture = this.createDotTexture(
            "rgba(107, 106, 131, 0.8)",
            "#0C122B"
        );
        this.dotHoverTexture = this.createDotTexture(
            "rgba(107, 106, 131, 1)",
            "#FFFFFF",
            "#6B6A83"
        );

        this.dotAppliedTexture = this.createDotTexture("#4A41D1", "#0C122B");
        this.dotAppliedHoverTexture = this.createDotTexture(
            "#4A41D1",
            "#FFFFFF",
            "#3326ff"
        );

        this.dotRejectedTexture = this.createDotTexture(
            "rgba(49, 54, 71, 0.6)",
            "rgba(49, 54, 71, 0.6)"
        );
        this.dotRejectedHoverTexture = this.createDotTexture(
            "rgba(49, 54, 71, 1)",
            "rgba(49, 54, 71, 1)"
        );

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

    /*
     *   each round will have it's own set of nodes and lines group
     *   the first node will always be the start node it overlaps the last node of the previous round
     */
    public renderNodes(nodes: INode[], roundNum: number) {
        this.rounds[roundNum] = {};
        this.rounds[roundNum].nodes = nodes;

        // nodes.length - 1 - we must ommit the startNode
        console.log("New Round Graph Nodes #", nodes.length - 1);

        let count = 0;
        const tmpPositions: number[] = [];
        const tmpTexIndices: number[] = [];
        const lineIndices: number[] = [];
        const dashIndices: number[] = [];
        const tmpSizes: number[] = [];

        nodes.forEach(node => {
            const position = this.getPos(node);
            tmpPositions[count++] = position[0];
            tmpPositions[count++] = position[1];
            tmpPositions[count++] = position[2];

            tmpSizes.push(sizeMap[node.type]);
            tmpTexIndices.push(
                node.type === "accepted"
                    ? texIndicesMap.applied
                    : texIndicesMap[node.type]
            );

            node.parents.forEach((parent: any) => {
                if (
                    node.type === "accepted" ||
                    parent.type === "accepted" ||
                    node.type === "rejected" ||
                    parent.type === "rejected"
                ) {
                    dashIndices.push(parent.id);
                    dashIndices.push(node.id);
                } else {
                    lineIndices.push(parent.id);
                    lineIndices.push(node.id);
                }
            });
        });

        const positions = new Float32Array(tmpPositions);
        const sizes = new Uint8Array(tmpSizes);
        const texIndices = new Uint8Array(tmpTexIndices);
        const verticles = new THREE.BufferAttribute(positions, 3);

        const { dots } = this.addDots(verticles, sizes, texIndices, roundNum);
        const { dashes, lines } = this.addLines(
            verticles,
            lineIndices,
            dashIndices,
            roundNum
        );
        const lastNodeIndex = nodes.length - 1;
        if (nodes[lastNodeIndex]) {
            this.pointCamera(nodes[lastNodeIndex]);
            setTimeout(() => {
                this.renderQueryPhaze(nodes, dots, lines, dashes);
            }, 1200);
        }
    }

    public renderQueryPhaze(
        nodes: INode[],
        dots: THREE.Points,
        lines: THREE.LineSegments,
        dashes: THREE.LineSegments
    ) {
        // @ts-ignore
        const texIndicesAttr = dots.geometry.attributes.texIndex;
        for (let i = 0; i < texIndicesAttr.count; i++) {
            texIndicesAttr.array[i] = texIndicesMap[nodes[i].type];
        }
        texIndicesAttr.needsUpdate = true;

        // @ts-ignore
        dashes.material = new THREE.LineBasicMaterial({
            color: 0x414554,
            opacity: 0.4,
            transparent: true,
            depthTest: false
        });
        dashes.material.needsUpdate = true;
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
        Object.values(this.rounds).forEach((round: any) => {
            round.dots.material.dispose();
            round.lines.material.dispose();
            round.dashes.material.dispose();

            round.dots.geometry.dispose();
            round.lines.geometry.dispose();
            round.dashes.geometry.dispose();
        });

        this.scene.dispose();
        this.renderer.dispose();
        window.cancelAnimationFrame(this.animationId);

        window.removeEventListener("resize", this.onWindowResize);

        if (this.disposeMouseEvents) {
            this.disposeMouseEvents();
        }
    }

    private fastPointCamera = (node: INode) => {
        const position = this.camera.position.clone();

        position.z -= 15;
        this.focusedNode = node;

        const [x, y, z] = this.getPos(node);

        /*
         *   camera and target need to be moved together
         */
        new TWEEN.Tween(position)
            .to({ x, y, z }, 2200)
            .delay(200)
            .easing(TWEEN.Easing.Cubic.InOut)
            .on("update", (newPosition: any) => {
                this.camera.position.set(
                    newPosition.x,
                    newPosition.y,
                    newPosition.z + 15 // maintains a distance between camera and where it's pointing at
                );
            })
            .start();

        const targetPosition = this.controls.target.clone();
        new TWEEN.Tween(targetPosition)
            .to({ x, y, z }, 2200)
            .easing(TWEEN.Easing.Cubic.InOut)
            .on("update", (newPosition: any) => {
                this.controls.target.set(
                    newPosition.x,
                    newPosition.y,
                    newPosition.z
                );
            })
            .start();
    };
    private addDots(
        verticles: THREE.BufferAttribute,
        sizes: Uint8Array,
        texIndices: Uint8Array,
        roundNum: number
    ) {
        const dotsGeometry = new THREE.BufferGeometry();
        const material = this.getDotMaterial();

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

        return { dots };
    }

    private getPos(node: INode) {
        const step = 1;
        return [
            step * node.depthPos[0] + node.posOffset,
            step * 1.2 * (node.globalDepth - node.posOffset),
            step * node.depthPos[1] - node.posOffset
        ];
    }

    private addLines(
        verticles: THREE.BufferAttribute,
        lineIndices: number[],
        dashIndices: number[],
        roundNum: number
    ) {
        const lineGeometry = new THREE.BufferGeometry();

        // dash line is slighly transparent line, used for connecting rejected nodes
        const dashGeometry = new THREE.BufferGeometry();

        lineGeometry.addAttribute("position", verticles);
        dashGeometry.addAttribute("position", verticles);
        lineGeometry.setIndex(lineIndices);
        dashGeometry.setIndex(dashIndices);

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

        const dashes = new THREE.LineSegments(dashGeometry, lines.material);

        lines.renderOrder = 0;
        dashes.renderOrder = 0;

        this.scene.add(lines);
        this.scene.add(dashes);

        this.rounds[roundNum].lines = lines;
        this.rounds[roundNum].dashes = dashes;

        return { lines, dashes };
    }

    private initMouseEvents() {
        this.mouse = new THREE.Vector2(1, 1);

        let hoveredNode: INode | null;

        let mouseDown: boolean = false;

        const disableHover = () => {
            if (hoveredNode) {
                const round = this.rounds[hoveredNode.round];
                if (round) {
                    round.dots.geometry.attributes.texIndex.array[
                        hoveredNode.id
                    ] = texIndicesMap[hoveredNode.type];
                    round.dots.geometry.attributes.texIndex.needsUpdate = true;
                }
                hoveredNode = null;

                this.setTooltipHander({
                    visible: false
                });
            }
        };

        const onKeyDown = (event: any) => {
            let round;
            let node;

            if (!this.focusedNode) {
                return;
            }
            const focusedRound = this.rounds[this.focusedNode.round];

            if (event.key === "ArrowDown") {
                event.preventDefault();
                round = this.rounds[this.focusedNode.round - 1];
                node = focusedRound.nodes[0];
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                if (this.focusedNode.depth !== -1) {
                    round = this.rounds[this.focusedNode.round + 1];
                }

                node = focusedRound.nodes[focusedRound.nodes.length - 1];
            }

            if (round) {
                const lastNodeIndex = round.nodes.length - 1;
                node = round.nodes[lastNodeIndex] || node;
            }

            if (node) {
                this.fastPointCamera(node);
            }
        };
        window.addEventListener("keydown", onKeyDown);

        const onMouseDown = (event: any) => {
            mouseDown = true;
        };

        const onMouseOut = (event: any) => {
            mouseDown = false;
            disableHover();
        };

        const onMouseUp = (event: any) => {
            mouseDown = false;
            if (!hoveredNode) {
                return;
            }

            if (this.focusedNode === hoveredNode && hoveredNode.txId) {
                this.clickHandler(hoveredNode.txId);
            } else {
                this.pointCamera(hoveredNode);
            }
            disableHover();
        };

        const onMouseMove = _.debounce((event: any) => {
            disableHover();
            if (mouseDown) {
                return;
            }

            const { left, top } = this.el.getBoundingClientRect();
            const clientX = event.clientX - left;
            const clientY = event.clientY - top;

            this.mouse.x = (clientX / this.width) * 2 - 1;
            this.mouse.y = -(clientY / this.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);

            const checkDots = (dots: any, nodes: INode[]) => {
                const intersects = this.raycaster.intersectObject(dots);

                if (intersects.length !== 0) {
                    const intersect = intersects.reduce(
                        (curr: any, next: any) => {
                            return curr.distanceToRay < next.distanceToRay
                                ? curr
                                : next;
                        }
                    );
                    const index = intersect.index;
                    const node = nodes[index];

                    if (node && intersect.distanceToRay < 0.2) {
                        const pos = this.getPos(node);

                        dots.geometry.attributes.texIndex.array[index] += 3.0;
                        dots.geometry.attributes.texIndex.needsUpdate = true;

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
                            text: `id: ${node.id}`,
                            status: node.type,
                            visible: true
                        };

                        this.setTooltipHander(tooltip);
                        hoveredNode = node;
                        return true;
                    }
                }
                this.setTooltipHander({
                    visible: false
                });
                return false;
            };

            Object.values(this.rounds).some((round: any) => {
                return checkDots(round.dots, round.nodes);
            });
        }, 20);

        this.el.addEventListener("mousedown", onMouseDown, true);
        this.el.addEventListener("mouseout", onMouseOut, true);
        this.el.addEventListener("mouseup", onMouseUp, true);
        this.el.addEventListener("mousemove", onMouseMove, true);

        this.disposeMouseEvents = () => {
            this.el.removeEventListener("mousedown", onMouseDown);
            this.el.removeEventListener("mouseout", onMouseOut);
            this.el.removeEventListener("mouseup", onMouseUp);
            this.el.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("keydown", onKeyDown);
        };
    }

    private initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x151a34, 0, 130);
        this.raycaster = new THREE.Raycaster();
        this.raycaster.near = 0;
        this.camera = new THREE.PerspectiveCamera(20, 1, 1, 1000);
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
        controls.staticMoving = false;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [65, 17, 16];
        this.controls = controls;
    }
    private createDotTexture(
        fillColor: string,
        strokeColor: string,
        glow?: string
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
                matContext.shadowColor = glow;
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
                    this.dotAppliedTexture,
                    this.dotRejectedTexture,

                    this.dotHoverTexture,
                    this.dotAppliedHoverTexture,
                    this.dotRejectedHoverTexture
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
    uniform sampler2D textures[6];
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
        } else if (vTexIndex == 3.0) {
            finalColor = texture2D(textures[3], gl_PointCoord);
        } else if (vTexIndex == 4.0) {
            finalColor = texture2D(textures[4], gl_PointCoord);
        } else if (vTexIndex == 5.0) {
            finalColor = texture2D(textures[5], gl_PointCoord);
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
