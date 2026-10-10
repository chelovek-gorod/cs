import { Container, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { closePopup, goldChanged } from "../../app/events"
import { gameState, iceAdd, iceDurationMax, iceDurationStep, icePowerRateMax, icePowerRateStep, icePrice } from "../state"
import PopupButton from "./PopupButton"

export default class BuildIce extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        // Заголовок
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

        sText = `${gameState.iceDuration} -> ${gameState.iceDuration + iceDurationStep}`
        dText = gameState.iceDurationPrice + '$'
        if (gameState.iceDuration === iceDurationMax) {
            sText = gameState.iceDuration
            dText = 'Maximum'
        }
        this.btnUpDuration = new PopupButton(
            "UPGRADE DURATION",
            sText,
            dText,
            this.upDuration.bind(this),
            () => gameState.gold >= gameState.iceDurationPrice && gameState.iceDuration < iceDurationMax,
            0, 0
        )
        this.addChild(this.btnUpDuration)

        sText = `${gameState.icePowerRate} -> ${gameState.icePowerRate + icePowerRateStep}`
        dText = gameState.icePowerRatePrice + '$'
        if (gameState.icePowerRate === icePowerRateMax) {
            sText = gameState.icePowerRate
            dText = 'Maximum'
        }
        this.btnUpPowerRate = new PopupButton(
            "UPGRADE POWER RATE",
            sText,
            dText,
            this.upPowerRate.bind(this),
            () => gameState.gold >= gameState.icePowerRatePrice && gameState.icePowerRate < icePowerRateMax,
            240, 0
        )
        this.addChild(this.btnUpPowerRate)

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
        this.btnUpDuration.updateAvailable()
        this.btnUpPowerRate.updateAvailable()
    }

    addIce() {
        gameState.gold -= icePrice
        gameState.iceCount += iceAdd
        let sText = `${gameState.iceCount} -> ${gameState.iceCount + iceAdd}`
        this.btnAddIce.setSubtitle(sText)

        goldChanged()

        this.checkButtons()
    }

    upDuration() {
        gameState.gold -= gameState.iceDurationPrice
        gameState.iceDuration = Math.min(iceDurationMax, gameState.iceDuration + iceDurationStep)
        gameState.iceDurationPrice *= 2

        let sText, dText
        sText = `${gameState.iceDuration} -> ${gameState.iceDuration + iceDurationStep}`
        dText = gameState.iceDurationPrice + '$'
        if (gameState.iceDuration === iceDurationMax) {
            sText = gameState.iceDuration
            dText = 'Maximum'
        }
        this.btnUpDuration.setSubtitle(sText)
        this.btnUpDuration.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upPowerRate() {
        gameState.gold -= gameState.icePowerRatePrice
        gameState.icePowerRate = Math.min(icePowerRateMax, gameState.icePowerRate + icePowerRateStep)
        gameState.icePowerRatePrice *= 2
        let sText, dText
        sText = `${gameState.icePowerRate} -> ${gameState.icePowerRate + icePowerRateStep}`
        dText = gameState.icePowerRatePrice + '$'
        if (gameState.icePowerRate === icePowerRateMax) {
            sText = gameState.icePowerRate
            dText = 'Maximum'
        }
        this.btnUpPowerRate.setSubtitle(sText)
        this.btnUpPowerRate.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    close() {
        closePopup()
    }
}