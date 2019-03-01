import * as React from "react";
import { Button, Pre } from "@blueprintjs/core";
import ReactTable, { SubComponentFunction } from "react-table";
import { Perlin } from "../Perlin";
import { ITransaction, Tag } from "../types/Transaction";
import { observer } from "mobx-react";

const columns = [
    {
        Header: "Sender",

        accessor: "creator",
        maxWidth: 300
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

const onDownloadContract = (txID: string) => async () => {
    await perlin.downloadContract(txID);
};

const SubComponent: SubComponentFunction = row => {
    const data = row.original;
    delete data.index;

    return (
        <div style={{ paddingLeft: 10, paddingRight: 10 }}>
            <Pre style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {JSON.stringify(data, null, 4)}
            </Pre>

            {data.tag === Tag.CONTRACT ? (
                // show a download button from the smart contract
                <div className="button-container" style={{ marginLeft: 20 }}>
                    <Button
                        className="button"
                        onClick={onDownloadContract(data.id)}
                        text="Download"
                    />
                </div>
            ) : null}
        </div>
    );
};

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
                SubComponent={SubComponent}
            />
        );
    }
}
