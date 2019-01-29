import * as React from "react";
import { FormGroup, MenuItem } from "@blueprintjs/core";
import { Suggest, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import { Perlin } from "../../Perlin";
import { observer } from "mobx-react";
import styled from "styled-components";

interface IProps {
    disabled: boolean;
}

interface IState {
    host: string;
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

const renderItem: ItemRenderer<IEndpointItem> = (
    item: IEndpointItem,
    { handleClick, modifiers, query }
) => {
    return <MenuItem text={item.value} onClick={handleClick} key={item.id} />;
};
const filterItem: ItemPredicate<IEndpointItem> = (query, item) => {
    return item.value.toLowerCase().indexOf(query.toLowerCase()) >= 0;
};
const renderInputValue = (item: IEndpointItem) => {
    return item.value;
};

@observer
export default class EndpointHostInput extends React.Component<IProps, IState> {
    public state = {
        host: Perlin.getCurrentHost()
    };

    public getHostValue = () => {
        return this.state.host;
    };

    public render() {
        const { host } = this.state;
        const { disabled } = this.props;
        const items = Perlin.getStoredHosts().map((item, idx) => ({
            id: idx,
            value: item
        }));

        return (
            <FormGroup label="Endpoint Host" labelFor="endpoint-host-input">
                <EndpointSuggest
                    disabled={disabled}
                    resetOnQuery={false}
                    openOnKeyDown={true}
                    inputValueRenderer={renderInputValue}
                    itemRenderer={renderItem}
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
