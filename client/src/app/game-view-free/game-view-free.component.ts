import { Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Ng4LoadingSpinnerService } from "ng4-loading-spinner";
import { Event } from "../../../../common/communication/webSocket/socketMessage";
import { ICommonGameCard } from "../../../../common/model/gameCard";
import { ICommonSceneModifications } from "../../../../common/model/scene/modifications/sceneModifications";
import { ICommonScene, ObjectType } from "../../../../common/model/scene/scene";
import { GameEnding } from "../models/game/gameEnding";
import { R } from "../ressources/strings";
import { IdentificationError } from "../services/IdentificationError/identificationError.service";
import { CheatModeHandlerService } from "../services/cheatMode/cheatModeHandler.service";
import { GameFreePOVService } from "../services/game/gameFreePOV.service";
import { MatchmakingService } from "../services/game/matchmaking.service";
import { GamesCardService } from "../services/gameCard/gamesCard.service";
import { SceneService } from "../services/scene/scene.service";
import { ObjectRestorationService } from "../services/scene/sceneDetection/object-restoration.service";
import { ObjectHandler } from "../services/scene/sceneDetection/objects-handler.service";
import { SceneLoaderService } from "../services/scene/sceneLoader/sceneLoader.service";
import { SceneSyncerService } from "../services/scene/sceneSyncer/sceneSyncer.service";
import { Chat } from "../services/socket/chat";
import { SocketHandlerService } from "../services/socket/socketHandler.service";

@Component({
    selector: "app-game-view-free",
    templateUrl: "./game-view-free.component.html",
    styleUrls: ["./game-view-free.component.css"],
    providers: [SceneSyncerService,
                ObjectHandler,
                ObjectRestorationService,
                GameFreePOVService],
})

export class GameViewFreeComponent implements OnInit {

    @ViewChild("originalScene") private originalScene: ElementRef;
    @ViewChild("modifiedScene") private modifiedScene: ElementRef;
    @ViewChild("chronometer") private chronometer: ElementRef;
    @ViewChild("errorMessage") private errorMessage: ElementRef;
    @ViewChild("gameTitle") private gameTitle: ElementRef;
    @ViewChild("message") private message: ElementRef;
    @ViewChild("message_container") private messageContainer: ElementRef;
    @ViewChild("userDifferenceFound") private userDifferenceFound: ElementRef;
    @ViewChild("opponentDifferenceFound") private opponentDifferenceFound: ElementRef;

    private scenePairId: string;
    private currentOriginalScene: ICommonScene;
    private currentModifiedScene: ICommonSceneModifications;
    private gameCardId: string;
    public gameCard: ICommonGameCard;
    private originalSceneLoader: SceneLoaderService;
    private modifiedSceneLoader: SceneLoaderService;
    private meshesOriginal: THREE.Object3D[];
    private meshesModified: THREE.Object3D[];
    public isGameOver: boolean;
    public isSoloGame: boolean;
    public playerTime: string;
    public winner: string;

    public constructor( private route: ActivatedRoute,
                        private spinnerService: Ng4LoadingSpinnerService,
                        public sceneService: SceneService,
                        public gamesCardService: GamesCardService,
                        private sceneSyncer: SceneSyncerService,
                        public cheatModeHandlerService: CheatModeHandlerService,
                        public chat: Chat,
                        private gameFree: GameFreePOVService,
                        private matchmaking: MatchmakingService,
                        private identificationError: IdentificationError,
                        public objectHandler: ObjectHandler,
                        public objectRestoration: ObjectRestorationService,
                        public socketHandler: SocketHandlerService) {
        this.originalSceneLoader = new SceneLoaderService();
        this.modifiedSceneLoader = new SceneLoaderService();
        this.meshesOriginal = [];
        this.meshesModified = [];

        this.subscribeToGame();
        this.gameFree.resetTime();
    }

    public ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.gameCardId = params["id"];
        });

        this.userDifferenceFound.nativeElement.innerText = R.ZERO;
        this.isSoloGame = !this.matchmaking.getIsActive();
        this.spinnerService.show();
        this.setServicesContainers();
        this.getGameCardById();
        this.gameFree.setControls(this.sceneSyncer);
    }

    private subscribeToGame(): void {
        this.gameFree.gameEnded.subscribe((value: GameEnding) => {
            this.playerTime = value.time;
            this.isGameOver = value.isGameOver;
            this.winner = value.winner;
        });

        this.gameFree.differenceUser.subscribe((value: string) => {
            this.userDifferenceFound.nativeElement.innerText = value;
        });

        this.gameFree.differenceOpponent.subscribe((value: string) => {
            this.opponentDifferenceFound.nativeElement.innerText = value;
        });

        this.gameFree.chronometer.subscribe((value: string) => {
            this.chronometer.nativeElement.innerText = value;
        });
    }

    private setServicesContainers(): void {
        this.chat.setContainers(this.message.nativeElement, this.messageContainer.nativeElement);
        this.identificationError.setContainers(this.errorMessage.nativeElement,
                                               this.originalScene.nativeElement,
                                               this.modifiedScene.nativeElement);

        this.objectRestoration.setContainers(this.originalScene.nativeElement, this.modifiedScene.nativeElement);
    }

    @HostListener("document:keydown", ["$event"])
    public async toggleCheatMode(event: KeyboardEvent): Promise<void> {
        this.cheatModeHandlerService.keyPressed(event, this.originalSceneLoader, this.modifiedSceneLoader);
    }

    private getGameCardById(): void {
        this.gamesCardService.getGameById(this.gameCardId).subscribe((gameCard: ICommonGameCard) => {
            this.gameCard = gameCard;
            this.scenePairId = gameCard.resource_id;
            this.gameTitle.nativeElement.innerText = gameCard.title;
            this.loadScene();
        });
    }

    private loadScene(): void {
        this.sceneService.getSceneById(this.scenePairId).subscribe(async (sceneResponse: ICommonScene) => {
            this.sceneService.getModifiedSceneById(this.scenePairId).subscribe(async (sceneModified: ICommonSceneModifications) => {
                this.currentOriginalScene = sceneResponse;
                this.currentModifiedScene = sceneModified;
                this.cheatModeHandlerService.currentOriginalScene = this.currentOriginalScene;
                this.cheatModeHandlerService.currentModifiedScene = this.currentModifiedScene;

                await this.originalSceneLoader.loadOriginalScene(
                        this.originalScene.nativeElement,
                        this.currentOriginalScene,
                );
                await this.modifiedSceneLoader.loadModifiedScene(
                        this.modifiedScene.nativeElement,
                        this.originalSceneLoader.scene,
                        this.currentModifiedScene,
                );

                this.prepareScene();
                this.setRestoreObjectService();
            });
        });
    }

    private prepareScene(): void {
        this.sceneSyncer.syncScenesMovement(
            this.originalSceneLoader.camera, this.originalScene.nativeElement,
            this.modifiedSceneLoader.camera, this.modifiedScene.nativeElement);
        this.spinnerService.hide();

        this.fillMeshes(this.meshesOriginal, this.originalSceneLoader);
        this.fillMeshes(this.meshesModified, this.modifiedSceneLoader);
        this.clickEvent(this.originalScene.nativeElement, true);
        this.clickEvent(this.modifiedScene.nativeElement, false);
        this.objectRestoration.set(this.originalSceneLoader, this.modifiedSceneLoader);

        this.socketHandler.emitMessage(Event.ReadyToPlay, null);
    }

    private setRestoreObjectService(): void {
        this.objectHandler.meshesOriginal = this.meshesOriginal;
        this.objectHandler.meshesModified = this.meshesModified;
        this.objectHandler.originalGame = this.originalScene;
        this.objectHandler.modifiedGame = this.modifiedScene;
        this.objectHandler.originalSceneLoader = this.originalSceneLoader;
        this.objectHandler.modifiedSceneLoader = this.modifiedSceneLoader;
        this.objectHandler.scenePairId = this.scenePairId;
        this.objectHandler.gameType = this.isGameThematic() ? ObjectType.Thematic : ObjectType.Geometric;
    }

    private clickEvent(scene: HTMLElement, isOriginalScene: boolean): void {
        scene.addEventListener("click", async (event: MouseEvent) =>
                    this.objectHandler.clickOnScene(event, isOriginalScene));
    }

    private fillMeshes(meshes: THREE.Object3D[], sceneLoader: SceneLoaderService): void {
        sceneLoader.scene.traverse((element) => {
            if (element.type === "Mesh" || element.type === "Scene") {
                meshes.push(element);
            }
        });
    }

    private isGameThematic(): boolean {
        return this.currentModifiedScene.type === ObjectType.Thematic;
    }

}
