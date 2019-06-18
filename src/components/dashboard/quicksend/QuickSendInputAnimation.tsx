import React, { useRef, useState } from "react";
import { Transition } from "react-transition-group";
import { usePopIn } from "../../common/animationHooks";
import styled from "styled-components";

const duration = 400;
const easing = "cubicBezier(0.0, 0.0, 0.0, 2.2)";

const Wrapper = styled.div`
    /* firefox - needs this on any element to apply perspective */
    transform-style: preserve-3d;
`;

interface IAnimationProps {
    in: boolean;
}

const QuickSendInputAnimation: React.SFC<IAnimationProps> = ({
    in: inProp,
    children
}) => {
    const ref = useRef(null);
    const [state, setState] = useState("");

    const [defaultStyle] = usePopIn(state, ref, { duration, easing });

    return (
        <Wrapper>
            <div style={defaultStyle} ref={ref}>
                {children}
            </div>
        </Wrapper>
    );
};

export default QuickSendInputAnimation;
