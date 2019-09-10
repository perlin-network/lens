import * as React from "react";
import { useState } from "react";
import { Button, Input } from "../common/core";
import styled from "styled-components";

interface IPaymentFormProps {
    onSubmit: (recipient: string, amount: number) => void;
}

const Wrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
`;
const FormGroup = styled.div`
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    margin-right: 25px;
`;
const Label = styled.label`
    font-family: HKGrotesk;
    font-size: 10px;
    font-weight: 600px;
    color: #fff;
    margin-bottom: 10px;
`;
const FeeText = styled.span`
    margin-top: 5px;
    font-family: Montserrat;
    font-size: 10px;
`;

const PaymentForm: React.SFC<IPaymentFormProps> = ({
    onSubmit
}: IPaymentFormProps) => {
    const [address, setAddress] = useState("");
    const [amount, setAmount] = useState("");

    const handlePay = async (e: React.SyntheticEvent) => {
        const numericAmount = parseInt(amount, 10);

        if (numericAmount && address.length > 0) {
            onSubmit(address, numericAmount);
        }
        // TODO: display error message
    };
    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddress(e.target.value);
    };
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };

    return (
        <Wrapper>
            <FormGroup>
                <Label htmlFor="recipient-address">Recipient Address</Label>
                <Input
                    id="recipient-address"
                    type="text"
                    placeholder="ex: 8f9b4ae0364280e6a0b988c149f65d1badaeefed2db582266494dd79aa7c821a"
                    width="190px"
                    value={address}
                    onChange={handleAddressChange}
                />
            </FormGroup>
            <FormGroup>
                <Label htmlFor="amount">Amount</Label>
                <Input
                    id="amount"
                    type="number"
                    placeholder="0 KENs"
                    width="190px"
                    value={amount}
                    onChange={handleAmountChange}
                />
                <FeeText>Fee: 0.0002 KEN</FeeText>
            </FormGroup>
            <Button onClick={handlePay} style={{ marginTop: "18px" }}>
                Send KENs
            </Button>
        </Wrapper>
    );
};

export default PaymentForm;
