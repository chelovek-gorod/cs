import { Container, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { closePopup, goldChanged } from "../../app/events"
import { dragonFuelMax, dragonFuelStep, dragonPowerMax, dragonPowerStep, gameState, mineMaxGoldMax } from "../state"
import PopupButton from "./PopupButton"

export default class BuildDragon extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        // Заголовок
        this.title = new Text({
            text: 'UPGRADE DRAGON',
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        this.isActive = false

        this.btnAddDragon = new PopupButton(
            "ADD DRAGON",
            `${gameState.dragonsCount} -> ${gameState.dragonsCount + 1}`,
            gameState.dragonPrice + '$',
            this.addDragon.bind(this),
            () => gameState.gold >= gameState.dragonPrice,
            -240, 0
        )
        this.addChild(this.btnAddDragon)

        let sText, dText
        sText = `${gameState.dragonPower} -> ${gameState.dragonPower + dragonPowerStep}`
        dText = gameState.dragonPowerPrice + '$'
        if (gameState.dragonPower === dragonPowerMax) {
            sText = gameState.dragonPower
            dText = 'Maximum'
        }
        this.btnUpPower = new PopupButton(
            "UP DRAGON POWER",
            sText,
            dText,
            this.upPower.bind(this),
            () => gameState.gold >= gameState.dragonPowerPrice && gameState.dragonPower < dragonPowerMax,
            240, 0
        )
        this.addChild(this.btnUpPower)

        let fuelNow = Math.round(gameState.dragonFuel / dragonFuelStep)
        sText = `${fuelNow} -> ${fuelNow + 1}`
        dText = gameState.dragonFuelPrice + '$'
        if (gameState.dragonFuel === dragonFuelMax) {
            sText = fuelNow
            dText = 'Maximum'
        }
        this.btnUpFuel = new PopupButton(
            "UP DRAGON SHOOTS",
            sText,
            dText,
            this.upFuel.bind(this),
            () => gameState.gold >= gameState.dragonFuelPrice && gameState.dragonFuel < dragonFuelMax,
            0, 0
        )
        this.addChild(this.btnUpFuel)

        this.btnClose = new PopupButton(
            "", "CLOSE", "",
            this.close.bind(this),
            () => true,
            0, 300
        )
        this.btnClose.subtitle.scale.set(1.5)
        this.addChild(this.btnClose)
    }

    setActive(isActive) {
        this.isActive = isActive
    }

    checkButtons() {
        this.btnAddDragon.updateAvailable()
        this.btnUpPower.updateAvailable()
        this.btnUpFuel.updateAvailable()
    }

    addDragon() {
        gameState.gold -= gameState.dragonPrice
        gameState.dragonsCount += 1
        this.btnAddDragon.setSubtitle(`${gameState.dragonsCount} -> ${gameState.dragonsCount + 1}`)

        goldChanged()

        this.checkButtons()
    }

    upPower() {
        gameState.gold -= gameState.dragonPowerPrice
        gameState.dragonPower = Math.min(dragonPowerMax, gameState.dragonPower + dragonPowerStep)
        gameState.dragonPowerPrice *= 2
        let sText, dText
        sText = `${gameState.dragonPower} -> ${gameState.dragonPower + dragonPowerStep}`
        dText = gameState.dragonPowerPrice + '$'
        if (gameState.dragonPower === dragonPowerMax) {
            sText = gameState.dragonPower
            dText = 'Maximum'
        }
        this.btnUpPower.setSubtitle(sText)
        this.btnUpPower.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upFuel() {
        gameState.gold -= gameState.dragonFuelPrice
        gameState.dragonFuel = Math.min(dragonFuelMax, gameState.dragonFuel + dragonFuelStep)
        gameState.dragonFuelPrice *= 2
        let sText, dText, fuelNow
        fuelNow = Math.round(gameState.dragonFuel / dragonFuelStep)
        sText = `${fuelNow} -> ${fuelNow + 1}`
        dText = gameState.dragonFuelPrice + '$'
        if (gameState.dragonFuel === dragonFuelMax) {
            sText = fuelNow
            dText = 'Maximum'
        }
        this.btnUpFuel.setSubtitle(sText)
        this.btnUpFuel.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    close() {
        closePopup()
    }
}