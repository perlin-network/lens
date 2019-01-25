import {observable} from "mobx";

class MoneyPanelStore {
    @observable public recipient: any;
    @observable public amount: number;
}

export {MoneyPanelStore}