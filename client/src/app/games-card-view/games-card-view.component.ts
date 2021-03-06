import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { CREATE_BUTTON, DELETE_BUTTON, PLAY_BUTTON, RESET_BUTTON, SIMPLE_BUTTON } from "../../../../common/buttonName";
import { Message } from "../../../../common/communication/message";
import { ICommonGame } from "../../../../common/communication/webSocket/game";
import { Event, ICommonSocketMessage } from "../../../../common/communication/webSocket/socketMessage";
import { ICommonGameCard, ICommonScoreEntry, POVType } from "../../../../common/model/gameCard";
import { ICommonImagePair } from "../../../../common/model/imagePair";
import { ICommonScene } from "../../../../common/model/scene/scene";
import { _e, R } from "../ressources/strings";
import { MatchmakingService } from "../services/game/matchmaking.service";
import { GamesCardService } from "../services/gameCard/gamesCard.service";
import { ImagePairService } from "../services/image-pair/imagePair.service";
import { SceneService } from "../services/scene/scene.service";
import { SceneLoaderService } from "../services/scene/sceneLoader/sceneLoader.service";
import { SocketHandlerService } from "../services/socket/socketHandler.service";
import { StringFormater } from "../util/stringFormater";

@Component({
    selector: "app-games-card-view",
    providers: [SceneLoaderService],
    templateUrl: "./games-card-view.component.html",
    styleUrls: ["./games-card-view.component.css"],
})
export class GamesCardViewComponent implements OnInit {
    @Input() public gameCard: ICommonGameCard;
    @Input() public isInAdminView: boolean;
    @ViewChild("image") private image: ElementRef;
    @ViewChild("matchMakingButton") public matchMakingButton: ElementRef;
    public imagePair: ICommonImagePair;
    public scenePair: ICommonScene;

    public leftButton: string;
    public rightButton: string;
    public simplePOV: string;

    public waitOpponent: boolean;

    public constructor(
        private gamesCardService: GamesCardService,
        private sceneService: SceneService,
        private router: Router,
        private socketHandlerService: SocketHandlerService,
        private imagePairService: ImagePairService,
        public matchmaking: MatchmakingService) {
            this.rightButton = CREATE_BUTTON;
            this.leftButton = PLAY_BUTTON;
            this.simplePOV = SIMPLE_BUTTON;
            this.isInAdminView = false;
            this.waitOpponent = false;
        }

    public ngOnInit(): void {
        if (this.isInAdminView) {
            this.leftButton = DELETE_BUTTON;
            this.rightButton = RESET_BUTTON;
        }

        if (this.isSimplePov()) {
            this.getImagePairById();
        } else {
            this.getScenePairById();
        }
    }

    public toMinutes(index: number, times: ICommonScoreEntry[]): string {
        return StringFormater.secondsToMinutes(times[index].score);
    }

    public async onLeftButtonClick(): Promise<void> {
        if (this.isInAdminView) {
            this.deleteGameCard();
        } else {
            const gameUrl: string = (this.isSimplePov()) ? R.GAME_CARD_SIMPLE : R.GAME_CARD_FREE;
            await this.playSoloGame(gameUrl);
        }
    }

    private emitPlayGame(event: Event): void {
        const game: ICommonGame = {
            ressource_id: this.gameCard.resource_id,
            game_card_id: this.gameCard.id,
            pov: +POVType[this.gameCard.pov],
        };
        const message: ICommonSocketMessage = {
            data: game,
            timestamp: new Date(),
        };
        this.socketHandlerService.emitMessage(event, message);
    }

    private async playSoloGame(gameUrl: string): Promise<void> {
        this.gamesCardService.getGameById(this.gameCard.id).subscribe(async (response: ICommonGameCard | Message) => {
            if ((response as ICommonGameCard).id) {
                this.matchmaking.setIsActive(false);
                await this.router.navigateByUrl(gameUrl + this.gameCard.id);
                this.emitPlayGame(Event.PlaySoloGame);
            } else {
                alert(R.GAME_CARD_DELETED);
            }
        });
    }

    private async playMultiplayerGame(): Promise<void> {
        this.gamesCardService.getGameById(this.gameCard.id).subscribe(async (response: ICommonGameCard | Message) => {
            if ((response as ICommonGameCard).id) {
                this.changeMatchmakingType();
                this.matchmaking.setIsActive(true);
                this.emitPlayGame(Event.PlayMultiplayerGame);
            } else {
                alert(R.GAME_CARD_DELETED);
            }
        });
    }

    public async onRightButtonClick(): Promise<void> {
        (this.isInAdminView) ?
        this.resetBestTimes() :
        this.playMultiplayerGame();
    }

    public deleteGameCard(): void {
        if (confirm( _e(R.GAME_CARD_CONFIRM_DELETE, [this.gameCard.title]))) {
            this.gamesCardService.deleteGameCard(this.gameCard.id).subscribe(() => {
                window.location.reload();
            });
        }
    }

    public resetBestTimes(): void {
        if (confirm(_e(R.GAME_CARD_CONFIRM_RESET, [this.gameCard.title]))) {
            this.gamesCardService.resetBestTimes(this.gameCard).subscribe((message: Message) => {
                if (message.title !== "Error") {
                    window.location.reload();
                }
            });
        }
    }

    private isSimplePov(): boolean {
        return this.gameCard.pov.toString() === this.simplePOV;
    }

    private getImagePairById(): void {
        this.imagePairService.getImagePairById(this.gameCard.resource_id).subscribe((imagePair: ICommonImagePair) => {
            this.imagePair = imagePair;
            this.image.nativeElement.src = imagePair.url_original;
        });
    }

    private getScenePairById(): void {
        this.sceneService.getSceneById(this.gameCard.resource_id).subscribe((scenePair: ICommonScene) => {
            this.scenePair = scenePair;
            this.image.nativeElement.src = `http://localhost:3000/scene/${scenePair.id}/thumbnail`;
        });
    }

    public onClosed(closed: boolean): void {
        if (closed) {
            const message: ICommonSocketMessage = {
                data: this.gameCard.resource_id,
                timestamp: new Date(),
            };
            this.changeMatchmakingType();
            this.socketHandlerService.emitMessage(Event.CancelMatchmaking, message);
        }
    }

    private changeMatchmakingType(): void {
        this.waitOpponent = !this.waitOpponent;
    }
}
