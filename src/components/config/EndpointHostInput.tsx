import * as React from "react";
import { FormGroup, MenuItem } from "@blueprintjs/core";
import { Suggest, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import { Perlin } from "../../Perlin";
import { observer } from "mobx-react";
import styled from "styled-components";
import * as store from "store";
import * as eventsPlugin from "store/plugins/events";
import { STORAGE_KEYS } from "src/constants";

store.addPlugin(eventsPlugin);

interface IProps {
    disabled: boolean;
}

interface IState {
    host: string;
    items: IEndpointItem[];
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

const getHostItems = () =>
    Perlin.getStoredHosts().map((item, idx) => ({
        id: idx,
        value: item
    }));
const filterItem: ItemPredicate<IEndpointItem> = (query, item) => {
    return item.value.toLowerCase().indexOf(query.toLowerCase()) >= 0;
};
const renderInputValue = (item: IEndpointItem) => {
    return item.value;
};

@observer
export default class EndpointHostInput extends React.Component<IProps, IState> {
    public state = {
        host: Perlin.getCurrentHost(),
        items: getHostItems()
    };
    private storedHostsListenerId: string;

    public getHostValue = () => {
        return this.state.host;
    };

    public render() {
        const { host, items } = this.state;
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
                    query={host}
                    onQueryChange={this.handleQueryChange}
                    inputProps={{ id: "endpoint-host-input" }}
                    popoverProps={{ minimal: true }}
                />
            </FormGroup>
        );
    }

    public componentDidMount() {
        // @ts-ignore
        this.storedHostsListenerId = store.watch(
            STORAGE_KEYS.STORED_HOSTS,
            () => {
                this.setState(() => ({
                    items: getHostItems()
                }));
            }
        );
    }

    public componentWillUnmount() {
        // @ts-ignore
        store.unwatch(this.storedHostsListenerId);
    }

    private removeItemHandler = (host: string) => () => {
        Perlin.removeStoredHost(host);
    };

    private renderItem: ItemRenderer<IEndpointItem> = (
        item: IEndpointItem,
        { handleClick }
    ) => {
        return (
            <MenuItem text={item.value} onClick={handleClick} key={item.id}>
                <MenuItem
                    text="Delete"
                    key={1}
                    onClick={this.removeItemHandler(item.value)}
                />
            </MenuItem>
        );
    };

    private handleQueryChange = (query: string) => {
        this.setState({
            host: query
        });
    };

    private onSelect = (item: IEndpointItem) => {
        this.setState({
            host: item.value
        });
    };
}
