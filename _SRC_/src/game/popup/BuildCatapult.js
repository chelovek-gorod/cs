import { Container, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { closePopup, goldChanged } from "../../app/events"
import { catapultDamageRadiusMax, catapultDamageRadiusStep, catapultPowerStep, catapultsCountMax, catapultShootDistanceMax, catapultShootDistanceStep, catapultShootTimeoutMax, catapultShootTimeoutStep, gameState } from "../state"
import PopupButton from "./PopupButton"

export default class BuildCatapult extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        // Заголовок
        this.title = new Text({
            text: 'UPGRADE CATAPULTS',
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        this.isActive = false

        let sText, dText
        sText = `${gameState.catapultsCount} -> ${gameState.catapultsCount + 1}`
        dText = dText = gameState.catapultPrice + '$'
        this.btnAddCatapult = new PopupButton(
            "ADD CATAPULT",
            sText,
            dText,
            this.addCatapult.bind(this),
            () => gameState.gold >= gameState.catapultPrice && gameState.catapultsCount < catapultsCountMax,
            -240, 0
        )
        this.addChild(this.btnAddCatapult)

        sText = `${gameState.catapultPower} -> ${gameState.catapultPower + catapultPowerStep}`
        dText = dText = gameState.catapultPowerPrice + '$'
        this.btnUpPower = new PopupButton(
            "ADD POWER",
            sText,
            dText,
            this.upPower.bind(this),
            () => gameState.gold >= gameState.catapultPowerPrice,
            240, 0
        )
        this.addChild(this.btnUpPower)

        const timeSecondsNow = gameState.catapultTimeout * 0.001
        const textSecondsNow = timeSecondsNow.toFixed(3)

        const timeSecondsThen = (gameState.catapultTimeout - catapultShootTimeoutStep) * 0.001
        const textSecondsThen = timeSecondsThen.toFixed(3)
        
        sText = `${textSecondsNow}sec. -> ${textSecondsThen}sec.`
        dText = gameState.catapultTimeoutPrice + '$'
        if (gameState.catapultTimeout === catapultShootTimeoutMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpTimeout = new PopupButton(
            "SHOOT TIMEOUT",
            sText,
            dText,
            this.upTimeout.bind(this),
            () => gameState.gold >= gameState.catapultTimeoutPrice && gameState.catapultTimeout > catapultShootTimeoutMax,
            -240, 120
        )
        this.addChild(this.btnUpTimeout)

        sText = `${gameState.catapultDistance} -> ${gameState.catapultDistance + catapultShootDistanceStep}`
        dText = gameState.catapultDistancePrice + '$'
        if (gameState.catapultDistance === catapultShootDistanceMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpDistance = new PopupButton(
            "SHOOT DISTANCE",
            sText,
            dText,
            this.upDistance.bind(this),
            () => gameState.gold >= gameState.catapultDistancePrice && gameState.catapultDistance < catapultShootDistanceMax,
            240, 120
        )
        this.addChild(this.btnUpDistance)

        sText = `${gameState.catapultRadius} -> ${gameState.catapultRadius + catapultDamageRadiusStep}`
        dText = gameState.catapultRadiusPrice + '$'
        if (gameState.catapultRadius === catapultDamageRadiusMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpRadius = new PopupButton(
            "DAMAGE RADIUS",
            sText,
            dText,
            this.upRadius.bind(this),
            () => gameState.gold >= gameState.catapultRadiusPrice && gameState.catapultRadius < catapultDamageRadiusMax,
            -240, 240
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
        this.btnAddCatapult.updateAvailable()
        this.btnUpPower.updateAvailable()
        this.btnUpTimeout.updateAvailable()
        this.btnUpDistance.updateAvailable()
        this.btnUpRadius.updateAvailable()
    }

    addCatapult() {
        gameState.gold -= gameState.catapultPrice
        gameState.catapultsCount = Math.min(catapultsCountMax, gameState.catapultsCount + 1)
        gameState.catapultPrice *= 2
        let sText, dText
        sText = `${gameState.catapultsCount} -> ${gameState.catapultsCount + 1}`
        dText = gameState.catapultPrice + '$'
        if (gameState.catapultsCount === catapultsCountMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnAddCatapult.setSubtitle(sText)
        this.btnAddCatapult.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upPower() {
        gameState.gold -= gameState.catapultPowerPrice
        gameState.catapultPower = gameState.catapultPower + catapultPowerStep
        gameState.catapultPowerPrice *= 2
        let sText = `${gameState.catapultPower} -> ${gameState.catapultPower + catapultPowerStep}`
        this.btnUpPower.setSubtitle(sText)

        goldChanged()

        this.checkButtons()
    }

    upTimeout() {
        gameState.gold -= gameState.catapultTimeoutPrice
        gameState.catapultTimeout = Math.max(catapultShootTimeoutMax, gameState.catapultTimeout - catapultShootTimeoutStep)
        gameState.catapultTimeoutPrice *= 2

        const timeSecondsNow = gameState.catapultTimeout * 0.001
        const restSecondsNow = timeSecondsNow % 60
        const restMinutesNow = Math.floor((timeSecondsNow - restSecondsNow) / 60)

        const timeSecondsThen = (gameState.catapultTimeout - catapultShootTimeoutStep) * 0.001
        const restSecondsThen = timeSecondsThen % 60
        const restMinutesThen = Math.floor((timeSecondsThen - restSecondsThen) / 60)

        let sText, dText
        sText = `${restMinutesNow}min. ${restSecondsNow}sec. -> ${restMinutesThen}min. ${restSecondsThen}sec.`
        dText = gameState.catapultTimeoutPrice + '$'
        if (gameState.catapultTimeout === catapultShootTimeoutMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpTimeout.setSubtitle(sText)
        this.btnUpTimeout.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upDistance() {
        gameState.gold -= gameState.catapultDistancePrice
        gameState.catapultDistance = Math.min(catapultShootDistanceMax, gameState.catapultDistance + catapultShootDistanceStep)
        gameState.catapultDistancePrice *= 2
        let sText, dText
        sText = `${gameState.catapultDistance} -> ${gameState.catapultDistance + catapultShootDistanceStep}`
        dText = gameState.catapultDistancePrice + '$'
        if (gameState.catapultDistance === catapultShootDistanceMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpDistance.setSubtitle(sText)
        this.btnUpDistance.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upRadius() {
        gameState.gold -= gameState.catapultRadiusPrice
        gameState.catapultRadius = Math.min(catapultDamageRadiusMax, gameState.catapultRadius + catapultDamageRadiusStep)
        gameState.catapultRadiusPrice *= 2
        let sText, dText
        sText = `${gameState.catapultRadius} -> ${gameState.catapultRadius + catapultDamageRadiusStep}`
        dText = gameState.catapultRadiusPrice + '$'
        if (gameState.catapultRadius === catapultDamageRadiusMax) {
            sText = 'v'
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