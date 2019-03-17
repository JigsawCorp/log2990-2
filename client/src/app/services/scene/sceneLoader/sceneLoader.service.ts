import { Injectable } from "@angular/core";
import * as THREE from "three";
import { ICommonSceneModifications } from "../../../../../../common/model/scene/modifications/sceneModifications";
import { ICommonScene } from "../../../../../../common/model/scene/scene";
import { ModifiedSceneParserService } from "../../../services/scene/sceneParser/modified-scene-parser.service";
import { SceneParserService } from "../../../services/scene/sceneParser/scene-parser.service";
import { CameraGenerator } from "../../../services/scene/sceneRenderer/cameraGenerator";
import { ControlsGenerator } from "../sceneRenderer/controlsGenerator";
import { RendererGenerator } from "../sceneRenderer/rendererGenerator";

@Injectable({
    providedIn: "root",
})

export class SceneLoaderService {
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public scene: THREE.Scene;
    public async loadOriginalScene(container: HTMLElement | null, scene: ICommonScene, inGameMode: boolean): Promise<void> {
        this.scene = await new SceneParserService().parseScene(scene);
        this.renderScene(container, inGameMode);
    }

    public async loadModifiedScene(
            container: HTMLElement | null,
            scene: ICommonScene,
            sceneModifications: ICommonSceneModifications,
        ): Promise<void> {
        this.scene = await new ModifiedSceneParserService().parseModifiedScene(scene, sceneModifications);

        this.renderScene(container, true);
    }

    public async loadOnCanvas(canvas: HTMLCanvasElement, scene: ICommonScene): Promise<void> {
        this.scene = await new SceneParserService().parseScene(scene);

        this.renderOnCanvas(canvas);
    }

    private renderScene(container: HTMLElement | null, inGameMode: boolean): void {
        if (container) {
            this.renderer = RendererGenerator.generateRenderer(container.clientWidth,
                                                               container.clientHeight);
            container.appendChild(this.renderer.domElement);
            this.camera = CameraGenerator.createCamera(container.clientWidth, container.clientHeight);
            ControlsGenerator.generateGameControls(this.camera, container);
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
