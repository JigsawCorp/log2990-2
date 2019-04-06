import { Injectable } from "@angular/core";
import * as THREE from "three";
import { ICommonSceneObject } from "../../../../../../common/model/scene/objects/sceneObject";
import { ICommonScene } from "../../../../../../common/model/scene/scene";
import { ISceneBoundingBox } from "./ISceneBoundingBox";
import { AbstractSceneParser } from "./abstractSceneParserService";

@Injectable({
    providedIn: "root",
})
export class SceneParserService extends AbstractSceneParser {
    public constructor(scene: ICommonScene) {
        super(scene);
    }

    public async parseScene(): Promise<ISceneBoundingBox> {
        const scene: THREE.Scene = await this.createScene();

        const bbox: THREE.Box3[] = await this.parseObjects(scene, this.sceneModel.sceneObjects);
        // tslint:disable-next-line:no-unnecessary-local-variable
        const sceneBoundingBox: ISceneBoundingBox = {
            scene: scene,
            bbox: bbox,
        };

        return sceneBoundingBox;
    }

    // tslint:disable-next-line:max-func-body-length
    private async parseObjects(scene: THREE.Scene, sceneObjects: ICommonSceneObject[]): Promise<THREE.Box3[]> {

        const boundingBoxes: THREE.Box3[] = new Array<THREE.Box3>();
        const promises: Promise<THREE.Object3D>[] = sceneObjects.map(
            async (object: ICommonSceneObject) => this.sceneObjectParser.parse(object));
        // tslint:disable-next-line:max-func-body-length
        await Promise.all(promises).then((v: THREE.Object3D[]) => {
            // tslint:disable-next-line:max-func-body-length
            v.forEach((element, index: number) => {
                // console.log("g");
                if (element.name === "lamp.gltf") {
                    // console.log(element.position);
                    // tslint:disable:no-magic-numbers
                    // const vect3dMin1: THREE.Vector3 = new THREE.Vector3(element.position.x - 0.24, element.position.y,
                    //                                                     element.position.z - 0.24);
                    // const vect3dMax1: THREE.Vector3 = new THREE.Vector3(element.position.x + 0.24, element.position.y + 4.75,
                    //                                                     element.position.z + 0.24);

                    const box3dBottom: THREE.Box3 = new THREE.Box3();

                    const geometry1: THREE.BoxGeometry = new THREE.BoxGeometry( 0.48, (element.position.y + 9) * element.scale.y, 0.48 );
                    const material1: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
                    const cube1: THREE.Mesh = new THREE.Mesh( geometry1, material1 );
                    cube1.position.set(element.position.x, element.position.y, element.position.z);

                    box3dBottom.setFromObject(cube1);

                    // box3dBottom.set(vect3dMin1, vect3dMax1);

                    // const vect3dMin2: THREE.Vector3 = new THREE.Vector3(element.position.x - 0.24, element.position.y,
                    //                                                     element.position.z - 0.24);
                    // const vect3dMax2: THREE.Vector3 = new THREE.Vector3(element.position.x + 0.24, element.position.y + 4.75,
                    //                                                     element.position.z + 0.24);
                    // const box3dTop: THREE.Box3 = new THREE.Box3();
                    // box3dTop.set(vect3dMin2, vect3dMax2);

                    const box3dTop: THREE.Box3 = new THREE.Box3();
                    // tslint:disable-next-line:max-line-length
                    const geometry2: THREE.BoxGeometry = new THREE.BoxGeometry( 6 * element.scale.x, 1.3 * element.scale.y , 0.72 * element.scale.z);
                    const material2: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
                    const cube2: THREE.Mesh = new THREE.Mesh( geometry2, material2 );
                    cube2.position.set(element.position.x, (element.position.y + 5.2) * element.scale.y, element.position.z);

                    scene.add(cube2);
                    cube2.rotation.y = sceneObjects[index].orientation.yAngle;

                    box3dTop.setFromObject(cube2);

                    // const color: THREE.Color = new THREE.Color(0xffff00);
                    // const helper1: THREE.BoxHelper = new THREE.BoxHelper(cube1, color);
                    // const helper2: THREE.BoxHelper = new THREE.BoxHelper(cube2, color);

                    // const mat4: THREE.Matrix4 = new THREE.Matrix4();
                    // mat4.extractRotation( element.matrixWorld );
                    // helper1.applyMatrix( mat4 );

                    // helper2.update();
                    // const mat4_2: THREE.Matrix4 = new THREE.Matrix4();
                    // mat4_2.extractRotation( cube2.matrixWorld );
                    // helper2.applyMatrix( mat4_2 );

                    // scene.add(helper1);
                    // scene.add(helper2);
                    boundingBoxes.push(box3dBottom);
                    boundingBoxes.push(box3dTop);
                    // console.log(element.position);
                } else {
                    const box3d: THREE.Box3 = new THREE.Box3();
                    box3d.setFromObject(element);

                    // const color: THREE.Color = new THREE.Color(0xffff00);
                    // const helper: THREE.BoxHelper = new THREE.BoxHelper(element, color);
                    // scene.add(helper);
                    boundingBoxes.push(box3d);
                }
            });
            scene.add(...v);
        });

        return boundingBoxes;
    }

}
