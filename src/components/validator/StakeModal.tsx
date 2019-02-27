import * as React from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import CloseIcon from "../../assets/svg/close-icon.svg";
import { InfoIcon } from "../common/typography";

export enum StakeModalActions {
    Place,
    Withdraw
}

interface IStakeModalProps {
    open: boolean;
    action: StakeModalActions;
    onClose: () => void;
    balance: number;
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
const HeaderTitle = styled.h1`
    margin: 0;
    font-size: 22px;
    font-family: HKGrotesk;
    font-weight: normal;
    color: #fff;
`;

const CloseButton = styled.img.attrs({ src: CloseIcon })`
    height: 20px;
    width: 20px;
    color: #fff;
    cursor: pointer;
`;

interface IBodyTitleProps {
    color?: string;
}
const BodyTitle = styled.h2`
    margin: 0;
    font-family: HKGrotesk;
    font-size: 14px;
    font-weight: normal;
    color: ${(props: IBodyTitleProps) => props.color};
    margin-bottom: 15px;
`;
BodyTitle.defaultProps = {
    color: "#172772"
};

const Header = styled(Flex)`
    margin-bottom: 30px;
`;
const Body = styled(Flex)``;
const BalanceWrapper = styled(Box)`
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    background-color: #fff;
    padding-top: 18px;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 10px;
`;
const BalanceText = styled.h3`
    margin: 0;
    display: flex;
    align-items: center;
    font-family: HKGrotesk;
    font-size: 26px;
    font-weight: normal;
    color: #172772;
`;

const StakeModal: React.SFC<IStakeModalProps> = ({
    open,
    onClose,
    balance
}) => {
    const preventEventBubbling = (e: React.SyntheticEvent) => {
        e.stopPropagation();
    };

    return createPortal(
        <>
            {open && (
                <Background onClick={onClose}>
                    <Modal onClick={preventEventBubbling}>
                        <Header justifyContent="space-between">
                            <HeaderTitle>Select to add more stake</HeaderTitle>
                            <CloseButton onClick={onClose} />
                        </Header>
                        <Body flexDirection="column">
                            <BalanceWrapper width={1 / 2}>
                                <BodyTitle>Wallet balance</BodyTitle>
                                <BalanceText>
                                    <InfoIcon size="29px" />
                                    {balance}
                                </BalanceText>
                            </BalanceWrapper>
                        </Body>
                    </Modal>
                </Background>
            )}
        </>,
        document.body
    );
};

export default StakeModal;
