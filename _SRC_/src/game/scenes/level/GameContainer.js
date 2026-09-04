import { Container, Graphics } from "pixi.js"
import { kill } from "../../../app/application"
import { EventHub, events, showPopup, startScene } from "../../../app/events"
import FlyText from "../../effects/FlyText"
import { POPUP_TYPE } from "../../popup/popupTypes"
import { addGold, addRound, arrowPower } from "../../state"
import { SCENE_NAME } from "../SceneManager"
import { createArrowOnGround } from "./ArrowOnGround"
import Tower from "./Tower"

const SIZE = 800
const MAX_SCALE = 1.3

export default class GameContainer extends Container {
    constructor() {
        super()

        this.deadEnemies = new Container()
        this.addChild(this.deadEnemies)

        this.arrowPoints = new Container()
        this.addChild(this.arrowPoints)

        this.arrowsOnGround = new Container()
        this.addChild(this.arrowsOnGround)

        this.arrows = new Container()
        this.stones = new Container()
        this.particles = null

        this.lightnings = new Graphics()

        this.enemies = new Container()
        this.addChild(this.enemies)

        this.enemiesHp = new Container()

        this.tower = new Tower(
            this.arrowPoints, this.arrowsOnGround, this.arrows,
            this.stones, this.lightnings, this.enemies, this.particles
        )

        this.enemyArrows = new Container()

        this.arrowStartPower = arrowPower
        this.arrowCurrentPower = this.arrowStartPower
        this.arrowComboRate = 1.2
        this.arrowComboCount = 0
        this.arrowHeadShutRate = 3
        this.arrowLastTarget = null
        this.addChild(this.tower)

        this.addChild(this.lightnings)
        this.addChild(this.enemyArrows)
        this.addChild(this.arrows)
        this.addChild(this.stones)

        this.addChild(this.enemiesHp)

        EventHub.on(events.arrowOnTarget, this.arrowOnTarget, this)

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
            const x = enemies[nearestIndex].x
            const y = enemies[nearestIndex].y

            if (this.arrowLastTarget === enemies[nearestIndex]) {
                this.arrowComboCount++
                this.arrowCurrentPower = Math.floor(this.arrowCurrentPower * this.arrowComboRate)
            } else {
                this.arrowComboCount = 0
                this.arrowLastTarget = enemies[nearestIndex]
                this.arrowCurrentPower = this.arrowStartPower
            }

            let power = this.arrowCurrentPower

            if (nearestSqDist < enemies[nearestIndex].headSqCollider) {
                power *= this.arrowHeadShutRate
                this.parent.flyTexts.addChild(new FlyText('HEAD SHUT', x, y - 18))
            }

            const text = this.arrowComboCount > 0
                ? `-${power} Combo X${this.arrowComboCount}`
                : `-${power}`
            this.parent.flyTexts.addChild(new FlyText(text, x, y))
            enemies[nearestIndex].setDamage(power)
        } else {
            this.arrowComboCount = 0
            this.arrowLastTarget = null
            this.arrowCurrentPower = this.arrowStartPower
            this.arrowsOnGround.addChild(createArrowOnGround(data.x, data.y, data.direction))
        }
    }

    handleRoundWin() {
        if (this.tower.hp > 9) {
            const extraGold = Math.floor(this.tower.hp * 0.1)
            this.parent.flyTexts.addChild(new FlyText(`+${extraGold} EXTRA GOLD`, 0, 0))
            addGold(extraGold)
        }

        setTimeout( () => {
            showPopup(POPUP_TYPE.UPGRADE)
            addRound()
        }, 1800)
    }

    handleRoundLose() {
        this.parent.enemiesSpawner.kill()
        startScene(SCENE_NAME.Menu)
    }

    kill() {
        EventHub.off(events.arrowOnTarget, this.arrowOnTarget, this)

        kill(this.deadEnemies)
        kill(this.enemies)
        kill(this.arrowsOnGround)
        kill(this.arrowPoints)
        kill(this.arrows)
        kill(this.enemyArrows)
    }
}