import * as React from "react";
import { FormGroup, MenuItem, Intent } from "@blueprintjs/core";
import { Suggest, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import { observer } from "mobx-react";
import styled from "styled-components";
import * as storage from "../../storage";

interface IProps {
    disabled: boolean;
    initialHost: string;
    initialHosts: string[];
}

interface IState {
    host: string;
    items: IEndpointItem[];
    selectedItem: IEndpointItem | null;
}

interface IEndpointItem {
    id: number;
    value: string;
}

const EndpointSuggest = styled(Suggest.ofType<IEndpointItem>())`
    .bp3-popover-target {
        width: 100%;
    }
`;

const filterItem: ItemPredicate<IEndpointItem> = (query, item) => {
    return item.value.toLowerCase().indexOf(query.toLowerCase()) >= 0;
};
const renderInputValue = (item: IEndpointItem) => {
    return item.value;
};

const toEndpointItems = (hosts: string[]): IEndpointItem[] =>
    hosts.map((host, idx) => ({ value: host, id: idx }));

@observer
export default class EndpointHostInput extends React.Component<IProps, IState> {
    private unwatchStoredHosts: () => void;

    constructor(props: IProps) {
        super(props);
        this.state = {
            host: props.initialHost,
            items: toEndpointItems(props.initialHosts),
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
            <FormGroup label="Endpoint Host" labelFor="endpoint-host-input">
                <EndpointSuggest
                    disabled={disabled}
                    resetOnQuery={false}
                    openOnKeyDown={true}
                    inputValueRenderer={renderInputValue}
                    itemRenderer={this.renderItem}
                    itemPredicate={filterItem}
                    onItemSelect={this.onSelect}
                    items={items}
                    selectedItem={selectedItem}
                    query={host}
                    onQueryChange={this.handleQueryChange}
                    inputProps={{
                        id: "endpoint-host-input",
                        placeholder: "localhost:9000"
                    }}
                    popoverProps={{ minimal: true }}
                />
            </FormGroup>
        );
    }

    public componentDidMount() {
        // @ts-ignore
        this.unwatchStoredHosts = storage.watchStoredHosts(
            (hosts: string[]) => {
                this.setState({
                    items: toEndpointItems(hosts)
                });
            }
        );
    }

    public componentWillUnmount() {
        this.unwatchStoredHosts();
    }

    private removeItemHandler = (host: string) => () => {
        storage.removeStoredHost(host);
    };

    private renderItem: ItemRenderer<IEndpointItem> = (
        item: IEndpointItem,
        { handleClick, modifiers }
    ) => {
        return (
            <MenuItem
                text={item.value}
                onClick={handleClick}
                key={item.id}
                active={modifiers.active}
            >
                <MenuItem
                    text="Delete"
                    key={1}
                    icon="trash"
                    intent={Intent.DANGER}
                    onClick={this.removeItemHandler(item.value)}
                />
            </MenuItem>
        );
    };

    private handleQueryChange = (query: string) => {
        this.setState(() => ({
            host: query,
            selectedItem: null
        }));
    };

    private onSelect = (item: IEndpointItem) => {
        this.setState(() => ({
            host: item.value,
            selectedItem: item
        }));
    };
}
