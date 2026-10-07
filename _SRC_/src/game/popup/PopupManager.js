import { EventHub, events } from "../../app/events"
import { sceneAdd, sceneRemove, kill } from "../../app/application"
import { POPUP_TYPE } from "./popupTypes"
import Popup from "./Popup"
import Settings from "./Settings"
import Upgrade from "./Upgrade"
import Trapping from "./Trapping"
import BuildMine from "./BuildMine"
import BuildDragon from "./BuildDragon"
import BuildMagic from "./BuildMagic"
import BuildTower from "./BuildTower"
import BuildCatapult from "./BuildCatapult"

export let popupManager = null

function createContent(type, popup) {
    console.log(type)
    switch (type) {
        case POPUP_TYPE.SETTINGS: return new Settings(popup)
        case POPUP_TYPE.UPGRADE: return new Upgrade(popup)
        case POPUP_TYPE.TRAPPING: return new Trapping(popup)

        case POPUP_TYPE.BUILD_MINE: return new BuildMine(popup)
        case POPUP_TYPE.BUILD_DRAGON: return new BuildDragon(popup)
        case POPUP_TYPE.BUILD_MAGIC: return new BuildMagic(popup)
        case POPUP_TYPE.BUILD_TOWER: return new BuildTower(popup)
        case POPUP_TYPE.BUILD_CATAPULT: return new BuildCatapult(popup)
        case POPUP_TYPE.BUILD_ICE: return new BuildMine(popup)
        case POPUP_TYPE.BUILD_FIRE: return new BuildMine(popup)
    }
}

export default class PopupManager {
    constructor() {
        if (popupManager) return popupManager
        
        popupManager = this

        this.currentPopup = null
        this.queue = []

        EventHub.on(events.showPopup, this.show, this)
        EventHub.on(events.closePopup, this.close, this)

        console.log("[PopupManager] initialized")
    }

    show(type) {
        if (this.currentPopup && this.currentPopup.visible) {
            this.queue.push(type)
            return
        }
        this.showNext(type)
    }

    close() {
        if (this.currentPopup) {
            this.currentPopup.close()
        }
    }

    reset() {
        if (this.currentPopup) {
            sceneRemove(this.currentPopup)
            kill(this.currentPopup)
            this.currentPopup = null
        }
        this.queue.length = 0
    }

    showNext(type) {
        const popup = new Popup()

        const content = createContent(type, popup)
        if (!content) {
            console.error(`[PopupManager] Unknown content type: ${type}`)
            return
        }

        popup.content.addChild(content)

        popup.setOnCloseCallback(() => {
            this.onPopupClosed()
        })

        sceneAdd(popup)
        this.currentPopup = popup
        popup.show()
    }

    onPopupClosed() {
        if (this.currentPopup) {
            sceneRemove(this.currentPopup)
            kill(this.currentPopup)
            this.currentPopup = null
        }

        if (this.queue.length > 0) {
            const nextType = this.queue.shift()
            this.showNext(nextType)
        }
    }

    kill() {
        EventHub.off(events.showPopup, this.show, this)
        EventHub.off(events.closePopup, this.close, this)
        this.reset()
        PopupManager.instance = null
    }
}