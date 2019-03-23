import * as React from "react";
import styled from "styled-components";
import { Flex, Box } from "@rebass/grid";
import { SectionTitle } from "../common/typography";
import "./accountDetected.scss";

export default class AccountDetected extends React.Component<{}, {}> {
    public render() {
        return (
            <>
                <div className="detected-grid">
                    <div className="detected-outer-header">
                        Detected An Account ID
                    </div>
                    <div className="detected-outer-recipient">Recipient</div>
                    <div className="detected-outer-recipient-content">
                        QR code and stuff
                    </div>
                    <div className="detected-outer-sendfunds">Send Funds</div>
                    <div className="detected-outer-sendfunds-content">
                        <div className="detected-inner-amount">Amount</div>
                        <div className="detected-inner-address">
                            <input placeholder="Enter Amount" />
                        </div>
                        <div className="detected-inner-checked">
                            Double checked
                        </div>
                        <div className="detected-inner-sendperls">
                            <button>Send Perls</button>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}
