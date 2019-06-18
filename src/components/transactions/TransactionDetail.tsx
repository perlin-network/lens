import * as React from "react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { Box, Flex } from "@rebass/grid";
import { match as Match } from "react-router-dom";
import { Perlin } from "../../Perlin";
import { ITransaction, Tag } from "../../types/Transaction";

const perlin = Perlin.getInstance();

const Title = styled.p`
    font-family: Montserrat;
    font-size: 30px;
    color: #fff;
    margin-bottom: 15px;
    font-weight: 400;
`;

const Wrapper = styled.div`
    width: 80%;
    margin-top: 25px;
    padding: 0px 25px 25px 0px;
    margin-bottom: 50px;
`;

const Badge = styled.button`
    border: none;
    text-align: center;
    text-decoration: none;
    height: auto;
    weight: auto;
    color: white;
    font-size: 14px;
    background-color: ${props => props.color};
    border-radius: 10px;
    &:focus {
        outline: none;
    }
`;

const Row = styled(Flex)`
    padding-top: 12px;
    padding-bottom: 12px;
`;

const Col = styled(Box)`
    text-align: left;
    font-size: 16px;
    font-family: HKGrotesk;
    font-weight: 400;
    width: 80%;
    word-wrap: break-word;
`;

const HeadCol = styled(Box)`
    font-weight: 600;
    opacity: 0.6;
    font-size: 16px;
    width: 20%;
`;

interface IDetailProps {
    match: Match<{ id: string }>;
}

const renderTagBadge = (tagId: number) => {
    let tag = "";
    // todo : use enum for color
    let color = "#242582";
    switch (tagId) {
        case Tag.TagNop:
            tag = "nop";
            color = "#242582";
            break;
        case Tag.TagTransfer:
            tag = "transfer";
            color = "#553D67";
            break;
        case Tag.TagContract:
            tag = "contract";
            color = "#F64C72";
            break;
        case Tag.TagStake:
            tag = "stake";
            color = "#99738E";
            break;
        case Tag.TagBatch:
            tag = "batch";
            color = "#99738E";
            break;
        default:
            tag = "unknown";
            color = "#2F2FA2";
            break;
    }
    return <Badge color={color}>{tag}</Badge>;
};

const renderTransactionDataView = (data: any) => {
    return (
        <div>
            <hr color="#717985" />
            <Row>
                <HeadCol>Transaction ID&nbsp;:</HeadCol>
                <Col>{data.id}</Col>
            </Row>
            <Row>
                <HeadCol>Tag&nbsp;:</HeadCol>
                <Col>{renderTagBadge(data.tag)}</Col>
            </Row>
            <Row>
                <HeadCol>Sender&nbsp;:</HeadCol>
                <Col>{data.sender}</Col>
            </Row>
            <Row>
                <HeadCol>Sender Signature&nbsp;:</HeadCol>
                <Col>{data.sender_signature}</Col>
            </Row>

            <Row>
                <HeadCol>Creator&nbsp;:</HeadCol>
                <Col>{data.creator}</Col>
            </Row>
            <Row>
                <HeadCol>Creator Signature&nbsp;:</HeadCol>
                <Col>{data.creator_signature}</Col>
            </Row>
            <Row>
                <HeadCol>Parents&nbsp;:</HeadCol>
                <Col>
                    {/*
                        todo : put comma
                    */}
                    {data.parents.map((item: string, i: number) => {
                        return <span key={i}>{item}&nbsp;</span>;
                    })}
                </Col>
            </Row>
            <Row>
                <HeadCol>Nonce&nbsp;:</HeadCol>
                <Col>{data.nonce}</Col>
            </Row>
            <Row>
                <HeadCol>Depth&nbsp;:</HeadCol>
                <Col>{data.depth}</Col>
            </Row>
            <Row>
                <HeadCol>Confidence&nbsp;:</HeadCol>
                <Col>{data.confidence}</Col>
            </Row>
            <Row>
                <HeadCol>Contract Address&nbsp;:</HeadCol>
                <Col>00000000000000000000000000000000</Col>
            </Row>

            <Row>
                <HeadCol>Accounts Root&nbsp;:</HeadCol>
                <Col>{data.accounts_root}</Col>
            </Row>
            <Row>
                <HeadCol>
                    {/*
                        todo : transcate the input data  
                    */}
                    Input Data&nbsp;:
                </HeadCol>
                <Col>{data.payload}</Col>
            </Row>
            <hr color="#717985" />
        </div>
    );
};

const TransactionDetail: React.FunctionComponent<IDetailProps> = ({
    match
}) => {
    const queryId = match.params.id;
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [transactionData, setTransactionData] = useState<
        ITransaction | undefined
    >(undefined);

    useEffect(() => {
        if (!loading) {
            setLoading(true);
            perlin
                .getTransaction(queryId)
                .then(payload => {
                    setTransactionData(payload);
                })
                .catch(err => {
                    setErrorMessage(`${err}`);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, []);

    console.log("txData-->", transactionData);

    return (
        <>
            <Title>Transaction Details</Title>
            {loading && (
                <div
                    style={{
                        marginTop: "10px",
                        marginBottom: "10px",
                        color: "#4A41D1"
                    }}
                >
                    Loading...
                </div>
            )}
            {errorMessage !== "" && (
                <div
                    style={{
                        marginTop: "10px",
                        marginBottom: "10px",
                        color: "red"
                    }}
                >
                    {errorMessage}
                </div>
            )}
            {transactionData && !loading && (
                <Wrapper>{renderTransactionDataView(transactionData)}</Wrapper>
            )}
        </>
    );
};

export default TransactionDetail;
