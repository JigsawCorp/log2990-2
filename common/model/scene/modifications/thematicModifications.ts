import { ICommonSceneModifications } from "./sceneModifications";
import { Textures } from "../objects/thematicObjects/thematicObject";
import { Pair } from "../../pair";

export interface ICommonThematicModifications extends ICommonSceneModifications {
    // Key is the id of the object that it's color changed, value is the texture it changed to
    texturesChangedObjects: Pair<string, Textures>[];
}