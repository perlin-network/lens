import * as React from "react";
import styled from "styled-components";
import { Box, Flex } from "@rebass/grid";
import CloseIcon from "../../assets/svg/close-icon.svg";
import QrIcon from "../../assets/svg/qr-icon.svg";
import { QRCode } from "react-qr-svg";
import { useState } from "react";

interface IQRCodeModalProps {
    publicKeyHex: string;
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

const Modal = styled.div<{ top: number }>`
    position: fixed;
    top: ${props => props.top}px;
    left: 50%;
    width: 565px;

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
    display: flex;
    justify-content: flex-end;
`;

const ModalBody = styled(Flex)`
    display: flex;
    justify-content: center;
`;

const QRModalWrapper = styled.div`
    border: none;
    text-decoration: none;
    height: 250px;
    width: 250px;
    background-color: white;
    border-radius: 50%;
    padding: 50px 50px 50px 50px;
    margin-bottom: 25px;

    & > * {
        height: auto;
        width: auto;
    }
`;

const QrCodeIcon = styled.img.attrs({ src: QrIcon })`
    height: 64px;
    width: 64px;
`;

const ModalCloseButton = styled.img.attrs({ src: CloseIcon })`
    height: 20px;
    width: 20px;
    color: #fff;
    cursor: pointer;
`;

const QRCodeModal: React.FunctionComponent<IQRCodeModalProps> = ({
    publicKeyHex,
    onClose,
    open,
    top = 200
}) => {
    const preventEventBubbling = (e: React.SyntheticEvent) => {
        e.stopPropagation();
    };

    return (
        <>
            {open && (
                <ModalBackdrop>
                    <Modal top={top} onClick={preventEventBubbling}>
                        <ModalHeader justifyContent="space-between">
                            <ModalCloseButton onClick={onClose} />
                        </ModalHeader>
                        <ModalBody>
                            <QRModalWrapper>
                                <QRCode value={publicKeyHex} />
                            </QRModalWrapper>
                        </ModalBody>
                    </Modal>
                </ModalBackdrop>
            )}
        </>
    );
};

interface IQRCodeWidgetProps {
    publicKeyHex: string;
    width?: number;
    height?: number;
    clickable?: boolean;
    top?: number;
}

const QRWidgetWrapper = styled.button<{
    width: number;
    height: number;
    clickable: boolean;
}>`
    border: none;
    text-align: center;
    text-decoration: none;
    ${props => props.clickable && `cursor: pointer;`}
    
    height: ${props => props.height}px;
    width: ${props => props.width}px;
    margin: 8px 0px 8px 0px;
    background-color: white;
    border-radius: 50%;

    & > * {
        width: 80%;
        width: ${props => (props.width <= 51 ? "80%" : "65%")};
        height: ${props => (props.height <= 51 ? "80%" : "65%")};
        vertical-align: middle;
    }

    &:focus {
        outline: none;
    }

    ${props =>
        props.clickable &&
        `&:hover {
            opacity: 0.8;
        }`}

    
`;

const QRCodeWidget: React.FunctionComponent<IQRCodeWidgetProps> = ({
    publicKeyHex,
    width,
    height,
    clickable = false,
    top = 200
}) => {
    const [qrmodalOpen, setQrmodalOpen] = useState(false);
    const handleClose = () => {
        setQrmodalOpen(false);
    };

    const showQrModal = () => {
        setQrmodalOpen(true);
    };

    const size = {
        width: width === undefined ? 50 : width,
        height: height === undefined ? 50 : height
    };
    return (
        <>
            <QRWidgetWrapper
                onClick={showQrModal}
                width={size.width}
                height={size.height}
                clickable={clickable}
            >
                {size.height <= 51 && size.width <= 51 ? (
                    <QrCodeIcon />
                ) : (
                    <QRCode value={publicKeyHex} />
                )}
            </QRWidgetWrapper>

            {clickable && (
                <QRCodeModal
                    open={qrmodalOpen}
                    onClose={handleClose}
                    publicKeyHex={publicKeyHex}
                    top={top}
                />
            )}
        </>
    );
};

export { QRCodeModal, QRCodeWidget };
