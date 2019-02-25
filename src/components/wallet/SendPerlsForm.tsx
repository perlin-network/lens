import * as React from "react";
import { useState } from "react";
import styled from "styled-components";

interface ISendPerlsFormProps {
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
const Input = styled.input`
    outline: none;
    border: none;
    border-radius: 2px;
    width: 190px;
    height: 35px;
    background-color: #fff;
    padding: 5px 10px;
    font-family: HKGrotesk;
    font-size: 14px;
    font-weight: normal;
    &::placeholder {
        color: #717985;
        opacity: 0.8;
    }
`;
const FeeText = styled.span`
    margin-top: 5px;
    font-family: Montserrat;
    font-size: 10px;
`;
const Button = styled.button`
    width: 160px;
    height: 40px;
    border: 0;
    outline: 0;
    border-radius: 3px;
    margin-top: 18px;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    font-family: HKGrotesk;
    font-size: 16px;
    font-weight: normal;
    color: #fff;
    background-color: #23228e;
    cursor: pointer;
`;

const SendPerlsForm: React.SFC<ISendPerlsFormProps> = ({
    onSubmit
}: ISendPerlsFormProps) => {
    const [address, setAddress] = useState("");
    const [amount, setAmount] = useState("");

    const clearFields = () => {
        setAddress("");
        setAmount("");
    };
    const handleSend = async (e: React.SyntheticEvent) => {
        const numericAmount = parseInt(amount, 10);
        if (numericAmount && address.length > 0) {
            onSubmit(address, numericAmount);
            clearFields();
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
                    value={address}
                    onChange={handleAddressChange}
                />
            </FormGroup>
            <FormGroup>
                <Label htmlFor="amount">Amount</Label>
                <Input
                    id="amount"
                    type="number"
                    placeholder="0 PERLs"
                    value={amount}
                    onChange={handleAmountChange}
                />
                <FeeText>Fee: 0.0002 PERL</FeeText>
            </FormGroup>
            <Button onClick={handleSend}>Send Perls</Button>
        </Wrapper>
    );
};

export default SendPerlsForm;
