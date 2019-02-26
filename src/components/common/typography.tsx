import styled from "styled-components";
import PerlMiniIcon from "../../assets/svg/perl-mini-icon.svg";

const SectionTitle = styled.h2`
    font-family: HKGrotesk;
    font-size: 14px;
    color: #fff;
    margin-bottom: 15px;
    font-weight: 600;
`;

const InfoIcon = styled.img.attrs({ src: PerlMiniIcon })`
    height: 20px;
    width: 20px;
    margin-right: 5px;
`;

const InfoText = styled.p`
    display: flex;
    align-items: center;
    font-family: HKGrotesk;
    font-size: 18px;
    color: #fff;
`;
const InfoTitle = styled.h2`
    font-family: HKGrotesk;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
`;

export { SectionTitle, InfoText, InfoTitle, InfoIcon };
