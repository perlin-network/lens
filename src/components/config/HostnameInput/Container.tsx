import * as React from "react";
import HostnameInput from "./index";
import { observer } from "mobx-react";
import * as storage from "../../../storage";
import { InputGroup } from "@blueprintjs/core";

interface IProps {
    disabled: boolean;
    initialHost: string;
}

interface IState {
    host: string;
    items: IHostItem[];
    selectedItem: IHostItem | null;
}

interface IHostItem {
    id: number;
    value: string;
}

const toHostItems = (hosts: string[]): IHostItem[] =>
    hosts.map((host, idx) => ({ value: host, id: idx }));

@observer
export default class HostnameInputContainer extends React.Component<
    IProps,
    IState
> {
    private unwatchStoredHosts: () => void;

    constructor(props: IProps) {
        super(props);
        this.state = {
            host: props.initialHost,
            items: toHostItems(storage.getStoredHosts()),
            selectedItem: null
        };
    }

    public resetHostValue = () => {
        this.setState((_, props) => ({
            host: props.initialHost
        }));
    };
    public getHostValue = () => {
        return this.state.host;
    };

    public render() {
        const { host, items, selectedItem } = this.state;
        const { disabled } = this.props;

        return (
            <HostnameInput
                disabled={disabled}
                host={host}
                items={items}
                selectedItem={selectedItem}
                onHostDelete={this.handleHostDelete}
                onHostSelect={this.handleHostSelect}
                onQueryChange={this.handleQueryChange}
            />
        );
    }

    public componentDidMount() {
        this.unwatchStoredHosts = storage.watchStoredHosts(
            (hosts: string[]) => {
                this.setState({
                    items: toHostItems(hosts)
                });
            }
        );
    }

    public componentWillUnmount() {
        this.unwatchStoredHosts();
    }

    private handleHostDelete = (host: string) => () => {
        storage.removeStoredHost(host);
    };

    private handleQueryChange = (query: string) => {
        this.setState({
            host: query,
            selectedItem: null
        });
    };

    private handleHostSelect = (item: IHostItem) => {
        this.setState({
            host: item.value,
            selectedItem: item
        });
    };
}
export { IHostItem };
