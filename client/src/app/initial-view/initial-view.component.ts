import { Component, HostListener } from "@angular/core";
import { Router } from "@angular/router";
import { User } from "../../../../common/communication/user";
import { InitialViewService } from "../initial-view.service";

@Component({
  selector: "app-initial-view",
  templateUrl: "./initial-view.component.html",
  styleUrls: ["./initial-view.component.css"],
})
export class InitialViewComponent {

  public constructor(public initialViewService: InitialViewService, private router: Router) { }
  public title: string = "Spot the Differences";
  public button: string = "Accept";

  public verifyUsername(): void {
    const username: string = (document.getElementById("usernameInput") as HTMLInputElement).value;
    this.initialViewService.postUsernameValidation(username).subscribe(this.correctUsername.bind(this));
  }

  @HostListener("window:beforeunload", ["$event"])
  public beforeUnload($event: Event): void  {
    const user: User = JSON.parse(localStorage.getItem("user") || "{}");
    this.initialViewService.deleteUsername(user.id).toPromise();
  }

  public correctUsername(user: User): void {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      this.router.navigateByUrl("/admin");
    } else {
      alert("Invalid username!");
    }
  }
}
