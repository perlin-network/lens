import { observable } from "mobx";

class StakePanelStore {
    @observable public amount: number = 0;

    public clearAmount() {
        this.amount = 0;
    }
}

export { StakePanelStore };
