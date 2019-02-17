import { Component,  ElementRef, EventEmitter, Output, ViewChild } from "@angular/core";

@Component({
    selector: "app-create-game-free-view",
    templateUrl: "./create-game-free-view.component.html",
    styleUrls: ["./create-game-free-view.component.css"],
})
export class CreateGameFreeViewComponent {
    @Output() public closed: EventEmitter<boolean> = new EventEmitter();
    @ViewChild("gameNameInput") private gameNameInput: ElementRef;
    @ViewChild("add") private add: ElementRef;
    @ViewChild("remove") private remove: ElementRef;
    @ViewChild("modified") private modified: ElementRef;
    @ViewChild("quantityObject") private quantityObject: ElementRef;
    @ViewChild("erreurMessage") private erreurMessage: ElementRef;

    public canSubmit: boolean = false;
    public displayError: string = "inline";
    public hideError: string = "none";

    public isNameValid(): boolean {
        const gameName: string = this.gameNameInput.nativeElement.value;

        return gameName.length !== 0;
    }
    public isModificationTypeValid(): boolean {
        const isAddType: boolean = this.add.nativeElement.checked;
        const isRemoveType: boolean = this.remove.nativeElement.checked;
        const isModifiedType: boolean = this.modified.nativeElement.checked;

        return isAddType || isRemoveType || isModifiedType;
    }
    public isQuantityValid(): boolean {
        const quantity: string = this.quantityObject.nativeElement.value;
        this.toggleErrorMessage(quantity);

        return quantity.length !== 0 && !isNaN(Number(quantity));
    }

    private toggleErrorMessage(quantity: string): void {
        this.erreurMessage.nativeElement.style.display = (quantity.length > 0 && isNaN(Number(quantity)))
        ? this.displayError : this.hideError;
    }

    public verifyInfo(): void {
        this.canSubmit = (this.isQuantityValid() && this.isNameValid() && this.isModificationTypeValid());
    }

    public hideView(): void {
        this.closed.emit(true);
    }
}
