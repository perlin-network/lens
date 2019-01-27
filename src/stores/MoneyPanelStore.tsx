import { observable } from "mobx";

class MoneyPanelStore {
    @observable public recipient: any = "";
    @observable public amount: number = 0;

    public clearFields() {
        this.recipient = "";
        this.amount = 0;
    }
}

export { MoneyPanelStore };
