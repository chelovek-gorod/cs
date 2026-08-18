import { Container, Graphics, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { createEnum, setCursorPointer } from "../../utils/functions"
import { EventHub, events, startScene } from "../../app/events"
import { SCENE_NAME } from "../scenes/SceneManager"
import { addArrow, addArrowPower, addArrowReloadTimeout, addArrowShutTimeout, addArrowSpeedRate, addTowerHP } from "../state"


export const UPGRADE_TYPE = createEnum([
    'TOWER_HP',
    'ARROWS',
    'ARROW_POWER',
    'ARROW_SHUT_SPEED',
    'ARROW_FLY_SPEED',
    'ARROW_RELOAD_SPEED',
])

const UPGRADE_NAMES = Object.keys(UPGRADE_TYPE)

export default class Upgrade extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        // Заголовок
        this.title = new Text({
            text: 'UPGRADE',
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        this.isActive = false
        this.buttons = []
        const xPositions = [-240, 0, 240]
        for (let i = 0; i < 3; i++) {
            const btn = this.createButton(xPositions[i], 0)
            this.buttons.push(btn)
            this.addChild(btn)
        }

        this.setUpgrades()
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
        titleText.position.set(0, -20)
        btn.addChild(titleText)

        const upgradeText = new Text({ text: '+?', style: styles.damage })
        upgradeText.anchor.set(0.5)
        upgradeText.position.set(0, 20)
        btn.addChild(upgradeText)

        setCursorPointer(btn)
        btn.on('pointerdown', () => this.onButtonClick(btn))

        btn.titleText = titleText
        btn.upgradeText = upgradeText
        btn.bg = bg

        return btn
    }

    setActive(isActive) {
        this.isActive = isActive
    }

    setUpgrades() {
        const selected = []
        const available = [...UPGRADE_NAMES]
        while (selected.length < 3 && available.length > 0) {
            const index = Math.floor(Math.random() * available.length)
            selected.push(available[index])
            available.splice(index, 1)
        }

        for (let i = 0; i < this.buttons.length; i++) {
            const type = selected[i] || UPGRADE_NAMES[0]
            const btn = this.buttons[i]
            btn.titleText.text = type

            let desc = ''
            switch (type) {
                case UPGRADE_TYPE.TOWER_HP: desc = '+10 HP'; break
                case UPGRADE_TYPE.ARROWS: desc = '+1 Arrow'; break
                case UPGRADE_TYPE.ARROW_POWER: desc = 'Power +1'; break
                case UPGRADE_TYPE.ARROW_FLY_SPEED: desc = 'Arrow Speed +10%'; break
                case UPGRADE_TYPE.ARROW_SHUT_SPEED: desc = 'Shut Speed +10%'; break
                case UPGRADE_TYPE.ARROW_RELOAD_SPEED: desc = 'Reload Speed +10%'; break
                default: desc = '+?'
            }
            btn.upgradeText.text = desc
            btn.upgradeType = type
        }
    }

    onButtonClick(btn) {
        if (!this.isActive) return

        this.isActive = false
        const type = btn.upgradeType
        switch (type) {
            case UPGRADE_TYPE.TOWER_HP: addTowerHP(); break
            case UPGRADE_TYPE.ARROWS: addArrow(); break
            case UPGRADE_TYPE.ARROW_POWER: addArrowPower(); break
            case UPGRADE_TYPE.ARROW_FLY_SPEED: addArrowSpeedRate(); break
            case UPGRADE_TYPE.ARROW_SHUT_SPEED: addArrowShutTimeout(); break
            case UPGRADE_TYPE.ARROW_RELOAD_SPEED: addArrowReloadTimeout(); break
        }

        EventHub.emit(events.closePopup)
        startScene(SCENE_NAME.Level)
    }
}