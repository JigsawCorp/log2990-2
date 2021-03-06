import { ElementRef, Injectable, OnDestroy } from "@angular/core";
import * as THREE from "three";
import { ICommonDifferenceFound } from "../../../../../../common/communication/webSocket/differenceFound";
import { Event, ICommonSocketMessage } from "../../../../../../common/communication/webSocket/socketMessage";
import { DifferenceType, ICommonReveal3D } from "../../../../../../common/model/reveal";
import { SceneLoaderService } from "../../scene/sceneLoader/sceneLoader.service";
import { SocketHandlerService } from "../../socket/socketHandler.service";
import { SocketSubscriber } from "../../socket/socketSubscriber";
import { IThreeObject, IThreeScene } from "./IThreeObject";

@Injectable({
    providedIn: "root",
})
export class ObjectRestorationService implements SocketSubscriber, OnDestroy {
    public originalScene: ElementRef<HTMLElement>;
    public modifiedScene: ElementRef<HTMLElement>;
    public detectedObjects: IThreeObject;

    public differenceFound: string[];

    public constructor(private socketService: SocketHandlerService,
                       private originalSceneLoader: SceneLoaderService,
                       private modifiedSceneLoader: SceneLoaderService,
                       private socket: SocketHandlerService) {
        this.differenceFound = [];
        this.subscribeToSocket();
    }

    public setContainers(originalScene: ElementRef<HTMLElement>, modifiedScene: ElementRef<HTMLElement>): void {
        this.originalScene = originalScene;
        this.modifiedScene = modifiedScene;
    }

    public set(originalSceneLoader: SceneLoaderService, modifiedSceneLoader: SceneLoaderService): void {
        this.originalSceneLoader = originalSceneLoader;
        this.modifiedSceneLoader = modifiedSceneLoader;
    }

    public ngOnDestroy(): void {
        this.socketService.unsubscribe(Event.DifferenceFound, this);
    }

    private subscribeToSocket(): void {
        this.socketService.subscribe(Event.DifferenceFound, this);
    }

    public async notify(event: Event, message: ICommonSocketMessage): Promise<void> {
        const response: ICommonReveal3D = (message.data as ICommonDifferenceFound).reveal as ICommonReveal3D;
        await this.restoreObject(response);
    }

    public async restoreObject(response: ICommonReveal3D): Promise<void> {
        const scenes: IThreeScene = { original: this.originalSceneLoader.scene, modified: this.modifiedSceneLoader.scene };
        switch (response.differenceType) {
            case DifferenceType.removedObject:
                this.addObject(response.difference_id, scenes, false);
                break;
            case DifferenceType.colorChanged:
                this.changeColorObject(response.difference_id, scenes);
                break;
            case DifferenceType.textureObjectChanged:
                await this.changeTextureObject(response.difference_id, scenes);
                break;
            case DifferenceType.addedObject:
                this.removeObject(response.difference_id, scenes);
                break;
            default:
                break;
        }
    }

    public addObject(objectOriginal: string, scene: IThreeScene, isTexture: boolean): void {
        if (this.isANewDifference(objectOriginal) || isTexture) {
            if (scene.original && scene.modified) {
                this.applyAdd(scene.original, scene.modified, objectOriginal);
                this.addDifference(objectOriginal);
            }
        }
    }

    private applyAdd(originalScene: THREE.Scene, modifiedScene: THREE.Scene, objectId: string): void {
        originalScene.children.forEach((element) => {
            if (element.userData.id === objectId) {
                modifiedScene.add(element.clone());
            }
        });
    }

    public removeObject(objectModified: string, scene: IThreeScene): void {
        if (this.isANewDifference(objectModified)) {
            if (scene.modified) {
                this.applyRemoval(scene.modified, objectModified);
            }
            this.addDifference(objectModified);
        }
    }

    private applyRemoval(modifiedScene: THREE.Scene, objectId: string): void {
        modifiedScene.children.forEach((element) => {
            if (element.userData.id === objectId) {
                modifiedScene.remove(element);
            }
        });
    }

    public changeColorObject(object: string, scenes: IThreeScene): void {
        if (this.isANewDifference(object)) {
            const originalSceneObject: THREE.Object3D | undefined = this.getOriginalSceneObject(object, scenes);
            if (scenes.modified) {
                this.applyColorChange(scenes.modified, originalSceneObject, object);
            }

        }
    }

    private applyColorChange(modifiedScene: THREE.Scene, originalSceneObject: THREE.Object3D | undefined, objectId: string): void {
        modifiedScene.children.forEach((sceneObject) => {
            if (sceneObject.userData.id === objectId) {
                // tslint:disable-next-line:no-any
                (sceneObject as any).material.color.setHex((originalSceneObject as any).material.color.getHex());
            }
        });
        this.addDifference(objectId);
    }

    private getOriginalSceneObject(object: string, scene:  IThreeScene): THREE.Object3D | undefined {
        if (scene.original) {
            return this.findOriginalObject(scene.original, object);
        }

        return undefined;
    }

    private findOriginalObject(originalScene: THREE.Scene, objectId: string): THREE.Object3D {
        let originalSceneObject: THREE.Object3D = new THREE.Object3D;
        originalScene.children.forEach((sceneObject) => {
            if (sceneObject.userData.id === objectId) {
                originalSceneObject = sceneObject;
            }
        });

        return originalSceneObject;
    }

    public async changeTextureObject(object: string, scene: IThreeScene): Promise<void> {
        if (this.isANewDifference(object)) {
            this.removeObject(object, scene);
            this.addObject(object, scene, true);
            this.addDifference(object);
        } else {
            this.socket.emitMessage(Event.InvalidClick, null);
        }
    }

    public addDifference(differenceId: string): void {
        this.differenceFound[this.differenceFound.length++] = differenceId;
    }

    private isANewDifference(differenceId: string): boolean {
        return !this.differenceFound.includes(differenceId);
    }
}
