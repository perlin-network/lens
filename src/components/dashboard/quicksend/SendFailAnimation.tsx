import React, { useEffect, useRef, useState, CSSProperties } from "react";
import { Transition } from "react-transition-group";
import { usePushDown } from "../../common/animationHooks";
import styled from "styled-components";

const duration = 400;

const Wrapper = styled.div`
    transform-style: preserve-3d;
`;

interface IAnimationProps {
    in: boolean;
}

const SendFailAnimation: React.SFC<IAnimationProps> = ({
    in: inProp,
    children
}) => {
    const ref = useRef(null);
    const [state, setState] = useState("");

    const [defaultStyle] = usePushDown(state, ref, { duration });

    return (
        <Transition in={inProp} timeout={duration}>
            {(transitionState: string) => {
                setState(transitionState);
                return (
                    <Wrapper>
                        <div style={defaultStyle} ref={ref}>
                            {children}
                        </div>
                    </Wrapper>
                );
            }}
        </Transition>
    );
};

export default SendFailAnimation;
