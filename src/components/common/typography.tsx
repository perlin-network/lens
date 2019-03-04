import styled from "styled-components";
import PerlMiniIcon from "../../assets/svg/perl-mini-icon.svg";
import PencilEditIcon from "../../assets/svg/pencil-edit-button.svg";
import QuestionAlertIcon from "../../assets/svg/alert-question.svg";

const SectionTitle = styled.h2`
    font-family: HKGrotesk;
    font-size: 14px;
    color: #fff;
    margin-bottom: 15px;
    font-weight: 600;
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
    horizontal-align: centre;
`;

const QuestionIcon = styled.img.attrs({ src: QuestionAlertIcon })`
    max-height: 120px;
    max-width: 120px;
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

export { SectionTitle, InfoText, InfoTitle, InfoIcon, QuestionIcon, EditIcon };
