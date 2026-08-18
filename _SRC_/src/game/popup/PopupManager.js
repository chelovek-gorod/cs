import { EventHub, events } from "../../app/events"
import { sceneAdd, sceneRemove, kill } from "../../app/application"
import Popup from "./Popup"
import Settings from "./Settings"
import { POPUP_TYPE } from "./popupTypes"
import Upgrade from "./Upgrade"

export default class PopupManager {
    constructor() {
        if (PopupManager.instance) {
            return PopupManager.instance
        }
        PopupManager.instance = this

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

        const content = this.createContent(type, popup)
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

    createContent(type, popup) {
        switch (type) {
            case POPUP_TYPE.SETTINGS: return new Settings(popup)
            case POPUP_TYPE.UPGRADE: return new Upgrade(popup)
        }
    }

    kill() {
        EventHub.off(events.showPopup, this.show, this)
        EventHub.off(events.closePopup, this.close, this)
        this.reset()
        PopupManager.instance = null
    }
}