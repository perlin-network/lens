import * as React from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Flex } from "@rebass/grid";
import CloseIcon from "../../assets/svg/close-icon.svg";

export enum StakeModalActions {
    Place,
    Withdraw
}

interface IStakeModalProps {
    open: boolean;
    action: StakeModalActions;
    onClose: () => void;
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
    background-color: #15266c;
    border-radius: 3px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    z-index: 11;
`;
const Header = styled(Flex)``;
const CloseButton = styled.img.attrs({ src: CloseIcon })`
    height: 20px;
    width: 20px;
    color: #fff;
    cursor: pointer;
`;
const Title = styled.h1`
    margin: 0;
    font-size: 22px;
    font-family: HKGrotesk;
    font-weight: normal;
    color: #fff;
`;

const StakeModal: React.SFC<IStakeModalProps> = ({ open, onClose }) => {
    const preventEventBubbling = (e: React.SyntheticEvent) => {
        e.stopPropagation();
    };

    return createPortal(
        <>
            {open && (
                <Background onClick={onClose}>
                    <Modal onClick={preventEventBubbling}>
                        <Header justifyContent="space-between">
                            <Title>Select to add more stake</Title>
                            <CloseButton onClick={onClose} />
                        </Header>
                    </Modal>
                </Background>
            )}
        </>,
        document.body
    );
};

export default StakeModal;
