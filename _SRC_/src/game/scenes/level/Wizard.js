import { AnimatedSprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";
import { drawLightning } from "../../../utils/lightning";
import { wizardShutTimeout } from "../../state";

const LIGHTNING_FORWARD_OFFSET = 40
const LIGHTNING_SIDE_OFFSET = 8

export default class Wizard extends AnimatedSprite {
    constructor(x, y, lightnings, enemies, startShutTimeoutRate) {
        super(atlases.wizard.animations.shut)
        
        this.anchor.set(0.5)
        this.animationSpeed = 0.5
        this.loop = false
        this.position.set(x, y)

        this.lightnings = lightnings
        this.enemies = enemies

        this.shutTimeout = wizardShutTimeout * startShutTimeoutRate
        this.shutCount = 0
        this.shutPoint = {x: 0, y: 0}
        this.startPoint = {x: 0, y: 0}
        this.targetPoint = null

        tickerAdd(this)
    }

    shut() {
        this.shutTimeout = wizardShutTimeout

        let nearestEnemy = null
        let nearestDist = Infinity
        const enemies = this.enemies.children
        const enemiesCount = enemies.length
        for (let i = 0; i < enemiesCount; i++) {
            const dx = enemies[i].x
            const dy = enemies[i].y
            const distance = dx * dx + dy * dy
            if (distance < nearestDist) {
                nearestDist = distance
                nearestEnemy = enemies[i]
            }
        }

        if (nearestDist === Infinity) return

        this.rotation = Math.atan2(nearestEnemy.y, nearestEnemy.x)
        this.shutCount = 6
        const startDX = Math.cos(this.rotation)
        const startDY = Math.sin(this.rotation)
        this.startPoint.x = this.x + startDX * LIGHTNING_FORWARD_OFFSET + -startDY * LIGHTNING_SIDE_OFFSET
        this.startPoint.y= this.y + startDY * LIGHTNING_FORWARD_OFFSET + startDX * LIGHTNING_SIDE_OFFSET
        this.shutPoint.x = nearestEnemy.x
        this.shutPoint.y = nearestEnemy.y
        drawLightning(this.startPoint, nearestEnemy, this.lightnings)
        this.gotoAndPlay(0)
        nearestEnemy.onLightning()
    }

    tick(deltaMs) {
        if (this.shutCount > 0) {
            this.lightnings.clear()
            this.shutCount--
            if (this.shutCount > 0) drawLightning(this.startPoint, this.shutPoint, this.lightnings)
        }

        if (this.shutTimeout > 0) this.shutTimeout -= deltaMs
        else this.shut()
    }

    kill() {
        tickerRemove(this)
    }
}