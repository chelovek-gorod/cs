import { startScene } from "../app/events";
import PopupManager from "./popup/PopupManager";
import SceneManager, { SCENE_NAME } from "./scenes/SceneManager";

export function startGame() {
    new SceneManager()
    new PopupManager()

    startScene(SCENE_NAME.Load)
}