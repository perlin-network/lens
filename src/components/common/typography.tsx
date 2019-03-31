import styled from "styled-components";
import PerlMiniIcon from "../../assets/svg/perl-mini-icon.svg";
import PencilEditIcon from "../../assets/svg/pencil-edit-button.svg";
import QuestionAlertIcon from "../../assets/svg/alert-question.svg";
import DataCardEarningsIcon from "../../assets/svg/datacard-earnings.svg";
import DataCardNetworkIcon from "../../assets/svg/datacard-network.svg";
import DataCardStakeIcon from "../../assets/svg/datacard-stake.svg";
import DataCardWalletIcon from "../../assets/svg/datacard-wallet.svg";
import QuickSendFailIcon from "../../assets/svg/quicksend-error.svg";
import DataCopyIcon from "../../assets/svg/copy-icon.svg";

const SectionTitle = styled.h2`
    font-family: HKGrotesk;
    font-size: 16px;
    color: #fff;
    margin-bottom: 15px;
    font-weight: 500;
`;

interface InfoIconProps {
    size?: string;
}
const InfoIcon = styled.img.attrs({ src: PerlMiniIcon })`
    height: ${(props: InfoIconProps) => props.size};
    width: ${(props: InfoIconProps) => props.size};
    margin-right: 5px;
`;
InfoIcon.defaultProps = {
    size: "20px"
};

const EditIcon = styled.img.attrs({ src: PencilEditIcon })`
    height: 80%;
    max-width: 30px;
    vertical-align: centre;
`;

const QuestionIcon = styled.img.attrs({ src: QuestionAlertIcon })`
    max-height: 120px;
    max-width: 120px;
`;

const EarningsIcon = styled.img.attrs({ src: DataCardEarningsIcon })`
    max-height: 24px;
    max-width: 24px;
`;
const WalletIcon = styled.img.attrs({ src: DataCardWalletIcon })`
    max-height: 24px;
    max-width: 24px;
`;
const StakeIcon = styled.img.attrs({ src: DataCardStakeIcon })`
    max-height: 24px;
    max-width: 24px;
`;
const NetworkIcon = styled.img.attrs({ src: DataCardNetworkIcon })`
    max-height: 24px;
    max-width: 24px;
`;

const QuickSendErrorIcon = styled.img.attrs({ src: QuickSendFailIcon })`
    max-height: 24px;
    max-width: 24px;
`;

const CopyIcon = styled.img.attrs({ src: DataCopyIcon })`
    max-height: 24px;
    max-width: 24px;
`;

interface InfoTextProps {
    breakWord?: boolean;
}
const InfoText = styled.p`
    display: flex;
    align-items: center;
    font-family: HKGrotesk;
    font-size: 18px;
    color: #fff;
    ${(props: InfoTextProps) =>
        props.breakWord ? "word-break: break-word;" : ""}
`;
InfoText.defaultProps = {
    breakWord: false
};
const InfoTitle = styled.h2`
    white-space: nowrap;
    font-family: HKGrotesk;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
`;

export {
    SectionTitle,
    InfoText,
    InfoTitle,
    InfoIcon,
    QuestionIcon,
    EditIcon,
    WalletIcon,
    EarningsIcon,
    StakeIcon,
    NetworkIcon,
    QuickSendErrorIcon,
    CopyIcon
};
