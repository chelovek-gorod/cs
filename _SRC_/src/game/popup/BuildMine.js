import { Container, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { closePopup, goldChanged } from "../../app/events"
import { gameState, mineMaxGoldMax, mineMaxGoldStep, mineTimeoutMax, mineTimeoutStep,
    getMineAccumulated, collectMineGold } from "../state"
import PopupButton from "./PopupButton"

export default class BuildMine extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        // Заголовок
        this.title = new Text({
            text: 'UPGRADE MINE',
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        this.isActive = false

        const timeSecondsNow = gameState.mineTimeout * 0.001
        const restSecondsNow = timeSecondsNow % 60
        const restMinutesNow = Math.floor((timeSecondsNow - restSecondsNow) / 60)

        const timeSecondsThen = (gameState.mineTimeout - mineTimeoutStep) * 0.001
        const restSecondsThen = timeSecondsThen % 60
        const restMinutesThen = Math.floor((timeSecondsThen - restSecondsThen) / 60)
        
        let sText, dText
        sText = `${restMinutesNow}min. ${restSecondsNow}sec. -> ${restMinutesThen}min. ${restSecondsThen}sec.`
        dText = gameState.mineTimeoutPrice + '$'
        if (gameState.mineTimeout === mineTimeoutMax) {
            sText = `${restMinutesNow}min. ${restSecondsNow}sec.`
            dText = 'Maximum'
        }
        this.btnUpTimeout = new PopupButton(
            "MINING TIME",
            sText,
            dText,
            this.upTimeout.bind(this),
            () => gameState.gold >= gameState.mineTimeoutPrice && gameState.mineTimeout > mineTimeoutMax,
            -240, 0
        )
        this.addChild(this.btnUpTimeout)

        sText = `${gameState.mineMaxGold} -> ${gameState.mineMaxGold + mineMaxGoldStep}`
        dText = gameState.mineMaxGoldPrice + '$'
        if (gameState.mineMaxGold === mineMaxGoldMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpMaxGold = new PopupButton(
            "MAXIMUM GOLD",
            sText,
            dText,
            this.upMaxGold.bind(this),
            () => gameState.gold >= gameState.mineMaxGoldPrice && gameState.mineMaxGold < mineMaxGoldMax,
            240, 0
        )
        this.addChild(this.btnUpMaxGold)

        this.btnGetGold = new PopupButton(
            "GET GOLD",
            '' + getMineAccumulated() + '$',
            '',
            this.getGold.bind(this),
            () => getMineAccumulated() > 0,
            0, 0
        )
        this.addChild(this.btnGetGold)

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

        if (isActive) {
            this.refreshGetGold()
            this.mineInterval = setInterval(() => this.refreshGetGold(), 100)
        } else if (this.mineInterval) {
            clearInterval(this.mineInterval)
            this.mineInterval = null
        }
    }

    checkButtons() {
        this.btnUpTimeout.updateAvailable()
        this.btnUpMaxGold.updateAvailable()
        this.btnGetGold.updateAvailable()
    }

    refreshGetGold() {
        const value = getMineAccumulated()
        this.btnGetGold.setSubtitle('' + value + '$')
        this.btnGetGold.updateAvailable()
    }

    upTimeout() {
        gameState.gold -= gameState.mineTimeoutPrice
        gameState.mineTimeout = Math.max(mineTimeoutMax, gameState.mineTimeout - mineTimeoutStep)
        gameState.mineTimeoutPrice *= 2

        const timeSecondsNow = gameState.mineTimeout * 0.001
        const restSecondsNow = timeSecondsNow % 60
        const restMinutesNow = Math.floor((timeSecondsNow - restSecondsNow) / 60)

        const timeSecondsThen = (gameState.mineTimeout - mineTimeoutStep) * 0.001
        const restSecondsThen = timeSecondsThen % 60
        const restMinutesThen = Math.floor((timeSecondsThen - restSecondsThen) / 60)

        let sText, dText
        sText = `${restMinutesNow}min. ${restSecondsNow}sec. -> ${restMinutesThen}min. ${restSecondsThen}sec.`
        dText = gameState.mineTimeoutPrice + '$'
        if (gameState.mineTimeout === mineTimeoutMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpTimeout.setSubtitle(sText)
        this.btnUpTimeout.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upMaxGold() {
        gameState.gold -= gameState.mineMaxGoldPrice
        gameState.mineMaxGold = Math.min(mineMaxGoldMax, gameState.mineMaxGold + mineMaxGoldStep)
        gameState.mineMaxGoldPrice *= 2
        let sText, dText
        sText = `${gameState.mineMaxGold} -> ${gameState.mineMaxGold + mineMaxGoldStep}`
        dText = gameState.mineMaxGoldPrice + '$'
        if (gameState.mineMaxGold === mineMaxGoldMax) {
            sText = 'v'
            dText = 'Maximum'
        }
        this.btnUpMaxGold.setSubtitle(sText)
        this.btnUpMaxGold.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    getGold() {
        const value = collectMineGold()
        if (value <= 0) return
    
        gameState.gold += value
        goldChanged()
        this.refreshGetGold()
        this.checkButtons()
    }

    close() {
        if (this.mineInterval) {
            clearInterval(this.mineInterval)
            this.mineInterval = null
        }
        closePopup()
    }
}