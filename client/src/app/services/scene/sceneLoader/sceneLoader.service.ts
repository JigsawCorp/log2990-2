import { Injectable } from "@angular/core";
import * as THREE from "three";
import { ICommonSceneModifications } from "../../../../../../common/model/scene/modifications/sceneModifications";
import { ICommonScene } from "../../../../../../common/model/scene/scene";
import { CameraGenerator } from "../../../services/scene/sceneRenderer/cameraGenerator";
import { ICommonSceneAndObjects } from "../sceneParser/ICommonSceneAndObjects";
import { ModifiedSceneParserService } from "../sceneParser/modifiedSceneParser.service";
import { SceneParserService } from "../sceneParser/sceneParser.service";
import { ControlsGenerator } from "../sceneRenderer/controlsGenerator";
import { RendererGenerator } from "../sceneRenderer/rendererGenerator";

@Injectable({
    providedIn: "root",
})

export class SceneLoaderService {
    private static sceneObjects: THREE.Object3D[] = new Array<THREE.Object3D>();
    public camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    public scene: THREE.Scene;

    public async loadOriginalScene(container: HTMLElement | null, scene: ICommonScene): Promise<void> {
        const sceneAndObjects: ICommonSceneAndObjects = await new SceneParserService(scene).parseScene();
        this.scene = sceneAndObjects.scene;

        sceneAndObjects.objects.forEach((element: THREE.Object3D) => {
            SceneLoaderService.sceneObjects.push(element);
        });
        this.renderScene(container);
    }

    public async loadModifiedScene(
        container: HTMLElement | null,
        scene: THREE.Scene,
        sceneModifications: ICommonSceneModifications,
        ): Promise<void> {

        const sceneAndObjects: ICommonSceneAndObjects = await new ModifiedSceneParserService(sceneModifications.type)
            .parseModifiedScene(scene, sceneModifications);
        this.scene = sceneAndObjects.scene;

        sceneAndObjects.objects.forEach((element: THREE.Object3D) => {
            SceneLoaderService.sceneObjects.push(element);
        });
        this.renderScene(container);
    }

    public async loadOnCanvas(canvas: HTMLCanvasElement, scene: ICommonScene): Promise<void> {
        const sceneAndObjects: ICommonSceneAndObjects = await new SceneParserService(scene).parseScene();
        this.scene = sceneAndObjects.scene;
        this.renderOnCanvas(canvas);
    }

    private renderScene(container: HTMLElement | null): void {
        if (container) {
            this.renderer = RendererGenerator.generateRenderer(container.clientWidth,
                                                               container.clientHeight);
            container.appendChild(this.renderer.domElement);
            this.camera = CameraGenerator.createCamera(container.clientWidth, container.clientHeight);

            ControlsGenerator.generateGameControls(this.camera, SceneLoaderService.sceneObjects);
            this.animate();
        }
    }

    private renderOnCanvas(canvas: HTMLCanvasElement): void {
        if (canvas) {
            this.renderer = RendererGenerator.generateRendererOnCanvas(canvas);
            this.camera = CameraGenerator.createCamera(canvas.width, canvas.height);
            this.animate();
        }
    }

    private animate: Function = () => {
        requestAnimationFrame(this.animate as FrameRequestCallback);
        this.renderer.render(this.scene, this.camera);
    }
}
