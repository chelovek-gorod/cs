import { Container, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { closePopup, goldChanged } from "../../app/events"
import { gameState, iceAdd, iceDurationStep, icePrice, iceFreezeDepthStep, iceFreezeDepthMax } from "../state"
import PopupButton from "./PopupButton"

export default class BuildIce extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        this.title = new Text({
            text: 'UPGRADE ICE ARROWS',
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        this.isActive = false

        let sText, dText
        sText = `${gameState.iceCount} -> ${gameState.iceCount + iceAdd}`
        dText = icePrice + '$'
        this.btnAddIce = new PopupButton(
            "ADD ICE ARROWS",
            sText,
            dText,
            this.addIce.bind(this),
            () => gameState.gold >= icePrice,
            -240, 0
        )
        this.addChild(this.btnAddIce)

        const depthNow = gameState.iceFreezeDepth
        const depthNext = Math.min(iceFreezeDepthMax, depthNow + iceFreezeDepthStep)
        sText = `${depthNow.toFixed(1)} -> ${depthNext.toFixed(1)}`
        dText = gameState.iceFreezeDepthPrice + '$'
        if (depthNow >= iceFreezeDepthMax) {
            sText = depthNow.toFixed(1)
            dText = 'Maximum'
        }
        this.btnUpFreezeDepth = new PopupButton(
            "UPGRADE FREEZE",
            sText,
            dText,
            this.upFreezeDepth.bind(this),
            () => gameState.gold >= gameState.iceFreezeDepthPrice && gameState.iceFreezeDepth < iceFreezeDepthMax,
            0, 0
        )
        this.addChild(this.btnUpFreezeDepth)

        sText = `${(gameState.iceDuration * 0.001).toFixed(1)} -> ${((gameState.iceDuration + iceDurationStep) * 0.001).toFixed(1)} sec`
        dText = gameState.iceDurationPrice + '$'
        this.btnUpDuration = new PopupButton(
            "UPGRADE DURATION",
            sText,
            dText,
            this.upDuration.bind(this),
            () => gameState.gold >= gameState.iceDurationPrice,
            240, 0
        )
        this.addChild(this.btnUpDuration)

        this.btnClose = new PopupButton(
            "", "CLOSE", "",
            this.close.bind(this),
            () => true,
            240, 240
        )
        this.btnClose.subtitle.scale.set(1.5)
        this.addChild(this.btnClose)
    }

    setActive(isActive) {
        this.isActive = isActive
    }

    checkButtons() {
        this.btnAddIce.updateAvailable()
        this.btnUpFreezeDepth.updateAvailable()
        this.btnUpDuration.updateAvailable()
    }

    addIce() {
        gameState.gold -= icePrice
        gameState.iceCount += iceAdd
        let sText = `${gameState.iceCount} -> ${gameState.iceCount + iceAdd}`
        this.btnAddIce.setSubtitle(sText)

        goldChanged()

        this.checkButtons()
    }

    upFreezeDepth() {
        gameState.gold -= gameState.iceFreezeDepthPrice

        // Округление до 0.1 защищает от 1.1999999999 —
        // без него на следующем шаге float даст 2.0000000001 или 1.9999999999
        // и проверка ">= max" / "< max" сработает не вовремя
        const next = Math.round((gameState.iceFreezeDepth + iceFreezeDepthStep) * 10) / 10
        gameState.iceFreezeDepth = Math.min(iceFreezeDepthMax, next)

        gameState.iceFreezeDepthPrice *= 2

        const depthNow = gameState.iceFreezeDepth
        const depthNext = Math.min(iceFreezeDepthMax, depthNow + iceFreezeDepthStep)
        let sText = `${depthNow.toFixed(1)} -> ${depthNext.toFixed(1)}`
        let dText = gameState.iceFreezeDepthPrice + '$'
        if (depthNow >= iceFreezeDepthMax) {
            sText = depthNow.toFixed(1)
            dText = 'Maximum'
        }
        this.btnUpFreezeDepth.setSubtitle(sText)
        this.btnUpFreezeDepth.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upDuration() {
        gameState.gold -= gameState.iceDurationPrice
        gameState.iceDuration = gameState.iceDuration + iceDurationStep
        gameState.iceDurationPrice *= 2

        const sText = `${(gameState.iceDuration * 0.001).toFixed(1)} -> ${((gameState.iceDuration + iceDurationStep) * 0.001).toFixed(1)} sec`
        const dText = gameState.iceDurationPrice + '$'
        this.btnUpDuration.setSubtitle(sText)
        this.btnUpDuration.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    close() {
        closePopup()
    }
}