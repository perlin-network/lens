import * as React from "react";
import { Perlin } from "../Perlin";
import { ITransaction, Tag } from "../types/Transaction";
import { observer } from "mobx-react";
import { formatDistance } from "date-fns";
import styled from "styled-components";

const columns = ["Time", "Transaction ID", "Status", "Creator", "Tag"];

const perlin = Perlin.getInstance();

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
`;
const TableHead = styled.thead`
    th {
        color: #fff;
        font-weight: normal;
        font-size: 14px;
        text-align: left;
        height: 40px;
        padding: 0px 15px;
    }
`;
const TableBody = styled.tbody`
    td {
        color: #fff;
        opacity: 0.6;
        text-align: left;
        height: 40px;
        padding: 0px 15px;
        text-overflow: ellipsis;
        overflow: hidden;
        overflow-wrap: normal;
    }

    tr:nth-child(odd) {
        background-color: #151b35;
    }
`;

@observer
export default class TransactionsTable extends React.Component<{}, {}> {
    public state = { lastUpdate: new Date() };

    public shouldComponentUpdate() {
        const now = new Date();
        const seconds =
            (now.getTime() - this.state.lastUpdate.getTime()) / 1000;
        return seconds >= 20; // Re-render minimum every second
    }

    public componentDidUpdate() {
        console.log("Updated, time changed from", this.state.lastUpdate);
        this.setState(() => {
            return {
                lastUpdate: new Date()
            };
        });
    }

    public render() {
        const dataColumns = columns;
        const data = perlin.transactions.recent;
        const tableHeaders = (
            <TableHead>
                <tr>
                    {dataColumns.map(column => {
                        return <th key={column}>{column}</th>;
                    })}
                </tr>
            </TableHead>
        );

        const tableBody = data.map(tx => {
            const date = new Date(tx.timestamp);
            return (
                <tr key={tx.id}>
                    <td style={{ maxWidth: 180 }}>
                        {formatDistance(date, new Date(), { addSuffix: true })}
                    </td>
                    <td style={{ maxWidth: 250 }}>{tx.id}</td>
                    <td style={{ maxWidth: 60 }}>{tx.status}</td>
                    <td style={{ maxWidth: 250 }}>{tx.creator}</td>
                    <td style={{ maxWidth: 80 }}>{getTag(tx)}</td>
                </tr>
            );
        });

        return (
            <Table>
                {tableHeaders}
                <TableBody>{tableBody}</TableBody>
            </Table>
        );
    }
}
function getTag(tx: ITransaction) {
    switch (tx.tag) {
        case Tag.NOP:
            return "nop";
        case Tag.TRANSFER:
            return "transfer";
        case Tag.CONTRACT:
            return "contract";
        case Tag.STAKE:
            return "stake";
    }
}
