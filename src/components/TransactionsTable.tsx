import * as React from "react";
import { Perlin } from "../Perlin";
import { ITransaction, Tag } from "../types/Transaction";
import LoadingSpinner from "./common/loadingSpinner";
import { observer } from "mobx-react";
import styled from "styled-components";
import ReactTable, { FinalState } from "react-table";
import "react-table/react-table.css";
import { Link } from "react-router-dom";
import Dropdown, { Option } from "react-dropdown";
import InfiniteScroll from "react-infinite-scroller";

const perlin = Perlin.getInstance();

const Wrapper = styled.div`
    overflow: auto;
    max-height: 300px;
    .ReactTable {
        a {
            color: inherit;
            &:hover {
                text-decoration: none;
            }
        }

        .-loading {
            background: rgba(12, 17, 42, 0.9);

            .-loading-inner {
                color: #fff;
                transform: translateY(-50%);
            }
        }

        .rt-noData {
            position: relative;
            background: none;
            text-align: center;
            left: 0;
            top: 0;
            transform: none;
            color: #fff;
        }
        .rt-table {
            width: 100%;
            border-collapse: collapse;
        }
        .rt-thead {
            .rt-th {
                color: #fff;
                font-weight: normal;
                font-size: 14px;
                text-align: left;
                padding: 10px 15px;
            }
            .rt-th.-align-right {
                text-align: right;
            }
            .rt-th.-sort-desc,
            .rt-th.-sort-asc {
                box-shadow: none;
                div:after {
                    content: "";
                    display: inline-block;
                    vertical-align: middle;
                    border: solid 4px transparent;
                    border-bottom-color: #fff;
                    margin-left: 6px;
                    transition: all 0.2s ease;
                }
            }
            .rt-th.-sort-asc div:after {
                transform: translateY(-2px);
            }
            .rt-th.-sort-desc div:after {
                transform: translateY(2px) rotateZ(-180deg);
            }
        }
        .rt-tbody {
            .rt-td {
                color: #fff;
                opacity: 0.6;
                text-align: border-bottom-left-radius;
                padding: 10px 15px;
                text-overflow: ellipsis;
                overflow: hidden;
                overflow-wrap: normal;
            }
            .rt-td.-align-right {
                text-align: right;
            }

            .ty-tr:nth-child(odd) {
                background-color: #151b35;
            }
        }
    }
`;
const StyledTag = styled.span`
    border: solid 1px #fff;
    padding: 3px 5px;
    border-radius: 3px;
`;

const columns = [
    {
        Header: "Depth",
        accessor: "depth",
        maxWidth: 100,
        minWidth: 70
    },
    {
        Header: "Transaction ID",
        accessor: "id",
        Cell: (row: any) => (
            <Link to={"/transactions/" + row.value} title={row.value}>
                {row.value}
            </Link>
        )
    },
    {
        Header: "Status",
        accessor: "status",
        maxWidth: 100,
        minWidth: 30
    },
    {
        Header: "Creator",
        accessor: "creator",
        Cell: (row: any) => <span title={row.value}>{row.value}</span>
    },
    {
        id: "tag",
        accessor: (tx: ITransaction) => getTag(tx),
        Cell: (row: any) => <StyledTag>{row.value}</StyledTag>,
        className: "-align-right",
        headerClassName: "-align-right",
        Header: "Tag",
        maxWidth: 100,
        minWidth: 50
    }
];

const CustomNoDataComponent: (
    loading: boolean
) => React.FunctionComponent<FinalState> = (loading: boolean) => props => {
    if (loading) {
        return null;
    }
    return <div className="rt-noData">No transactions found</div>;
};

@observer
export default class TransactionsTable extends React.Component<{}, {}> {
    public loadFunc = async (page: any) => {
        perlin.getTableTransactions((page - 1) * 250, 250);
    };
    public render() {
        const data: any[] = perlin.transactions.recent;
        const hasMore = perlin.transactions.hasMore;
        const loading = perlin.transactions.loading;

        console.log("Transactions #", data.length);

        return (
            <Wrapper>
                <InfiniteScroll
                    pageStart={0}
                    loadMore={this.loadFunc}
                    hasMore={hasMore}
                    loader={<LoadingSpinner key={0} />}
                    useWindow={false}
                >
                    <ReactTable
                        key={1}
                        minRows={0}
                        data={data}
                        pageSize={data.length}
                        columns={columns}
                        resizable={false}
                        sortable={false}
                        showPagination={false}
                        NoDataComponent={CustomNoDataComponent(loading)}
                    />
                </InfiniteScroll>
            </Wrapper>
        );
    }
}

function getTag(tx: ITransaction) {
    switch (tx.tag) {
        case Tag.TagNop:
            return "nop";
        case Tag.TagTransfer:
            return "transfer";
        case Tag.TagContract:
            return "contract";
        case Tag.TagStake:
            return "stake";
        case Tag.TagBatch:
            return "batch";
    }
}
