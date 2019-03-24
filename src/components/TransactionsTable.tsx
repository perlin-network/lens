import * as React from "react";
import ReactTable from "react-table";
import { Perlin } from "../Perlin";
import { ITransaction, Tag } from "../types/Transaction";
import { observer } from "mobx-react";
import { formatDistance } from "date-fns";

const columns = [
    /*{
        Header: "",

        id: "time",
        accessor: (tx: ITransaction): string => {
            const date = new Date(tx.timestamp);
            return formatDistance(date, new Date(), { addSuffix: true });
        },
        maxWidth: 180
    },*/
    {
        Header: "Sender / Recipient",

        accessor: "id",
        maxWidth: 250
    },
    {
        Header: "Nonce",
        accessor: "nonce",
        maxWidth: 60
    },
    {
        Header: "Type",
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
    },
    {
        Header: "Amount",
        accessor: "payload",
        maxWidth: 60
    }
];

const perlin = Perlin.getInstance();

@observer
export default class TransactionsTable extends React.Component<{}, {}> {
    public render() {
        return (
            <ReactTable
                data={perlin.transactions.recent}
                columns={columns}
                className="-striped -highlight"
                defaultPageSize={10}
                defaultSorted={[
                    {
                        id: "index",
                        desc: true
                    }
                ]}
            />
        );
    }
}
