import { Container, Graphics, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { createEnum, setCursorPointer } from "../../utils/functions"
import { EventHub, events, startScene } from "../../app/events"
import { lastSceneName, SCENE_NAME } from "../scenes/SceneManager"
import { gameState, arrowsStep, arrowsMax, arrowPowerStep, arrowShootTimeoutStep,
    arrowShootTimeoutMax, arrowReloadTimeoutStep, arrowReloadTimeoutMax,
    arrowFlyRateStep, arrowFlyRateMax, berserkShootStep, berserkPowerRateStep } from "../state"

const UPGRADE_TYPE = createEnum([
    'arrowsCount',
    'arrowPower',
    'arrowFlyRate',
    'arrowShootTimeout',
    'arrowReloadTimeout',
    'berserkPowerRate',
    'berserkShoots'
])

export default class Upgrade extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        // Заголовок
        this.title = new Text({
            text: 'UPGRADE ARCHER',
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        this.isActive = false
        const buttons = []
        const xPositions = [-240, 0, 240]
        for (let i = 0; i < 3; i++) {
            const btn = this.createButton(xPositions[i], 0)
            buttons.push(btn)
            this.addChild(btn)
        }

        this.setUpgrades(buttons)
    }

    createButton(x, y) {
        const btn = new Container()
        btn.position.set(x, y)

        const bg = new Graphics()
        bg.roundRect(-110, -80, 220, 160, 24)
        bg.fill(0xff00ff)
        bg.stroke({ width: 4, color: 0x660066 })
        btn.addChild(bg)

        const titleText = new Text({ text: '???', style: styles.damage })
        titleText.anchor.set(0.5)
        titleText.position.set(0, -36)
        btn.addChild(titleText)

        const upgradeText = new Text({ text: '+?', style: styles.damage })
        upgradeText.anchor.set(0.5)
        upgradeText.position.set(0, 0)
        btn.addChild(upgradeText)

        const resultText = new Text({ text: 'A->B', style: styles.damage })
        resultText.anchor.set(0.5)
        resultText.position.set(0, 36)
        btn.addChild(resultText)

        setCursorPointer(btn)
        btn.on('pointerdown', () => this.onButtonClick(btn))

        btn.titleText = titleText
        btn.upgradeText = upgradeText
        btn.resultText = resultText
        btn.bg = bg

        return btn
    }

    setActive(isActive) {
        this.isActive = isActive
    }

    setUpgrades(buttons) {
        const selected = []
        const available = Object.keys(UPGRADE_TYPE).sort(() => Math.random() - 0.5)
        while (selected.length < 3 && available.length > 0) {
            const index = Math.floor(Math.random() * available.length)
            const upgrade = available[index]

            switch (upgrade) {
                case UPGRADE_TYPE.arrowFlyRate:
                    if (gameState.arrowFlyRate < arrowFlyRateMax) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.arrowReloadTimeout:
                    if (gameState.arrowReloadTimeout > arrowReloadTimeoutMax) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.arrowShootTimeout:
                    if (gameState.arrowShootTimeout > arrowShootTimeoutMax) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.arrowsCount:
                    if (gameState.arrowsCount < arrowsMax) {
                        selected.push(upgrade)
                    }
                    break
                default:
                    selected.push(upgrade)
                    break
            }
            
            available.splice(index, 1)
        }

        for (let i = 0; i < buttons.length; i++) {
            const type = selected[i]
            const btn = buttons[i]

            if (!type) {
                this.removeChild(bth)
                btn.destroy({children: true})
                continue
            }

            let title = ''
            let desc = ''
            let res = ''
            let result = 0
            switch (type) {
                case UPGRADE_TYPE.arrowsCount:
                    title = 'ADD ARROWS'
                    result = gameState.arrowsCount + arrowsStep
                    desc = `+${arrowsStep}`
                    res = `${gameState.arrowsCount} -> ${result}`
                break
                case UPGRADE_TYPE.arrowPower:
                    title = 'ADD POWER'
                    result = gameState.arrowPower + arrowPowerStep
                    desc = `+${arrowPowerStep}`
                    res = `${gameState.arrowPower} -> ${result}`
                break
                case UPGRADE_TYPE.arrowShootTimeout:
                    title = 'SHOOT SPEED'
                    const SPS_now = 1000 / gameState.arrowShootTimeout
                    const SPS_up = 1000 / arrowShootTimeoutStep
                    result = (SPS_now + SPS_up).toFixed(2)
                    desc = `+ ${SPS_up.toFixed(2)} shoots per sec.`
                    res = `${SPS_now.toFixed(2)} -> ${result}`
                break
                case UPGRADE_TYPE.arrowReloadTimeout:
                    title = 'RELOAD'
                    result = ((gameState.arrowReloadTimeout - arrowReloadTimeoutStep) * 0.001).toFixed(3)
                    desc = `-${(arrowReloadTimeoutStep * 0.001).toFixed(3)} sec.`
                    res = `${(gameState.arrowReloadTimeout * 0.001).toFixed(3)} -> ${result}`
                break
                case UPGRADE_TYPE.arrowFlyRate:
                    title = 'FLY SPEED RATE'
                    result = 1 + (gameState.arrowFlyRate + arrowFlyRateStep) * 10
                    desc = `+${arrowFlyRateStep * 10}`
                    res = `${(1 + gameState.arrowFlyRate * 10).toFixed(2)} -> ${result.toFixed(2)}`
                break

                case UPGRADE_TYPE.berserkShoots:
                    title = 'RAGE SHOOTS'
                    result = gameState.berserkShoots + berserkShootStep
                    desc = `+${berserkShootStep}`
                    res = `${gameState.berserkShoots.toFixed(2)} -> ${result.toFixed(2)}`
                break
                case UPGRADE_TYPE.berserkPowerRate:
                    title = 'RAGE POWER RATE'
                    result = gameState.berserkPowerRate + berserkPowerRateStep
                    desc = `+${berserkPowerRateStep}`;
                    res = `${gameState.berserkPowerRate.toFixed(2)} -> ${result.toFixed(2)}`
                break
            }
            btn.titleText.text = title
            btn.upgradeText.text = desc
            btn.resultText.text = res

            btn.upgradeType = type
        }
    }

    onButtonClick(btn) {
        if (!this.isActive) return

        this.isActive = false
        const type = btn.upgradeType
        switch (type) {
            case UPGRADE_TYPE.arrowsCount:
                gameState.arrowsCount += arrowsStep;
            break
            case UPGRADE_TYPE.arrowPower:
                gameState.arrowPower += arrowPowerStep;
            break
            case UPGRADE_TYPE.arrowShootTimeout:
                gameState.arrowShootTimeout -= arrowShootTimeoutStep;
            break
            case UPGRADE_TYPE.arrowReloadTimeout:
                gameState.arrowReloadTimeout -= arrowReloadTimeoutStep;
            break
            case UPGRADE_TYPE.arrowFlyRate:
                gameState.arrowFlyRate += arrowFlyRateStep;
            break

            case UPGRADE_TYPE.berserkShoots:
                gameState.berserkShoots += berserkShootStep;
            break
            case UPGRADE_TYPE.berserkPowerRate:
                gameState.berserkPowerRate += berserkPowerRateStep;
            break
        }

        EventHub.emit(events.closePopup)

        if (lastSceneName === SCENE_NAME.Level) startScene(SCENE_NAME.Menu)
    }
}