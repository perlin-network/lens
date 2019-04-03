import styled from "styled-components";

const Card = styled.div`
    border: 1px solid #ffffff22;
    word-wrap: break-word;
    border-radius: 5px;
    font-family: HKGrotesk;
`;

const CardHeader = styled.div`
    border-bottom: 1px solid #ffffff22;
    padding: 20px;
`;

const CardBody = styled.div`
    padding: 20px;
    font-size: 14px;
    color: #717985;
`;

interface ICardTitle {
    fontSize?: string;
    fontWeight?: string;
}

const CardTitle = styled.h2<ICardTitle>`
    font-size: ${props => (props.fontSize ? props.fontSize : "20")}px;
    font-weight: ${props => (props.fontWeight ? props.fontWeight : "600")};
    color: #fff;
    font-family: HKGrotesk;
    margin-top: 0px;
    margin-bottom: 0px;
`;

export { Card, CardHeader, CardTitle, CardBody };
