import * as TrackballControls from "three-trackballcontrols";
import * as THREE from "three";
import * as TWEEN from "es6-tween";
import * as _ from "lodash";
import { INode } from "./GraphStore";

const texIndicesMap = {
    start: 0,
    critical: 0,
    applied: 0,
    rejected: 1
};
export class TransactionGraphScene {
    private focusedNode: INode;
    private el: any;
    private scene: any;
    private camera: any;
    private mouse: any;
    private time: number = 0;
    private renderer: any;
    private raycaster: any;
    private dotMaterial: any;
    private cameraSpeed: number;
    private lineMaterial: any;
    private dashMaterial: any;
    private pointRound: (node: INode, roundNum: number) => void;

    private controls: any;
    private dotAppliedTexture: any;
    private dotRejectedTexture: any;
    private dotRejectedHoverTexture: any;
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
        clickHandler: (id: string) => void,
        cameraSpeed: number
    ) {
        this.cameraSpeed = cameraSpeed;

        this.initRoundPointer();
        this.el = container;
        this.dotAppliedTexture = this.createDotTexture("#4A41D1", "#0C122B");
        this.dotAppliedHoverTexture = this.createDotTexture(
            "#4A41D1",
            "#FFFFFF",
            "#3326ff"
        );

        this.dotRejectedTexture = this.createDotTexture(
            "rgba(49, 54, 71, 0.8)",
            "rgba(49, 54, 71, 0.8)"
        );
        this.dotRejectedHoverTexture = this.createDotTexture(
            "rgba(49, 54, 71, 1)",
            "rgba(49, 54, 71, 1)"
        );

        this.setTooltipHander = setTooltipHander;
        this.clickHandler = clickHandler;

        this.initScene();
        this.dotMaterial = this.getDotMaterial();
        this.lineMaterial = this.getLineMaterial(0x4a41d1, 0.8);
        this.dashMaterial = this.getLineMaterial(0x414554, 0.6);
        this.initRenderer();

        this.initControls();
        setTimeout(() => {
            this.onWindowResize();
            this.initMouseEvents();
            this.animate();
        }, 200);

        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        window.addEventListener("resize", this.onWindowResize, false);
    }

    public async renderNodes(
        info: any,
        roundNum: number,
        cb?: (params?: any) => void
    ) {
        const nodes = info.nodes;
        this.rounds[roundNum] = {};
        this.rounds[roundNum].nodes = nodes;

        // nodes.length - 1 - we must ommit the startNode
        console.log("New Round Graph Nodes #", nodes.length - 1);

        const positions = new Float32Array(info.positions);
        const sizes = new Uint8Array(info.sizes);
        const showTimes = new THREE.BufferAttribute(
            new Float32Array(info.showTimes),
            1
        );

        const rounds = new THREE.BufferAttribute(
            new Float32Array(nodes.length).fill(roundNum),
            1
        );
        const texIndices = new Uint8Array(info.texIndices);
        const verticles = new THREE.BufferAttribute(positions, 3);

        const { dots } = this.addDots(
            verticles,
            sizes,
            texIndices,
            showTimes,
            roundNum,
            rounds
        );
        const { dashes } = this.addLines(
            verticles,
            info.lineIndices,
            info.dashIndices,
            showTimes,
            roundNum,
            rounds
        );
        const lastNodeIndex = nodes.length - 1;
        if (nodes[lastNodeIndex]) {
            setTimeout(() => {
                this.renderQueryPhaze(nodes, dots, dashes);
            }, this.cameraSpeed * 0.75);
            await this.pointRound(nodes[lastNodeIndex], roundNum);
            if (cb) {
                cb();
            }
        }
    }

    /*
     *   each round will have it's own set of nodes and lines group
     *   the first node will always be the start node it overlaps the last node of the previous round
     */
    public renderQueryPhaze(
        nodes: INode[],
        dots: THREE.Points,
        dashes: THREE.LineSegments
    ) {
        // @ts-ignore
        const texIndicesAttr = dots.geometry.attributes.texIndex;
        for (let i = 0; i < texIndicesAttr.count; i++) {
            texIndicesAttr.array[i] = texIndicesMap[nodes[i].type];
        }

        texIndicesAttr.needsUpdate = true;
        dashes.material = this.dashMaterial;
        // @ts-ignore
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
        return new Promise(resolve => {
            const position = this.camera.position.clone();
            this.focusedNode = node;

            const cameraSpeed = this.cameraSpeed;
            const [x, y, z] = node.position;

            /*
             *   camera and target need to be moved together
             */
            new TWEEN.Tween(position)
                .to({ x, y, z: z + 15 }, cameraSpeed)
                // .delay(cameraSpeed * 1) // delaying the camera allows for a breif overview of the upcoming structure
                // .easing(TWEEN.Easing.Sinusoidal.In)
                .on("update", (newPosition: any) => {
                    this.camera.position.set(
                        newPosition.x,
                        newPosition.y,
                        newPosition.z
                    );
                })
                .on("complete", () => {
                    setTimeout(resolve, 300);
                })
                .start();

            const targetPosition = this.controls.target.clone();
            new TWEEN.Tween(targetPosition)
                .to({ x, y, z }, cameraSpeed)
                // .easing(TWEEN.Easing.Quadratic.In)
                .on("update", (newPosition: any) => {
                    this.controls.target.set(
                        newPosition.x,
                        newPosition.y,
                        newPosition.z
                    );
                })
                .start();
        });
    };

    private initRoundPointer() {
        // after each round the camera will point to the last critical node
        this.pointRound = (node: INode, roundNum: number) => {
            // each node should start appearing at startTime + node delay
            this.dotMaterial.uniforms.startTime.value = this.time;
            this.lineMaterial.uniforms.startTime.value = this.time;
            this.dashMaterial.uniforms.startTime.value = this.time;

            // using showRound we can kepp previous round nodes visible
            this.dotMaterial.uniforms.showRound.value = roundNum;
            this.lineMaterial.uniforms.showRound.value = roundNum;
            this.dashMaterial.uniforms.showRound.value = roundNum;

            // @ts-ignore
            return this.fastPointCamera(node);
        };
    }

    // addDots - adds visual representation of nodes
    private addDots(
        verticles: THREE.BufferAttribute,
        sizes: Uint8Array,
        texIndices: Uint8Array,
        showTimes: THREE.BufferAttribute,
        roundNum: number,
        rounds: THREE.BufferAttribute
    ) {
        const dotsGeometry = new THREE.BufferGeometry();

        const sizesAttr = new THREE.BufferAttribute(sizes, 1);
        const texIndicesAttr = new THREE.BufferAttribute(texIndices, 1);

        dotsGeometry.addAttribute("position", verticles);
        dotsGeometry.addAttribute("size", sizesAttr);
        dotsGeometry.addAttribute("texIndex", texIndicesAttr);
        dotsGeometry.addAttribute("showTime", showTimes); // delay at which the node will appear
        dotsGeometry.addAttribute("round", rounds); // used to keep previous round nodes visible

        dotsGeometry.computeBoundingSphere();

        const dots = new THREE.Points(dotsGeometry, this.dotMaterial);
        dots.renderOrder = 1;

        this.scene.add(dots);
        this.rounds[roundNum].dots = dots;

        return { dots };
    }

    // addLines - adds visual representation of node relationships
    private addLines(
        verticles: THREE.BufferAttribute,
        lineIndices: number[],
        dashIndices: number[],
        showTimes: THREE.BufferAttribute,
        roundNum: number,
        rounds: THREE.BufferAttribute
    ) {
        const lineGeometry = new THREE.BufferGeometry();

        // dash line is slighly transparent line, used for connecting rejected nodes
        const dashGeometry = new THREE.BufferGeometry();

        lineGeometry.addAttribute("position", verticles);
        lineGeometry.addAttribute("showTime", showTimes); // delay at which the line will appear
        lineGeometry.addAttribute("round", rounds); // used to keep previous lines nodes visible

        // lines which connect rejected nodes
        dashGeometry.addAttribute("position", verticles);
        dashGeometry.addAttribute("showTime", showTimes); // delay at which the line will appear
        dashGeometry.addAttribute("round", rounds); // used to keep previous lines nodes visible

        lineGeometry.setIndex(lineIndices);
        dashGeometry.setIndex(dashIndices);

        lineGeometry.computeBoundingSphere();
        dashGeometry.computeBoundingSphere();

        const lines = new THREE.LineSegments(lineGeometry, this.lineMaterial);
        const dashes = new THREE.LineSegments(dashGeometry, this.lineMaterial);

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

        // onKeyDown - scrolls to next/previous critical node
        const onKeyDown = (event: any) => {
            let round;
            let node;

            if (!this.focusedNode) {
                return;
            }
            const focusedRound = this.rounds[this.focusedNode.round];

            if (!focusedRound) {
                return;
            }
            if (event.key === "ArrowDown") {
                event.preventDefault();
                round = this.rounds[this.focusedNode.round - 1];
                node = focusedRound.nodes[0];
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                if (this.focusedNode.type !== "start") {
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
            debugger;
            if (this.focusedNode === hoveredNode && hoveredNode.txId) {
                this.clickHandler(hoveredNode.txId);
            } else {
                this.fastPointCamera(hoveredNode);
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

            // sends a ray to intersect node beneath the mouse pointer
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
                        const pos = node.position;

                        dots.geometry.attributes.texIndex.array[index] += 2.0; // switches to hover version material
                        dots.geometry.attributes.texIndex.needsUpdate = true;

                        const vec = new THREE.Vector3(...pos);
                        const out = vec.project(this.camera);

                        const widthHalf = this.width / 2;
                        const heightHalf = this.height / 2;

                        // projects 3D position onto 2D to be sent to the external tooltip element
                        const x = out.x * widthHalf + widthHalf;
                        const y = -(out.y * heightHalf) + heightHalf;

                        const tooltip: any = {
                            x,
                            y: y - 10,
                            title: "Transaction",
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
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(this.scene.position);
    }

    private initControls() {
        const controls = new TrackballControls(this.camera, this.el);
        controls.rotateSpeed = 1;
        controls.zoomSpeed = 1;
        controls.panSpeed = 1;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = false;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [65, 17, 16];
        this.controls = controls;
    }

    // createDotTexture - draws a 2D canvas image to be used as dot texture
    private createDotTexture(
        fillColor: string,
        strokeColor: string,
        glow?: string // a glow appears on node hover
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

    // getDotMaterial - generates a shader material in order to gradually show dots
    private getDotMaterial() {
        const fog = this.scene.fog || {};
        const uniforms = {
            textures: {
                type: "tv",
                value: [
                    this.dotAppliedTexture,
                    this.dotRejectedTexture,
                    this.dotAppliedHoverTexture,
                    this.dotRejectedHoverTexture
                ]
            },
            time: { value: 0 }, // shader's timestamp
            startTime: { value: 0 }, // repesentes the base time on which each node delay added
            showRound: { value: 0 }, // indicates which round is being revealed
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

    // getLineMaterial - generates a shader material in order to gradually show lines
    private getLineMaterial(color: number, opacity: number) {
        const fog = this.scene.fog || {};

        const uniforms = {
            time: { value: 0 }, // shader's timestamp
            startTime: { value: 0 }, // updates at every pointRound
            showRound: { value: 0 }, // indicates which round is being revealed
            color: { type: "c", value: new THREE.Color(color) },
            fog: true,
            fogColor: { type: "c", value: fog.color },
            fogNear: { type: "f", value: fog.near },
            fogFar: { type: "f", value: fog.far }
        };

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: lineVertexShader,
            fragmentShader: lineFragmentShader,
            alphaTest: 0.01,
            opacity,
            transparent: true,
            depthTest: false
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
        this.controls.update();

        // updates the current timestamp inside the shader
        this.dotMaterial.uniforms.time.value = this.time;
        this.lineMaterial.uniforms.time.value = this.time;
        this.dashMaterial.uniforms.time.value = this.time;
        TWEEN.update();
    }

    private render() {
        this.renderer.render(this.scene, this.camera);
    }

    private animate(time: number = 0) {
        this.animationId = window.requestAnimationFrame(this.animate);
        this.time = time;
        this.update();
        this.render();
    }
}

const lineFragmentShader = `
    uniform vec3 color;
    uniform vec3 fogColor;
    uniform float fogNear;
    uniform float time;
    uniform float fogFar;
    uniform float startTime;
    uniform float showRound;
    varying float vShowTime;
    varying float vRound;

    void main() {
        float opacity = 0.0;
        
        if (vRound < showRound || (startTime + vShowTime < time)) {
            opacity = 0.8;
        }

        if (vRound > showRound) {
            opacity = 0.0;
        }
        

        gl_FragColor = vec4(color, opacity);

        #ifdef ALPHATEST
            if ( gl_FragColor.a < ALPHATEST ) 
                discard;
        #endif

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

const lineVertexShader = `
    attribute float showTime;
    attribute float round;
    varying float vShowTime;
    varying float vRound;

    void main() 
    {
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        vShowTime = showTime;
        vRound = round;

        gl_Position = projectionMatrix * modelViewPosition;
    }
`;
const fragmentShader = `
    uniform sampler2D textures[4];
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
    uniform float time;
    uniform float startTime;
    uniform float showRound;
    attribute float size;
    attribute float texIndex;
    attribute float showTime;
    attribute float round;
    varying float vTexIndex;

    void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        
        if (round < showRound || ( startTime + showTime < time )) {
            gl_PointSize = size * ( 90.0 / length( mvPosition.xyz ) );
        } else {
            gl_PointSize = 0.0;
        }

        if (round > showRound) {
            gl_PointSize = 0.0;
        }
        
        vTexIndex = texIndex;
        
        gl_Position = projectionMatrix * mvPosition;
    }
`;
