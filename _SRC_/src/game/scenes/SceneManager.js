import { Graphics } from "pixi.js"
import { getAppScreen, kill, sceneAdd, sceneRemove, tickerAdd, tickerRemove } from "../../app/application"
import { createEnum } from "../../utils/functions"
import { EventHub, events } from "../../app/events"

import LoadScene from "./load/LoadScene"
import LevelScene from "./level/LevelScene"

export const SCENE_NAME = createEnum(
    ['Load', 'Level']
)

const SCENES = {
    [SCENE_NAME.Load] : LoadScene,
    [SCENE_NAME.Level] : LevelScene,
}

const SCENE_ALPHA_STEP = 0.0012
const SCENE_ALPHA_MIN = 0
const SCENE_ALPHA_MAX = 1
const BLOCKER_COLOR = 0x000000

let sceneManager = null
let lastSceneName = ''

export default class SceneManager {
    constructor() {
        if (sceneManager) return sceneManager

        this.scenesQueue = []
        this.screenData = getAppScreen()

        sceneManager = this

        this.blocker = this.createScreenBlocker()

        this.beforeSceneReplaceCallback = null

        EventHub.on( events.screenResize, this.screenResize, this)
        EventHub.on( events.startScene, this.startNewScene, this)
    }

    startNewScene(sceneName) {
        if (sceneName in SCENES) {
            
            this.add( new SCENES[sceneName]() )
            lastSceneName = sceneName
            
        } else {
            console.error('WRONG SCENE NAME:', sceneName)
        }
    }

    setOnBeforeSceneReplace(callback) {
        this.beforeSceneReplaceCallback = callback
    }

    screenResize(screenData) {
        this.screenData = screenData
        this.updateScreenBlockerSize()
        if (this.scenesQueue.length > 0) this.updateSceneSize()
    }
    
    updateSceneSize() {
        for (let i = 0; i < this.scenesQueue.length; i++) {
            if ('screenResize' in this.scenesQueue[i]) {
                this.scenesQueue[i].screenResize(this.screenData)
            }
        }
    }

    createScreenBlocker() {
        const blocker = new Graphics()
        blocker.rect(0, 0, this.screenData.width, this.screenData.height)
        blocker.fill(BLOCKER_COLOR)
        blocker.alpha = SCENE_ALPHA_MIN
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
    }
    hideScreenBlocker() {
        this.blocker.visible = false
        sceneRemove(this.blocker)

        if ('launchScene' in this.scenesQueue[0]) this.scenesQueue[0].launchScene()
    }

    add( scene ) {
        this.scenesQueue.push(scene)
        if (this.scenesQueue.length === 1) {
            this.updateSceneSize()
            sceneAdd(this.scenesQueue[0])
        }
        this.showScreenBlocker()
        tickerAdd(this)
    }

    replaceScenes() {
        if (this.beforeSceneReplaceCallback) {
            this.beforeSceneReplaceCallback()
        }

        sceneRemove(this.scenesQueue[0])
        kill(this.scenesQueue[0])
        
        this.scenesQueue = [ this.scenesQueue[this.scenesQueue.length - 1] ]
        this.updateSceneSize()

        sceneRemove(this.blocker)
        sceneAdd(this.scenesQueue[0])
        this.blocker.interactive = false
        this.blocker.cursor = "default"
        sceneAdd(this.blocker)
    }

    scenesReady() {
        tickerRemove(this)
        this.hideScreenBlocker()
    }

    tick(delta) {
        const alphaStep = delta * SCENE_ALPHA_STEP

        // если есть сцена на добавление
        if (this.scenesQueue.length > 1) {
            this.blocker.alpha = Math.min(SCENE_ALPHA_MAX, this.blocker.alpha + alphaStep)
            if (this.blocker.alpha === SCENE_ALPHA_MAX) this.replaceScenes()
            return
        }

        // сцена заменена
        this.blocker.alpha = Math.max(SCENE_ALPHA_MIN, this.blocker.alpha - alphaStep)
        if (this.blocker.alpha === SCENE_ALPHA_MIN) this.scenesReady()
    }

    kill() {
        EventHub.off( events.screenResize, this.screenResize, this)
        EventHub.off( events.startScene, this.startNewScene, this)
        while(this.scenesQueue.length) kill(this.scenesQueue[0])
        if (this.blocker) {
            sceneRemove(this.blocker)
            kill(this.blocker)
        }
    }
}