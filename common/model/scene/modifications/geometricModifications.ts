import { ICommonSceneModifications } from "./sceneModifications";
import { Pair } from "../../pair";

export interface ICommonGeometricModifications extends ICommonSceneModifications {
    // Key is the id of the object that it's color changed, value is the hex color it changed to
    colorChangedObjects: Pair<string, number>[];
}