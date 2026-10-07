import { Container, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { closePopup, goldChanged } from "../../app/events"
import { gameState, wizardPowerStep, wizardsCountMax, wizardShootDistanceMax, wizardShootDistanceStep, wizardShootTimeoutMax, wizardShootTimeoutStep, wizardTargetsCountMax } from "../state"
import PopupButton from "./PopupButton"

export default class BuildMagic extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        // Заголовок
        this.title = new Text({
            text: 'UPGRADE WIZARDS',
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        this.isActive = false

        let sText, dText
        sText = `${gameState.wizardsCount} -> ${gameState.wizardsCount + 1}`
        dText = dText = gameState.wizardPrice + '$'
        this.btnAddWizard = new PopupButton(
            "ADD WIZARD",
            sText,
            dText,
            this.addWizard.bind(this),
            () => gameState.gold >= gameState.wizardPrice && gameState.wizardsCount < wizardsCountMax,
            -240, 0
        )
        this.addChild(this.btnAddWizard)

        sText = `${gameState.wizardPower} -> ${gameState.wizardPower + wizardPowerStep}`
        dText = dText = gameState.wizardPowerPrice + '$'
        this.btnUpPower = new PopupButton(
            "ADD POWER",
            sText,
            dText,
            this.upPower.bind(this),
            () => gameState.gold >= gameState.wizardPowerPrice,
            240, 0
        )
        this.addChild(this.btnUpPower)

        const timeSecondsNow = gameState.wizardTimeout * 0.001
        const textSecondsNow = timeSecondsNow.toFixed(3)

        const timeSecondsThen = (gameState.wizardTimeout - wizardShootTimeoutStep) * 0.001
        const textSecondsThen = timeSecondsThen.toFixed(3)
        
        sText = `${textSecondsNow}sec. -> ${textSecondsThen}sec.`
        dText = gameState.wizardTimeoutPrice + '$'
        if (gameState.wizardTimeout === wizardShootTimeoutMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpTimeout = new PopupButton(
            "SHOOT TIMEOUT",
            sText,
            dText,
            this.upTimeout.bind(this),
            () => gameState.gold >= gameState.wizardTimeoutPrice && gameState.wizardTimeout > wizardShootTimeoutMax,
            -240, 120
        )
        this.addChild(this.btnUpTimeout)

        sText = `${gameState.wizardDistance} -> ${gameState.wizardDistance + wizardShootDistanceStep}`
        dText = gameState.wizardDistancePrice + '$'
        if (gameState.wizardDistance === wizardShootDistanceMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpDistance = new PopupButton(
            "SHOOT DISTANCE",
            sText,
            dText,
            this.upDistance.bind(this),
            () => gameState.gold >= gameState.wizardDistancePrice && gameState.wizardDistance < wizardShootDistanceMax,
            240, 120
        )
        this.addChild(this.btnUpDistance)

        sText = `${gameState.wizardTargets} -> ${gameState.wizardTargets + 1}`
        dText = gameState.wizardTargetPrice + '$'
        if (gameState.wizardTargets === wizardTargetsCountMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnAddTargets = new PopupButton(
            "ADD TARGETS",
            sText,
            dText,
            this.addTargets.bind(this),
            () => gameState.gold >= gameState.wizardTargetPrice && gameState.wizardTargets < wizardTargetsCountMax,
            -240, 240
        )
        this.addChild(this.btnAddTargets)

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
        this.btnAddWizard.updateAvailable()
        this.btnUpPower.updateAvailable()
        this.btnUpTimeout.updateAvailable()
        this.btnUpDistance.updateAvailable()
        this.btnAddTargets.updateAvailable()
    }

    addWizard() {
        gameState.gold -= gameState.wizardPrice
        gameState.wizardsCount = Math.min(wizardsCountMax, gameState.wizardsCount + 1)
        gameState.wizardPrice *= 2
        let sText, dText
        sText = `${gameState.wizardsCount} -> ${gameState.wizardsCount + 1}`
        dText = gameState.wizardPrice + '$'
        if (gameState.wizardsCount === wizardsCountMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnAddWizard.setSubtitle(sText)
        this.btnAddWizard.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upPower() {
        gameState.gold -= gameState.wizardPowerPrice
        gameState.wizardPower = gameState.wizardPower + wizardPowerStep
        gameState.wizardPowerPrice *= 2
        let sText = `${gameState.wizardPower} -> ${gameState.wizardPower + wizardPowerStep}`
        this.btnUpPower.setSubtitle(sText)

        goldChanged()

        this.checkButtons()
    }

    upTimeout() {
        gameState.gold -= gameState.wizardTimeoutPrice
        gameState.wizardTimeout = Math.max(wizardShootTimeoutMax, gameState.wizardTimeout - wizardShootTimeoutStep)
        gameState.wizardTimeoutPrice *= 2

        const timeSecondsNow = gameState.wizardTimeout * 0.001
        const restSecondsNow = timeSecondsNow % 60
        const restMinutesNow = Math.floor((timeSecondsNow - restSecondsNow) / 60)

        const timeSecondsThen = (gameState.wizardTimeout - wizardShootTimeoutStep) * 0.001
        const restSecondsThen = timeSecondsThen % 60
        const restMinutesThen = Math.floor((timeSecondsThen - restSecondsThen) / 60)

        let sText, dText
        sText = `${restMinutesNow}min. ${restSecondsNow}sec. -> ${restMinutesThen}min. ${restSecondsThen}sec.`
        dText = gameState.wizardTimeoutPrice + '$'
        if (gameState.wizardTimeout === wizardShootTimeoutMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpTimeout.setSubtitle(sText)
        this.btnUpTimeout.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upDistance() {
        gameState.gold -= gameState.wizardDistancePrice
        gameState.wizardDistance = Math.min(wizardShootDistanceMax, gameState.wizardDistance + wizardShootDistanceStep)
        gameState.wizardDistancePrice *= 2
        let sText, dText
        sText = `${gameState.wizardDistance} -> ${gameState.wizardDistance + wizardShootDistanceStep}`
        dText = gameState.wizardDistancePrice + '$'
        if (gameState.wizardDistance === wizardShootDistanceMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpDistance.setSubtitle(sText)
        this.btnUpDistance.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    addTargets() {
        gameState.gold -= gameState.wizardTargetPrice
        gameState.wizardTargets = Math.min(wizardTargetsCountMax, gameState.wizardTargets + 1)
        gameState.wizardTargetPrice *= 2
        let sText, dText
        sText = `${gameState.wizardTargets} -> ${gameState.wizardTargets + 1}`
        dText = gameState.wizardTargetPrice + '$'
        if (gameState.wizardTargets === wizardTargetsCountMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnAddTargets.setSubtitle(sText)
        this.btnAddTargets.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    close() {
        closePopup()
    }
}