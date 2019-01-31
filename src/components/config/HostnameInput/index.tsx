import * as React from "react";
import { FormGroup, MenuItem, Intent } from "@blueprintjs/core";
import { Suggest, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import styled from "styled-components";
import { IHostItem } from "./Container";

const HostSuggest = styled(Suggest.ofType<IHostItem>())`
    .bp3-popover-target {
        width: 100%;
    }
`;

const filterItem: ItemPredicate<IHostItem> = (query, item) => {
    return item.value.toLowerCase().indexOf(query.toLowerCase()) >= 0;
};
const renderInputValue = (item: IHostItem) => {
    return item.value;
};

interface IProps {
    disabled: boolean;
    selectedItem: IHostItem | null;
    items: IHostItem[];
    host: string;
    onHostDelete: (host: string) => () => void;
    onQueryChange: (query: string) => void;
    onHostSelect: (item: IHostItem) => void;
}

const HostnameInput: React.FC<IProps> = ({
    disabled,
    items,
    selectedItem,
    host,
    onQueryChange,
    onHostDelete,
    onHostSelect
}) => {
    const renderItem: ItemRenderer<IHostItem> = (
        item: IHostItem,
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
                    onClick={onHostDelete(item.value)}
                />
            </MenuItem>
        );
    };
    return (
        <FormGroup label="API Hostname" labelFor="config-host-input">
            <HostSuggest
                disabled={disabled}
                resetOnQuery={false}
                openOnKeyDown={true}
                inputValueRenderer={renderInputValue}
                itemRenderer={renderItem}
                itemPredicate={filterItem}
                onItemSelect={onHostSelect}
                items={items}
                selectedItem={selectedItem}
                query={host}
                onQueryChange={onQueryChange}
                inputProps={{
                    id: "config-host-input",
                    placeholder: "localhost:9000"
                }}
                popoverProps={{ minimal: true }}
            />
        </FormGroup>
    );
};

export default HostnameInput;
