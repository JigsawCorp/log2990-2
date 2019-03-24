import { Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Ng4LoadingSpinnerService } from "ng4-loading-spinner";
import { Event } from "../../../../common/communication/webSocket/socketMessage";
import { ICommonGameCard } from "../../../../common/model/gameCard";
import { ICommonSceneModifications } from "../../../../common/model/scene/modifications/sceneModifications";
import { ICommonScene } from "../../../../common/model/scene/scene";
import { R } from "../ressources/strings";
import { IdentificationError } from "../services/IdentificationError/identificationError.service";
import { CheatModeHandlerService } from "../services/cheatMode/cheatModeHandler.service";
import { GameService } from "../services/game/game.service";
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
    providers: [SceneSyncerService],
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

    private scenePairID: string;
    private currentOriginalScene: ICommonScene;
    private currentModifiedScene: ICommonSceneModifications;
    private gameCardId: string;
    private originalSceneLoader: SceneLoaderService;
    private modifiedSceneLoader: SceneLoaderService;
    private meshesOriginal: THREE.Object3D[] = [];
    private meshesModified: THREE.Object3D[] = [];
    public isGameOver: boolean;
    public playerTime: string;

    public constructor( private route: ActivatedRoute,
                        private spinnerService: Ng4LoadingSpinnerService,
                        public sceneService: SceneService,
                        public gamesCardService: GamesCardService,
                        private sceneSyncer: SceneSyncerService,
                        public cheatModeHandlerService: CheatModeHandlerService,
                        public chat: Chat,
                        private game: GameService,
                        private identificationError: IdentificationError,
                        public objectHandler: ObjectHandler,
                        public objectRestoration: ObjectRestorationService,
                        public socketHandler: SocketHandlerService) {
        this.originalSceneLoader = new SceneLoaderService();
        this.modifiedSceneLoader = new SceneLoaderService();

        this.isGameOver = false;
        this.game.gameEnded.subscribe((value) => {
            this.playerTime = value.time;
            this.isGameOver = value.isGameOver;
        });
        this.game.resetTime();
    }

    public ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.gameCardId = params["id"];
        });

        this.userDifferenceFound.nativeElement.innerText = R.ZERO;
        this.spinnerService.show();
        this.setServicesContainers();
        this.getGameCardById();
    }

    private setServicesContainers(): void {
        this.game.setContainers(this.chronometer.nativeElement, this.userDifferenceFound.nativeElement);
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
            this.scenePairID = gameCard.resource_id;
            this.gameTitle.nativeElement.innerText = gameCard.title;
            this.loadScene();
        });
    }

    // tslint:disable
    private loadScene(): void {
        this.sceneService.getSceneById(this.scenePairID).subscribe(async (sceneResponse: ICommonScene) => {
            this.sceneService.getModifiedSceneById(this.scenePairID).subscribe(async (sceneModified: ICommonSceneModifications) => {
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

                this.sceneSyncer.syncScenesMovement(
                    this.originalSceneLoader.camera, this.originalScene.nativeElement,
                    this.modifiedSceneLoader.camera, this.modifiedScene.nativeElement);
                this.spinnerService.hide();

                this.fillMeshes(this.meshesOriginal, this.originalSceneLoader);
                this.fillMeshes(this.meshesModified, this.modifiedSceneLoader);
                this.setRestoreObjectService();
                this.clickEvent(this.originalScene.nativeElement);
                this.clickEvent(this.modifiedScene.nativeElement);

                this.socketHandler.emitMessage(Event.ReadyToPlay, null);
            });
        });
    }

    private setRestoreObjectService(): void {
        this.objectHandler.meshesOriginal = this.meshesOriginal;
        this.objectHandler.meshesModified = this.meshesModified;
        this.objectHandler.originalGame = this.originalScene;
        this.objectHandler.modifiedGame = this.modifiedScene;
        this.objectHandler.originalSceneLoader = this.originalSceneLoader;
        this.objectHandler.modifiedSceneLoader = this.modifiedSceneLoader;
    }

    private clickEvent(scene: HTMLElement): void {
        scene.addEventListener("click", (event: MouseEvent) =>
                    this.objectHandler.clickOnScene(event, true));
    }

    private fillMeshes(meshes: THREE.Object3D[], sceneLoader: SceneLoaderService): void {
        sceneLoader.scene.traverse((element) => {
            if (element.type === "Mesh" || element.type === "Scene") {
                meshes.push(element);
            }
        });
    }

}
