import { Container, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { closePopup, goldChanged } from "../../app/events"
import { gameState, fogPowerStep, fogPrice, fogPowerMax } from "../state"
import PopupButton from "./PopupButton"

export default class BuildFog extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        // Заголовок
        this.title = new Text({
            text: 'UPGRADE FOG',
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        this.isActive = false

        let sText, dText
        sText = `${gameState.fogCount} -> ${gameState.fogCount + 1}`
        dText = dText = fogPrice + '$'
        this.btnAddFog = new PopupButton(
            "ADD FOG",
            sText,
            dText,
            this.addFog.bind(this),
            () => gameState.gold >= fogPrice,
            -240, 0
        )
        this.addChild(this.btnAddFog)

        sText = `${gameState.fogPower} -> ${gameState.fogPower + fogPowerStep}`
        dText = dText = gameState.fogPowerPrice + '$'
        if (gameState.fogPower === fogPowerMax) {
            sText = gameState.fogPower
            dText = 'Maximum'
        }
        this.btnUpPower = new PopupButton(
            "ADD POWER",
            sText,
            dText,
            this.upPower.bind(this),
            () => gameState.gold >= gameState.fogPowerPrice && gameState.fogPower < fogPowerMax,
            240, 0
        )
        this.addChild(this.btnUpPower)

        this.btnClose = new PopupButton(
            "", "CLOSE", "",
            this.close.bind(this),
            () => true,
            0, 240
        )
        this.btnClose.subtitle.scale.set(1.5)
        this.addChild(this.btnClose)
    }

    setActive(isActive) {
        this.isActive = isActive
    }

    checkButtons() {
        this.btnAddFog.updateAvailable()
        this.btnUpPower.updateAvailable()
    }

    addFog() {
        gameState.gold -= fogPrice
        gameState.fogCount = gameState.fogCount + 1
        let sText, dText
        sText = `${gameState.fogCount} -> ${gameState.fogCount + 1}`
        dText = dText = fogPrice + '$'
        this.btnAddWizard.setSubtitle(sText)
        this.btnAddWizard.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upPower() {
        gameState.gold -= gameState.fogPowerPrice
        gameState.fogPower = Math.min(fogPowerMax, gameState.fogPower + fogPowerStep)
        gameState.fogPowerPrice *= 2
        let sText, dText
        sText = `${gameState.fogPower} -> ${gameState.fogPower + fogPowerStep}`
        dText = dText = gameState.fogPowerPrice + '$'
        if (gameState.fogPower === fogPowerMax) {
            sText = gameState.fogPower
            dText = 'Maximum'
        }
        this.btnUpPower.setSubtitle(sText)
        this.btnUpPower.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    close() {
        closePopup()
    }
}