import * as React from "react";
import {Perlin} from "./Perlin";
import {Button, FileInput, FormGroup} from "@blueprintjs/core";
import {ContractPanelStore} from "./ContractPanelStore";

class ContractPanel extends React.Component<{ perlin: Perlin }, {}> {
    private store: ContractPanelStore = new ContractPanelStore();

    public render() {
        return <>
            <FormGroup
                label="WebAssembly (.wasm) smart contract file"
                labelFor="selectContract"
                labelInfo="(required)">
                <FileInput id="selectContract" large={true} fill={true}
                           text={this.store.contractFile && this.store.contractFile.name}
                           onChange={this.onSelectContract}/>
            </FormGroup>

            <div className='button-container'>
                <Button className='button' onClick={this.onCreateContract} text="Upload"/>
            </div>
        </>
    }

    // @ts-ignore
    private onSelectContract = (event: any) => {
        this.store.contractFile = event.target.files[0];
    }

    // @ts-ignore
    private onCreateContract = async (event: any) => {
        await this.props.perlin.createSmartContract(this.store.contractFile);
    }
}

export {ContractPanel};