import { Component, Input, OnInit, ViewChild, ViewContainerRef } from "@angular/core";
import { ICommonGameCard, POVType } from "../../../../common/model/gameCard";
import { MatchmakingService } from "../services/game/matchmaking.service";
import { GameCardLoaderService } from "../services/gameCard/gameCardLoader.service";
import { GamesCardService } from "../services/gameCard/gamesCard.service";

@Component({
    selector: "app-games-list-view",
    templateUrl: "./games-list-view.component.html",
    styleUrls: ["./games-list-view.component.css"],
})
export class GamesListViewComponent implements OnInit {
    @ViewChild("simplePOVGamesContainer", { read: ViewContainerRef }) private simplePOVContainer: ViewContainerRef;
    @ViewChild("freePOVGamesContainer", { read: ViewContainerRef }) private freePOVContainer: ViewContainerRef;
    @Input() public isInAdminView: boolean;

    public constructor(
        public gameCardsService: GamesCardService,
        public gameCardLoaderService: GameCardLoaderService,
        public matchmakingService: MatchmakingService) {
            this.isInAdminView = false;
    }

    public ngOnInit(): void {
        this.gameCardLoaderService.setContainer(this.simplePOVContainer, POVType.Simple);
        this.gameCardLoaderService.setContainer(this.freePOVContainer, POVType.Free);
        this.addAllGameCards();
        this.matchmakingService.setGameList(this.gameCardLoaderService.gamesList);
    }

    private addAllGameCards(): void {
        this.gameCardsService.getGameCards().subscribe((gameCards: ICommonGameCard[]) => {
            gameCards.forEach((gameCard: ICommonGameCard) => {
                this.gameCardLoaderService.addDynamicComponent(gameCard, this.isInAdminView);
            });
            this.matchmakingService.getWaitingRooms();
        });
    }
}
