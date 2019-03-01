import * as React from "react";
import ReactTable from "react-table";
import { Perlin } from "../Perlin";
import { ITransaction, Tag } from "../types/Transaction";
import { observer } from "mobx-react";

const columns = [
    {
        Header: "ID",

        accessor: "id",
        maxWidth: 300
    },
    {
        Header: "Sender",

        accessor: "sender",
        maxWidth: 150
    },
    {
        Header: "Creator",

        accessor: "creator",
        maxWidth: 150
    },
    {
        Header: "Status",

        accessor: "status",
        maxWidth: 80
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
    }
];

const perlin = Perlin.getInstance();

@observer
export default class TransactionsTable extends React.Component<{}, {}> {
    public render() {
        return (
            <ReactTable
                data={perlin.recentTransactions}
                columns={columns}
                className="-striped -highlight"
                defaultPageSize={15}
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
