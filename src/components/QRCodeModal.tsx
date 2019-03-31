import * as React from "react";
import styled from "styled-components";
import { Box, Flex } from "@rebass/grid";
import CloseIcon from "../assets/svg/close-icon.svg";
import { QRCode } from "react-qr-svg";

interface IQRCodeModalProps {
    pubkey: string;
    onClose: () => void;
    open: boolean;
}

const Background = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    background: rgba(0, 0, 0, 0.8);
`;

const Modal = styled.div`
    position: fixed;
    top: 200px;
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

const Header = styled(Flex)`
    margin-bottom: 30px;
    display: flex;
    justify-content: flex-end;
`;

const Body = styled(Flex)`
    display: flex;
    justify-content: center;
`;

const CloseButton = styled.img.attrs({ src: CloseIcon })`
    height: 20px;
    width: 20px;
    color: #fff;
    cursor: pointer;
`;

const QRWrapper = styled.div`
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

const preventEventBubbling = (e: React.SyntheticEvent) => {
    e.stopPropagation();
};

const QRCodeModal: React.SFC<IQRCodeModalProps> = ({
    pubkey,
    onClose,
    open
}) => {
    return (
        <>
            {open && (
                <Background>
                    <Modal onClick={preventEventBubbling}>
                        <Header justifyContent="space-between">
                            <CloseButton onClick={onClose} />
                        </Header>
                        <Body>
                            <QRWrapper>
                                <QRCode value={pubkey} />
                            </QRWrapper>
                        </Body>
                    </Modal>
                </Background>
            )}
        </>
    );
};

export default QRCodeModal;
