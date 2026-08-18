import { startScene } from "../app/events";
import PopupManager from "./popup/PopupManager";
import SceneManager, { SCENE_NAME } from "./scenes/SceneManager";

export function startGame() {
    const sceneManager = new SceneManager()
    const popupManager = new PopupManager()

    sceneManager.setOnBeforeSceneReplace(() => popupManager.reset())

    startScene(SCENE_NAME.Load)
}