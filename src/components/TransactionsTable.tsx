import * as React from "react";
// import ReactTable from "react-table";
import { Perlin } from "../Perlin";
import { ITransaction, Tag } from "../types/Transaction";
import { observer } from "mobx-react";
import { formatDistance } from "date-fns";
import "../index.scss";

const columns = [
    "Time",
    "Transaction ID",
    "Status",
    "Creator",
    "Tag"
    /*{
        Header: "",

        id: "time",
        accessor: (tx: ITransaction): string => {
            const date = new Date(tx.timestamp);
            return formatDistance(date, new Date(), { addSuffix: true });
        },
        maxWidth: 180
    },
    {
        Header: "Transaction ID",

        accessor: "id",
        maxWidth: 250
    },
    {
        Header: "Status",

        accessor: "status",
        maxWidth: 60
    },
    {
        Header: "Creator",

        accessor: "creator",
        maxWidth: 250
    },
    {
        Header: "Tag",

        id: "tag",
        accessor: (tx: ITransaction): string => {
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
        },
        maxWidth: 80
    }*/
];

const perlin = Perlin.getInstance();

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
            <thead>
                <tr>
                    {dataColumns.map(column => {
                        return <th key={column}>{column}</th>;
                    })}
                </tr>
            </thead>
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

        // Decorate with Bootstrap CSS
        return (
            <table className="tableStyle">
                {tableHeaders}
                <tbody>{tableBody}</tbody>
            </table>
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
