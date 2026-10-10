import { Container, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { closePopup, goldChanged } from "../../app/events"
import { gameState, trapPrice, trapsAdd, trapPowerStep, trapPowerMax, trapRadiusStep, trapRadiusMax } from "../state"
import PopupButton from "./PopupButton"

export default class BuildTraps extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        // Заголовок
        this.title = new Text({
            text: 'UPGRADE TRAPS',
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        this.isActive = false

        let sText, dText
        sText = `${gameState.trapsCount} -> ${gameState.trapsCount + trapsAdd}`
        dText = trapPrice + '$'
        this.btnAddTraps = new PopupButton(
            "ADD TRAPS",
            sText,
            dText,
            this.addTraps.bind(this),
            () => gameState.gold >= trapPrice,
            -240, 0
        )
        this.addChild(this.btnAddTraps)

        sText = `${gameState.trapPower} -> ${gameState.trapPower + trapPowerStep}`
        dText = gameState.trapPowerPrice + '$'
        if (gameState.trapPower === trapPowerMax) {
            sText = gameState.trapPower
            dText = 'Maximum'
        }
        this.btnUpPower = new PopupButton(
            "UPGRADE POWER",
            sText,
            dText,
            this.upPower.bind(this),
            () => gameState.gold >= gameState.trapPowerPrice && gameState.trapPower < trapPowerMax,
            0, 0
        )
        this.addChild(this.btnUpPower)

        sText = `${gameState.trapRadius} -> ${gameState.trapRadius + trapRadiusStep}`
        dText = gameState.trapRadiusPrice + '$'
        if (gameState.trapRadius === trapRadiusMax) {
            sText = gameState.trapRadius
            dText = 'Maximum'
        }
        this.btnUpRadius = new PopupButton(
            "UPGRADE RADIUS",
            sText,
            dText,
            this.upRadius.bind(this),
            () => gameState.gold >= gameState.trapRadiusPrice && gameState.trapRadius < trapRadiusMax,
            240, 0
        )
        this.addChild(this.btnUpRadius)

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
        this.btnAddTraps.updateAvailable()
        this.btnUpPower.updateAvailable()
        this.btnUpRadius.updateAvailable()
    }

    addTraps() {
        gameState.gold -= trapPrice
        gameState.trapsCount += trapsAdd
        let sText = `${gameState.trapsCount} -> ${gameState.trapsCount + trapsAdd}`
        this.btnAddTraps.setSubtitle(sText)

        goldChanged()

        this.checkButtons()
    }

    upPower() {
        gameState.gold -= gameState.trapPowerPrice
        gameState.trapPower = Math.min(trapPowerMax, gameState.trapPower + trapPowerStep)
        gameState.trapPowerPrice *= 2

        let sText, dText
        sText = `${gameState.trapPower} -> ${gameState.trapPower + trapPowerStep}`
        dText = gameState.trapPowerPrice + '$'
        if (gameState.trapPower === trapPowerMax) {
            sText = gameState.trapPower
            dText = 'Maximum'
        }
        this.btnUpPower.setSubtitle(sText)
        this.btnUpPower.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upRadius() {
        gameState.gold -= gameState.trapRadiusPrice
        gameState.trapRadius = Math.min(trapRadiusMax, gameState.trapRadius + trapRadiusStep)
        gameState.trapRadiusPrice *= 2
        let sText, dText
        sText = `${gameState.trapRadius} -> ${gameState.trapRadius + trapRadiusStep}`
        dText = gameState.trapRadiusPrice + '$'
        if (gameState.trapRadius === trapRadiusMax) {
            sText = gameState.trapRadius
            dText = 'Maximum'
        }
        this.btnUpRadius.setSubtitle(sText)
        this.btnUpRadius.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    close() {
        closePopup()
    }
}