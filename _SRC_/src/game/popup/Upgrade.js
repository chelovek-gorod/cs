import { Container, Graphics, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { createEnum, setCursorPointer } from "../../utils/functions"
import { EventHub, events, startScene } from "../../app/events"
import { SCENE_NAME } from "../scenes/SceneManager"
import { addArrow, addArrowPower, addArrowReloadTimeout, addArrowShutTimeout, addArrowSpeedRate,
    addCatapultDamageRadius, addCatapultPower, addCatapultShutDistance, addCatapultShutTimeout,
    addTowerHP, addWizardPower, addWizardShutDistance, addWizardShutTimeout, addWizardTargetsCount,
    arrowPowerStep, arrowReloadTimeout, arrowReloadTimeoutMax, arrows, arrowShutTimeout,
    arrowShutTimeoutMax, arrowsMax, arrowSpeedRate, arrowSpeedRateMax, arrowsStep, catapultDamageRadius,
    catapultDamageRadiusMax, catapultDamageRadiusStep, catapultPowerStep, catapultsCount,
    catapultShutDistance, catapultShutDistanceMax, catapultShutDistanceStep, catapultShutTimeout,
    catapultShutTimeoutMax, towerHP, towerHPMax, towerHPStep, wizardPowerStep, wizardsCount,
    wizardShutDistance, wizardShutDistanceMax, wizardShutDistanceStep, wizardShutTimeout,
    wizardShutTimeoutMax, wizardTargetsCount, wizardTargetsCountMax } from "../state"


export const UPGRADE_TYPE = createEnum([
    'TOWER_HP',

    'ARROWS',
    'ARROW_POWER',
    'ARROW_SHUT_SPEED',
    'ARROW_FLY_SPEED',
    'ARROW_RELOAD_SPEED',

    'CATAPULT_POWER',
    'CATAPULT_RADIUS', // catapultDamageRadius
    'CATAPULT_RELOAD', // catapultShutTimeout
    'CATAPULT_DISTANCE', // catapultShutDistance

    'WIZARD_POWER',
    'WIZARD_TARGETS', // wizardTargetsCount
    'WIZARD_RELOAD', // wizardShutTimeout
    'WIZARD_DISTANCE' // wizardShutDistance
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
            const upgrade = available[index]

            switch (upgrade) {
                // tower
                case UPGRADE_TYPE.TOWER_HP:
                    if (towerHP < towerHPMax) {
                        selected.push(upgrade)
                    }
                    break

                // archer
                case UPGRADE_TYPE.ARROWS:
                    if (arrows < arrowsMax) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.ARROW_POWER:
                    selected.push(upgrade)
                    break
                case UPGRADE_TYPE.ARROW_SHUT_SPEED:
                    if (arrowShutTimeout > arrowShutTimeoutMax) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.ARROW_FLY_SPEED:
                    if (arrowSpeedRate < arrowSpeedRateMax) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.ARROW_RELOAD_SPEED:
                    if (arrowReloadTimeout > arrowReloadTimeoutMax) {
                        selected.push(upgrade)
                    }
                    break

                // catapult
                case UPGRADE_TYPE.CATAPULT_POWER:
                    if (catapultsCount > 0) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.CATAPULT_RADIUS:
                    if (catapultsCount > 0 && catapultDamageRadius < catapultDamageRadiusMax) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.CATAPULT_RELOAD:
                    if (catapultsCount > 0 && catapultShutTimeout > catapultShutTimeoutMax) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.CATAPULT_DISTANCE:
                    if (catapultsCount > 0 && catapultShutDistance < catapultShutDistanceMax) {
                        selected.push(upgrade)
                    }
                    break

                // wizard
                case UPGRADE_TYPE.WIZARD_POWER:
                    if (wizardsCount > 0) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.WIZARD_TARGETS:
                    if (wizardsCount > 0 && wizardTargetsCount < wizardTargetsCountMax) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.WIZARD_RELOAD:
                    if (wizardsCount > 0 && wizardShutTimeout > wizardShutTimeoutMax) {
                        selected.push(upgrade)
                    }
                    break
                case UPGRADE_TYPE.WIZARD_DISTANCE:
                    if (wizardsCount > 0 && wizardShutDistance < wizardShutDistanceMax) {
                        selected.push(upgrade)
                    }
                    break
            }
            
            available.splice(index, 1)
        }

        for (let i = 0; i < this.buttons.length; i++) {
            const type = selected[i]
            const btn = this.buttons[i]

            if (!type) {
                this.removeChild(bth)
                btn.destroy({children: true})
                continue
            }

            btn.titleText.text = type

            let desc = ''
            switch (type) {
                case UPGRADE_TYPE.TOWER_HP: desc = `+${towerHPStep} HP`; break

                case UPGRADE_TYPE.ARROWS: desc = `+${arrowsStep} Arrow`; break
                case UPGRADE_TYPE.ARROW_POWER: desc = `Power +${arrowPowerStep}`; break
                case UPGRADE_TYPE.ARROW_FLY_SPEED: desc = 'Arrow Speed +10%'; break
                case UPGRADE_TYPE.ARROW_SHUT_SPEED: desc = 'Shut Speed +10%'; break
                case UPGRADE_TYPE.ARROW_RELOAD_SPEED: desc = 'Reload Speed +10%'; break

                case UPGRADE_TYPE.CATAPULT_POWER: desc = `Power +${catapultPowerStep}`; break
                case UPGRADE_TYPE.CATAPULT_RADIUS: desc = `Damage radius + ${catapultDamageRadiusStep}`; break
                case UPGRADE_TYPE.CATAPULT_RELOAD: desc = 'Shut Speed +10%'; break
                case UPGRADE_TYPE.CATAPULT_DISTANCE: desc = `Shut distance + ${catapultShutDistanceStep}`; break

                case UPGRADE_TYPE.WIZARD_POWER: desc = `Power +${wizardPowerStep}`; break
                case UPGRADE_TYPE.WIZARD_TARGETS: desc = '+1 target'; break
                case UPGRADE_TYPE.WIZARD_RELOAD: desc = 'Shut Speed +10%'; break
                case UPGRADE_TYPE.WIZARD_DISTANCE: desc = `Shut distance + ${wizardShutDistanceStep}`; break

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

            case UPGRADE_TYPE.CATAPULT_POWER: addCatapultPower(); break
            case UPGRADE_TYPE.CATAPULT_RADIUS: addCatapultDamageRadius(); break
            case UPGRADE_TYPE.CATAPULT_RELOAD: addCatapultShutTimeout(); break
            case UPGRADE_TYPE.CATAPULT_DISTANCE: addCatapultShutDistance(); break

            case UPGRADE_TYPE.WIZARD_POWER: addWizardPower(); break
            case UPGRADE_TYPE.WIZARD_TARGETS: addWizardTargetsCount(); break
            case UPGRADE_TYPE.WIZARD_RELOAD: addWizardShutTimeout(); break
            case UPGRADE_TYPE.WIZARD_DISTANCE: addWizardShutDistance(); break
        }

        EventHub.emit(events.closePopup)
        startScene(SCENE_NAME.Menu)
    }
}