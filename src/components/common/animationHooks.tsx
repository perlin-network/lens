import { useRef, CSSProperties, useEffect } from "react";
import anime from "animejs";

const defaultEasing = "cubicBezier(0.365, 0.580, 0.620, 1.850)";

export interface IPushDownConfig {
    duration: number;
    defaultStyle: CSSProperties;
    easing: string;
}

export const usePushDown = (
    state: string,
    ref: any,
    configOverrides: Partial<IPushDownConfig> = {}
) => {
    const elHeight = useRef(0);

    const config: IPushDownConfig = {
        duration: 300,
        easing: "easeOutQuad",
        defaultStyle: {
            overflow: "hidden"
        },
        ...configOverrides
    };

    useEffect(() => {
        anime({
            targets: ref.current,
            maxHeight: (el: HTMLElement) => {
                switch (state) {
                    case "entering":
                    case "entered":
                        return elHeight.current;
                    case "":
                        elHeight.current = el.offsetHeight;
                    default:
                        return 0;
                }
            },
            duration: () => {
                switch (state) {
                    case "entering":
                    case "entered":
                        return config.duration * 1;
                    default:
                        return config.duration * 0.9;
                }
            },
            easing: config.easing
        });
    }, [state]);
    return [config.defaultStyle];
};

export interface IPopInConfig {
    duration: number;
    defaultStyle: CSSProperties;
    fromZ: number | string;
    toZ: number | string;
    fromY: number | string;
    toY: number | string;
    easing: string;
}

export const usePopIn = (
    state: string,
    ref: any,
    configOverrides: Partial<IPopInConfig> = {}
) => {
    const config: IPopInConfig = {
        duration: 200,
        defaultStyle: {},
        fromZ: 0,
        toZ: 20,
        fromY: 0,
        toY: 0,
        easing: defaultEasing,
        ...configOverrides
    };

    useEffect(() => {
        anime({
            targets: ref.current,
            translateZ: (el: HTMLElement) => {
                switch (state) {
                    case "entering":
                    case "entered":
                        return config.toZ;
                    default:
                        return config.fromZ;
                }
            },
            translateY: (el: HTMLElement) => {
                switch (state) {
                    case "entering":
                    case "entered":
                        return config.toY;
                    default:
                        return config.fromY;
                }
            },
            duration: () => {
                switch (state) {
                    case "entering":
                    case "entered":
                        return config.duration * 1;
                    default:
                        return config.duration * 0.9;
                }
            },
            easing: config.easing
        });
    }, [state]);

    return [config.defaultStyle];
};

export interface ISlideDownConfig {
    duration: number;
    defaultStyle: CSSProperties;
    fromY: number | string;
    toY: number | string;
    fromZ: number | string;
    toZ: number | string;
    easing: string;
}
export const useSlideDown = (
    state: string,
    ref: any,
    configOverrides: Partial<ISlideDownConfig> = {}
) => {
    const config: ISlideDownConfig = {
        duration: 200,
        defaultStyle: {
            overflow: "hidden",
            willChange: "height"
        },
        fromY: -10,
        toY: 0,
        fromZ: 0,
        toZ: 0,
        easing: defaultEasing,
        ...configOverrides
    };

    const elHeight = useRef(0);

    useEffect(() => {
        anime({
            targets: ref.current,
            translateY: (el: HTMLElement) => {
                switch (state) {
                    case "entering":
                    case "entered":
                        return config.toY;
                    case "exiting":
                        return 0;
                    case "exited":
                        return 0;
                    default:
                        return config.fromY;
                }
            },
            translateZ: (el: HTMLElement) => {
                switch (state) {
                    case "entering":
                    case "entered":
                        return config.toZ;
                    default:
                        return config.fromZ;
                }
            },
            maxHeight: (el: HTMLElement) => {
                switch (state) {
                    case "entering":
                    case "entered":
                        return elHeight.current;
                    case "":
                        elHeight.current = el.offsetHeight + 100;
                    default:
                        return 0;
                }
            },
            duration: () => {
                switch (state) {
                    case "entering":
                    case "entered":
                        return config.duration * 1;
                    default:
                        return config.duration * 0.9;
                }
            },
            easing: config.easing
        });
    }, [state]);

    return [config.defaultStyle];
};
