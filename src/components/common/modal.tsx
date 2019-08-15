import React, { useCallback } from "react";
import styled from "styled-components";
import { Box, Flex } from "@rebass/grid";
import CloseIcon from "../../assets/svg/close-icon.svg";
import QrIcon from "../../assets/svg/qr-icon.svg";
import { QRCode } from "react-qr-svg";
import { useState } from "react";

interface IModalProps {
    onClose: () => void;
    open: boolean;
    top?: number;
}

const ModalBackdrop = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    background: rgba(0, 0, 0, 0.8);
`;

const ModalWrapper = styled.div<{ top: number }>`
    position: fixed;
    top: ${props => props.top}px;
    left: 50%;
    width: 565px;
    color: #fff;
    min-height: 300px;
    margin-left: -282.5px;
    padding: 25px 20px;
    background-color: #171d39;
    border-radius: 3px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    z-index: 11;
`;

const ModalHeader = styled(Flex)`
    margin-bottom: 30px;
    justify-content: flex-end;
`;

const ModalBody = styled.div``;

const ModalCloseButton = styled.img.attrs({ src: CloseIcon })`
    height: 20px;
    width: 20px;
    color: #fff;
    cursor: pointer;
`;

const Modal: React.FunctionComponent<IModalProps> = ({
    onClose,
    open,
    top = 200,
    children
}) => {
    const preventEventBubbling = useCallback((e: React.SyntheticEvent) => {
        e.stopPropagation();
    }, []);

    return (
        <>
            {open && (
                <ModalBackdrop>
                    <ModalWrapper top={top} onClick={preventEventBubbling}>
                        <ModalHeader justifyContent="space-between">
                            <ModalCloseButton onClick={onClose} />
                        </ModalHeader>
                        <ModalBody>{children}</ModalBody>
                    </ModalWrapper>
                </ModalBackdrop>
            )}
        </>
    );
};

export default Modal;
