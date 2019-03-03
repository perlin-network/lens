import * as React from "react";
import { FormGroup, MenuItem, Intent } from "@blueprintjs/core";
import { Suggest, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import styled from "styled-components";
import { IHostItem } from "./Container";

const HostSuggest = styled(Suggest.ofType<IHostItem>())`
    outline: none;
    border: none;
    border-radius: 2px;
    width: 190px;
    height: 35px;
    background-color: #ffffff;
    padding: 5px 10px;
    font-family: HKGrotesk;
    font-size: 14px;
    font-weight: normal;
    &::placeholder {
        color: #ffffff;
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
                style={{
                    backgroundColor: "#ffffff",
                    height: "45px"
                }}
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
        <FormGroup
            style={{
                backgroundColor: "#ffffff",
                height: "45px"
            }}
        >
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
                    placeholder: "localhost:9000"
                }}
                popoverProps={{ minimal: true }}
            />
        </FormGroup>
    );
};

export default HostnameInput;
