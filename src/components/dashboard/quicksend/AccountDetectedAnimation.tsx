import React, { useEffect, useRef, useState, CSSProperties } from "react";
import { Transition } from "react-transition-group";
import {
    useSlideDown,
    usePopIn,
    usePushDown
} from "../../common/animationHooks";
import styled from "styled-components";

const duration = 400;
const easing = "cubicBezier(0.0, 0.0, 0.2, 1)";

const Wrapper = styled.div`
    transform-style: preserve-3d;

    /* safari - some elements still appear even when container is closed */
    .push-down {
        opacity: 0;
    }

    .push-down-entering,
    .push-down-exiting,
    .push-down-entered {
        opacity: 1;
    }
`;

interface IAnimationProps {
    in: boolean;
    key?: string;
}

const AccountDetectedAnimation: React.SFC<IAnimationProps> = ({
    in: inProp,
    key,
    children
}) => {
    const ref = useRef(null);
    const [state, setState] = useState("");

    const [defaultStyle] = useSlideDown(state, ref, { duration, easing });

    return (
        <Transition in={inProp} key={key} timeout={duration}>
            {(transitionState: string) => {
                setState(transitionState);
                return (
                    <Wrapper>
                        <div
                            className={"push-down push-down-" + transitionState}
                            style={{ ...defaultStyle }}
                            ref={ref}
                        >
                            {children}
                        </div>
                    </Wrapper>
                );
            }}
        </Transition>
    );
};

export default AccountDetectedAnimation;
