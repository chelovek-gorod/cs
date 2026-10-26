import { Container, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { closePopup, goldChanged } from "../../app/events"
import { gameState, towerHPMax, towerHPStep, towerRepairMax, towerRepairPrice, towerRepairStep } from "../state"
import PopupButton from "./PopupButton"

export default class BuildTower extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        // Заголовок
        this.title = new Text({
            text: 'UPGRADE TOWER',
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        this.isActive = false

        let sText, dText
        sText = `${gameState.towerRepairsCount} -> ${gameState.towerRepairsCount + 1}`
        dText = towerRepairPrice + '$'
        this.btnAddRepair = new PopupButton(
            "ADD REPAIR",
            sText,
            dText,
            this.addRepair.bind(this),
            () => gameState.gold >= towerRepairPrice,
            -240, 0
        )
        this.addChild(this.btnAddRepair)

        sText = `${gameState.towerRepairHp} -> ${gameState.towerRepairHp + towerRepairStep}`
        dText = gameState.towerRepairUpgradePrice + '$'
        if (gameState.towerRepairHp === towerRepairMax) {
            sText = `${gameState.towerRepairHp}`
            dText = 'Maximum'
        }
        this.btnUpRepair = new PopupButton(
            "UPGRADE REPAIR",
            sText,
            dText,
            this.upRepair.bind(this),
            () => gameState.gold >= gameState.towerRepairUpgradePrice && gameState.towerRepairHp < towerRepairMax,
            0, 0
        )
        this.addChild(this.btnUpRepair)

        sText = `${gameState.towerHp} -> ${gameState.towerHp + towerHPStep}`
        dText = gameState.towerHpPrice + '$'
        if (gameState.towerHp === towerHPMax) {
            sText = `${gameState.towerHp} HP`
            dText = 'Maximum'
        }
        this.btnUpHp = new PopupButton(
            "UPGRADE TOWER HP",
            sText,
            dText,
            this.upHp.bind(this),
            () => gameState.gold >= gameState.towerHpPrice && gameState.towerHp < towerHPMax,
            240, 0
        )
        this.addChild(this.btnUpHp)

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
        this.btnAddRepair.updateAvailable()
        this.btnUpRepair.updateAvailable()
        this.btnUpHp.updateAvailable()
    }

    addRepair() {
        gameState.gold -= towerRepairPrice
        gameState.towerRepairsCount += 1
        let sText = `${gameState.towerRepairsCount} -> ${gameState.towerRepairsCount + 1}`
        this.btnAddRepair.setSubtitle(sText)

        goldChanged()

        this.checkButtons()
    }

    upRepair() {
        gameState.gold -= gameState.towerRepairUpgradePrice
        gameState.towerRepairHp = Math.min(towerRepairMax, gameState.towerRepairHp + towerRepairStep)
        gameState.towerRepairUpgradePrice *= 2

        let sText, dText
        sText = `${gameState.towerRepairHp} -> ${gameState.towerRepairHp + towerRepairStep}`
        dText = gameState.towerRepairUpgradePrice + '$'
        if (gameState.towerRepairHp === towerRepairMax) {
            sText = gameState.towerRepairHp
            dText = 'Maximum'
        }
        this.btnUpRepair.setSubtitle(sText)
        this.btnUpRepair.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    upHp() {
        gameState.gold -= gameState.towerHpPrice
        gameState.towerHp = Math.min(towerHPMax, gameState.towerHp + towerHPStep)
        gameState.towerHpPrice *= 2
        let sText, dText
        sText = `${gameState.towerHp} -> ${gameState.towerHp + towerHPStep}`
        dText = gameState.towerHpPrice + '$'
        if (gameState.towerHp === towerHPMax) {
            sText = gameState.towerHp
            dText = 'Maximum'
        }
        this.btnUpHp.setSubtitle(sText)
        this.btnUpHp.setDescription(dText)

        goldChanged()

        this.checkButtons()
    }

    close() {
        closePopup()
    }
}