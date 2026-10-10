import { Container, Graphics, Text } from "pixi.js"
import { kill, tickerAdd, tickerRemove } from "../../../app/application"
import { EventHub, events, setEnemyFirstWave, showPopup, startScene } from "../../../app/events"
import { styles } from "../../../app/styles"
import { removeCursorPointer, setCursorPointer } from "../../../utils/functions"
import FlyText from "../../effects/FlyText"
import { POPUP_TYPE } from "../../popup/popupTypes"
import { gameState, goldForSavingHp } from "../../state"
import { SCENE_NAME } from "../SceneManager"
import { createArrowOnGround } from "./ArrowOnGround"
import ChestsContainer from "./Chest"
import Dragon from "./Dragon"
import DragonFire from "./DragonFire"
import EnemyBlood from "./EnemyBlood"
import EnemySmoke from "./EnemySmoke"
import Tower from "./Tower"
import { createTrap } from "./Trap"

const SIZE = 800
const MAX_SCALE = 1.3
const RESULT_POPUP_TIMEOUT = 1800

export default class GameContainer extends Container {
    constructor() {
        super()

        this.blood = new EnemyBlood()
        this.addChild(this.blood.stainContainer)

        this.deadEnemies = new Container()
        this.addChild(this.deadEnemies)

        this.traps = new Container()
        this.addChild(this.traps)
        this.trapsButton = null

        this.chests = new ChestsContainer()
        this.addChild(this.chests)

        this.arrowPoints = new Container()
        this.addChild(this.arrowPoints)

        this.arrowsOnGround = new Container()
        this.addChild(this.arrowsOnGround)

        this.arrows = new Container()
        this.stones = new Container()

        this.lightnings = new Graphics()

        this.enemies = new Container()
        this.addChild(this.enemies)

        this.addChild(this.blood.flyContainer)
        requestAnimationFrame(() => this.blood.warmup())

        this.enemiesHp = new Container()

        this.smoke = new EnemySmoke()
        requestAnimationFrame( () => this.smoke.warmup() )

        this.tower = new Tower(
            this.arrowPoints, this.arrows, this.smoke,
            this.stones, this.lightnings, this.enemies
        )

        this.enemyArrows = new Container()

        this.arrowStartPower = gameState.arrowPower
        this.arrowCurrentPower = this.arrowStartPower
        this.arrowComboRate = 1.2
        this.arrowComboCount = 0
        this.arrowHeadShootRate = 3
        this.arrowLastTarget = null
        this.addChild(this.tower)

        this.addChild(this.lightnings)
        this.addChild(this.smoke)
        this.addChild(this.enemyArrows)
        this.addChild(this.arrows)
        this.addChild(this.stones)

        this.dragon = null
        if (gameState.dragonsCount > 0) {
            this.dragonFire = new DragonFire()
            this.addChild(this.dragonFire)
            this.dragon = new Dragon( this.enemies, this.dragonFire.emit.bind(this.dragonFire) )
            this.addChild(this.dragon)
            requestAnimationFrame( () => this.dragonFire.warmup(this) )
        }
        
        this.addChild(this.enemiesHp)

        this.resultPopupTimer = 0

        EventHub.on(events.arrowOnTarget, this.arrowOnTarget, this)
        EventHub.on(events.setTrapsOnMap, this.setTrapsOnMap, this)
        EventHub.on(events.setEnemyFirstWave, this.setEnemyFirstWave, this)

        this.testGraphics = new Graphics()
        this.addChild(this.testGraphics)
    }

    screenResize(screenData, safeAreaOffsets) {
        let scale = 1
        if (screenData.isLandscape) {
            const width = screenData.width - safeAreaOffsets.left - safeAreaOffsets.right
            scale = Math.min(MAX_SCALE, width / SIZE)
        } else {
            const height = screenData.height - safeAreaOffsets.top - safeAreaOffsets.bottom
            scale = Math.min(MAX_SCALE, height / SIZE)
        }

        this.scale.set(scale)

        this.testGraphics.clear()
        this.testGraphics.rect(-SIZE * 0.5, -SIZE * 0.5, SIZE, SIZE)
        this.testGraphics.stroke({ width: 1, color: 0xffff00 })
    }

    setTrapsOnMap() {
        this.trapsButton = new Container()
        this.addChild(this.trapsButton)

        const circle = new Graphics()
        circle.circle(0, 0, 100)
        circle.fill(0xff6600)
        circle.stroke({width: 2, color: 0x000000})
        this.trapsButton.addChild(circle)

        this.trapsButton.text = new Text({text: `traps: ${gameState.trapsCount}`, style: styles.loading})
        this.trapsButton.text.anchor.set(0.5)
        this.trapsButton.text.scale.set(0.5)
        this.trapsButton.text.position.set(0.5, 20)
        this.trapsButton.addChild(this.trapsButton.text)

        const exitText = new Text({text: `START ROUND`, style: styles.loading})
        exitText.anchor.set(0.5)
        exitText.scale.set(0.5)
        exitText.position.set(0.5, -20)
        this.trapsButton.addChild(exitText)

        setCursorPointer(this.trapsButton)
        this.trapsButton.on('pointerup', this.getTrapButtonClick, this)
    }
    getTrapButtonClick() {
        setEnemyFirstWave()
    }
    removeTrapsButton() {
        if (this.trapsButton === null) return

        removeCursorPointer(this.trapsButton)
        this.trapsButton.off('pointerup', this.getTrapButtonClick, this)
        this.removeChild(this.trapsButton)
        this.trapsButton.destroy({children: true})
        this.trapsButton = null
    }
    setEnemyFirstWave() {
        if (this.trapsButton) this.removeTrapsButton()
    }
    addTrap(x, y) {
        this.traps.addChild( createTrap(x, y, null, this.enemies) )
        gameState.trapsCount -= 1
        this.trapsButton.text.text = `traps: ${gameState.trapsCount}`
        if (gameState.trapsCount > 0) return
        else setEnemyFirstWave()
    }

    arrowOnTarget(data) {
        let nearestIndex = -1
        let nearestSqDist = Infinity

        const enemies = this.enemies.children
        const enemiesSize = enemies.length
        for(let i = 0; i < enemiesSize; i++) {
            const enemy = enemies[i]
            const dx = data.x - enemy.x
            const dy = data.y - enemy.y
            const distSq = dx * dx + dy * dy

            if (distSq < enemy.bodySqCollider && distSq < nearestSqDist) {
                nearestSqDist = distSq
                nearestIndex = i
            }
        }

        if (nearestIndex > -1) {
            const enemy = enemies[nearestIndex]
            const x = enemy.x
            const y = enemy.y

            if (this.arrowLastTarget === enemy) {
                this.arrowComboCount++
                this.arrowCurrentPower = Math.floor(this.arrowCurrentPower * this.arrowComboRate)
            } else {
                this.arrowComboCount = 0
                this.arrowLastTarget = enemy
                this.arrowCurrentPower = this.arrowStartPower
            }

            let power = this.arrowCurrentPower
            const textPoint = this.parent.toLocal({ x, y }, this)

            if (nearestSqDist < enemy.headSqCollider) {
                power *= this.arrowHeadShootRate
                this.parent.flyTexts.addChild(
                    new FlyText('HEAD SHOOT', textPoint.x, textPoint.y - 18)
                )
            }

            if (data.isRage === true) power *= gameState.berserkPowerRate

            const text = this.arrowComboCount > 0
                ? `-${power} Combo X${this.arrowComboCount}`
                : `-${power}`
            this.parent.flyTexts.addChild(
                new FlyText(text, textPoint.x, textPoint.y)
            )

            enemy.setDamage(power)

            EventHub.emit(events.enemyHit, {
                x: enemy.x,
                y: enemy.y,
                damage: power,
                bloodType: enemy.bloodType,
                isKill: enemy.hp === 0,
            })

            if (data.isRage !== true) EventHub.emit(events.addRage, power)
        } else {
            this.arrowComboCount = 0
            this.arrowLastTarget = null
            this.arrowCurrentPower = this.arrowStartPower

            const chestReward = this.chests.checkShut(data.x, data.y)
            if (chestReward > 0) {
                const textPoint = this.parent.toLocal({x: data.x, y: data.y}, this)
                this.parent.flyTexts.addChild(
                    new FlyText(`+${chestReward} Gold`, textPoint.x, textPoint.y)
                )
                gameState.gold += chestReward
            } else {
                this.arrowsOnGround.addChild(createArrowOnGround(data.x, data.y, data.direction))
            }
        }
    }

    handleRoundWin() {
        if (this.tower.hp > 9) {
            const extraGold = Math.floor(this.tower.hp * goldForSavingHp)
            this.parent.flyTexts.addChild(new FlyText(`+${extraGold} EXTRA GOLD`, 0, 0))
            gameState.gold += extraGold
        }

        this.resultPopupTimer = RESULT_POPUP_TIMEOUT
        tickerAdd(this)
    }

    handleRoundLose() {
        this.parent.enemiesSpawner.kill()
        startScene(SCENE_NAME.Menu)
    }

    tick(deltaMs) {
        this.resultPopupTimer -= deltaMs
        if (this.resultPopupTimer > 0) return

        tickerRemove(this)
        showPopup(POPUP_TYPE.UPGRADE)
        gameState.round += 1
        gameState.trapsCount += this.traps.children.length
    }

    kill() {
        tickerRemove(this)
        if (this.dragon) {
            this.dragon.kill()
            this.dragonFire.kill()
        }
        
        if (this.trapsButton) this.removeTrapsButton()

        EventHub.off(events.arrowOnTarget, this.arrowOnTarget, this)
        EventHub.off(events.setTrapsOnMap, this.setTrapsOnMap, this)
        EventHub.off(events.setEnemyFirstWave, this.setEnemyFirstWave, this)

        if (this.blood) {
            this.blood.kill()
            this.blood = null
        }

        if (this.smoke) {
            this.smoke.kill()
            this.smoke = null
        }

        kill(this.deadEnemies)
        kill(this.traps)
        kill(this.enemies)
        kill(this.arrowsOnGround)
        kill(this.arrowPoints)
        kill(this.arrows)
        kill(this.enemyArrows)

        kill(this.tower)
        kill(this.chests)
        kill(this.lightnings)
        kill(this.stones)
        kill(this.enemiesHp)
        kill(this.testGraphics)
    }
}