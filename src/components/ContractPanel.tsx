import * as React from "react";
import { Perlin } from "../Perlin";
import { FileInput, FormGroup } from "@blueprintjs/core";
import { ContractPanelStore } from "../stores/ContractPanelStore";
import Button from "./Button";

const perlin = Perlin.getInstance();

class ContractPanel extends React.Component<{}, {}> {
    private store: ContractPanelStore = new ContractPanelStore();

    public render() {
        return (
            <>
                <FormGroup
                    label="WebAssembly (.wasm) smart contract file"
                    labelFor="selectContract"
                    labelInfo="(required)"
                >
                    <FileInput
                        id="selectContract"
                        large={true}
                        fill={true}
                        text={
                            this.store.contractFile &&
                            this.store.contractFile.name
                        }
                        onChange={this.onSelectContract}
                    />
                </FormGroup>
                <Button onClick={this.onCreateContract} text="Upload" />
            </>
        );
    }

    // @ts-ignore
    private onSelectContract = (event: any) => {
        this.store.contractFile = event.target.files[0];
    };

    // @ts-ignore
    private onCreateContract = async (event: any) => {
        await perlin.createSmartContract(this.store.contractFile);
    };
}

export { ContractPanel };
