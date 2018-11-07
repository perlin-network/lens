import {observable} from "mobx";

class ContractPanelStore {
    @observable public contractFile: string | any;
}

export {ContractPanelStore}