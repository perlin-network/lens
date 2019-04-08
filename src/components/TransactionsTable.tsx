import * as React from "react";
import { Perlin } from "../Perlin";
import { ITransaction, Tag } from "../types/Transaction";
import { observer } from "mobx-react";
import { formatDistance } from "date-fns";
import styled from "styled-components";
import ReactTable, { FinalState } from "react-table";
import "react-table/react-table.css";
import Pagination from "react-js-pagination";
import { Link } from "react-router-dom";
import Dropdown, { Option } from "react-dropdown";

const perlin = Perlin.getInstance();

const Wrapper = styled.div`
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
                .rt-resizable-header-content:after {
                    content: "";
                    display: inline-block;
                    border: solid 4px transparent;
                    border-bottom-color: #fff;
                    margin-left: 6px;
                    transition: all 0.3s ease;
                }
            }
            .rt-th.-sort-desc .rt-resizable-header-content:after {
                transform: rotateZ(-180deg);
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
        id: "time",
        Header: "Time",
        accessor: (tx: ITransaction) => {
            const date = new Date(tx.timestamp);
            return formatDistance(date, new Date(), { addSuffix: true });
        },
        maxWidth: 200,
        minWidth: 100
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
        minWidth: 30
    }
];

const StyledPagination = styled.div`
    text-align: center;
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin: 15px;

    .per-page {
        .Dropdown-root {
            display: inline-block;
            margin-left: 10px;
            vertical-align: middle;
        }
        .Dropdown-menu {
            text-align: left;
        }
    }
    .pagination {
        list-style: none;
        padding: 0;
        margin: 0;

        li.disabled {
            display: none;
        }
        li.active,
        li:hover {
            opacity: 1;
        }
        li {
            display: inline-block;
            border: solid 1px #fff;
            padding: 7px;
            min-width: 30px;
            border-radius: 3px;
            opacity: 0.6;
            margin-left: 5px;
            cursor: pointer;

            a {
                color: inherit;

                &:hover {
                    text-decoration: none;
                }
            }
        }
    }

    .page-active,
    .arrow:hover,
    .page:hover {
        opacity: 1;
    }
`;

const pageSizeOptions: number[] = [5, 10, 25, 50, 100];
const CustomPagination: React.FunctionComponent<FinalState> = props => {
    const { page, pageSize, data, onPageChange, onPageSizeChange } = props;
    const onDropdownChange = (item: Option) =>
        onPageSizeChange(parseInt(item.value, 10), 1);
    const pageSizeOptionsStr: string[] = pageSizeOptions.map(item => item + "");
    return (
        <StyledPagination>
            <div className="per-page">
                {data.length} result{data.length > 1 ? "s" : ""} | Per page:
                <Dropdown
                    options={pageSizeOptionsStr}
                    value={pageSize + ""}
                    onChange={onDropdownChange}
                />
            </div>

            <Pagination
                activePage={page || 1}
                activeClass="active"
                itemsCountPerPage={pageSize}
                totalItemsCount={data.length - (pageSize || 0)}
                pageRangeDisplayed={3}
                nextPageText="Next"
                prevPageText="Prev"
                onChange={onPageChange}
            />
        </StyledPagination>
    );
};

const CustomNoDataComponent: (
    loading: boolean
) => React.FunctionComponent<FinalState> = (loading: boolean) => props => {
    if (loading) {
        return null;
    }
    return <div className="rt-noData">No rows found</div>;
};

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
        const data: any[] = perlin.transactions.recent;
        const loading = perlin.transactions.loading;

        console.log("Transactions #", data.length);

        return (
            <Wrapper>
                <ReactTable
                    minRows={0}
                    data={data}
                    columns={columns}
                    loading={loading}
                    defaultPageSize={10}
                    pageSizeOptions={pageSizeOptions}
                    defaultSorted={[
                        {
                            id: "time",
                            desc: true
                        }
                    ]}
                    NoDataComponent={CustomNoDataComponent(loading)}
                    PaginationComponent={CustomPagination}
                />
            </Wrapper>
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
