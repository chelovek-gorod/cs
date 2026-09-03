import { Graphics } from "pixi.js"
import { getAppScreen, kill, sceneAdd, sceneRemove, setAfterTickerCallbacks, tickerAdd, tickerRemove } from "../../app/application"
import { createEnum } from "../../utils/functions"
import { EventHub, events } from "../../app/events"

import LoadScene from "./load/LoadScene"
import MenuScene from "./menu/MenuScene"
import LevelScene from "./level/LevelScene"
import { clearAllPools } from "../../utils/pool"
import { popupManager } from "../popup/PopupManager"

export const SCENE_NAME = createEnum(
    ['Load', 'Menu', 'Level']
)

const SCENES = {
    [SCENE_NAME.Load] : LoadScene,
    [SCENE_NAME.Menu] : MenuScene,
    [SCENE_NAME.Level] : LevelScene,
}

const BLOCKER_ALPHA_STEP = 0.0012
const BLOCKER_ALPHA_MIN = 0
const BLOCKER_ALPHA_MAX = 1
const BLOCKER_COLOR = 0x000000

let sceneManager = null
export let lastSceneName = ''

export default class SceneManager {
    constructor() {
        if (sceneManager) return sceneManager

        sceneManager = this

        this.currentScene = null
        this.nextSceneName = ''
        this.screenData = getAppScreen()

        this.blocker = this.createScreenBlocker()
        this.isBlockerAlphaAdd = false

        EventHub.on( events.screenResize, this.screenResize, this)
        EventHub.on( events.startScene, this.startNewScene, this)
    }

    startNewScene(sceneName) {
        if (sceneName === lastSceneName) return
        
        if (sceneName in SCENES === false) {
            return console.error('WRONG SCENE NAME:', sceneName)
        }

        this.nextSceneName = sceneName

        if (lastSceneName === '') {
            this.addNextScene()
            return
        }

        this.isBlockerAlphaAdd = true
        this.showScreenBlocker()
        tickerAdd(this)
    }

    screenResize(screenData) {
        this.screenData = screenData
        this.updateScreenBlockerSize()
        this.updateSceneSize()
    }
    
    updateSceneSize() {
        if (this.currentScene && 'screenResize' in this.currentScene) {
            this.currentScene.screenResize(this.screenData)
        }
    }

    createScreenBlocker() {
        const blocker = new Graphics()
        blocker.rect(0, 0, this.screenData.width, this.screenData.height)
        blocker.fill(BLOCKER_COLOR)
        blocker.alpha = BLOCKER_ALPHA_MAX
        blocker.interactive = true
        blocker.cursor = "default"
        blocker.visible = false
        return blocker
    }
    updateScreenBlockerSize() {
        this.blocker.clear()
        this.blocker.rect(0, 0, this.screenData.width, this.screenData.height)
        this.blocker.fill(BLOCKER_COLOR)
    }
    showScreenBlocker() {
        this.blocker.visible = true
        this.blocker.interactive = true
        sceneAdd(this.blocker)
        document.body.style.cursor = "default"
        this.blocker.cursor = "default"
        this.blocker.alpha = this.isBlockerAlphaAdd ? BLOCKER_ALPHA_MIN : BLOCKER_ALPHA_MAX
    }
    hideScreenBlocker() {
        this.blocker.visible = false
        sceneRemove(this.blocker)
    }

    addNextScene() {
        clearAllPools()

        lastSceneName = this.nextSceneName
        this.currentScene = new SCENES[this.nextSceneName]()
        sceneAdd(this.currentScene)
        this.updateSceneSize()

        this.isBlockerAlphaAdd = false
        this.showScreenBlocker()
        tickerAdd(this)
    }

    removePreviousScene() {
        if (popupManager) popupManager.reset()

        tickerRemove(this)
        sceneRemove(this.currentScene)
        sceneRemove(this.blocker)
        kill(this.currentScene)

        setAfterTickerCallbacks( this.addNextScene.bind(this) )
    }

    newSceneReady() {
        lastSceneName = this.nextSceneName
        tickerRemove(this)
        this.hideScreenBlocker()

        if ('launchScene' in this.currentScene) this.currentScene.launchScene()
    }

    tick(delta) {
        if (!this.blocker) return

        const alphaStep = delta * BLOCKER_ALPHA_STEP

        if (this.isBlockerAlphaAdd) {
            this.blocker.alpha = Math.min(BLOCKER_ALPHA_MAX, this.blocker.alpha + alphaStep)
            if (this.blocker.alpha === BLOCKER_ALPHA_MAX) this.removePreviousScene()
        } else {
            this.blocker.alpha = Math.max(BLOCKER_ALPHA_MIN, this.blocker.alpha - alphaStep)
            if (this.blocker.alpha === BLOCKER_ALPHA_MIN) this.newSceneReady()
        }
    }

    kill() {
        EventHub.off( events.screenResize, this.screenResize, this)
        EventHub.off( events.startScene, this.startNewScene, this)

        tickerRemove(this)
        if (this.blocker) {
            sceneRemove(this.blocker)
            this.blocker.destroy()
            this.blocker = null
        }

        if (this.currentScene) {
            sceneRemove(this.currentScene)
            kill(this.currentScene)
            this.currentScene = null
            lastSceneName = null
        }
    }
}