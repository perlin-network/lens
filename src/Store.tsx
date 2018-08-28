import {observable} from "mobx";

class Store {
    @observable public recipient: any;
    @observable public amount: number;
}

export {Store};