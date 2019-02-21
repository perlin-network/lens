import * as React from "react";
import { Pre, Button } from "@blueprintjs/core";
import ReactTable, { SubComponentFunction } from "react-table";
import { Perlin } from "../Perlin";
import { Tag } from "../constants";
import { observer } from "mobx-react";

const columns = [
    {
        Header: "Sender",
        accessor: "sender",
        maxWidth: 300,
        className: "text-center"
    },
    {
        Header: "Nonce",
        accessor: "nonce",
        maxWidth: 80,
        className: "text-center"
    },
    {
        Header: "Tag",
        accessor: "tag",
        maxWidth: 80,
        className: "text-center"
    }
];
const perlin = Perlin.getInstance();

const onDownloadContract = (txID: string) => () => {
    perlin.downloadContract(txID);
};
const SubComponent: SubComponentFunction = row => {
    const data = row.original;
    delete data.index;
    const isContract = data.tag === Tag.CreateContract;

    return (
        <div style={{ paddingLeft: 10, paddingRight: 10 }}>
            <Pre style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {JSON.stringify(data, null, 4)}
            </Pre>
            {isContract ? (
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
