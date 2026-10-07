import { AnimatedSprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";
import { gameState } from "../../state";
import { createStone } from "./Stone";


export default class Catapult extends AnimatedSprite {
    constructor(x, y, catapultStones, enemies, startShootTimeoutRate, particles) {
        super(atlases.catapult.animations.shoot)

        this.anchor.set(0.5)
        this.animationSpeed = 0.5
        this.loop = false
        this.position.set(x, y)

        this.stones = catapultStones
        this.particles = particles
        this.enemies = enemies

        this.shootTimeout = gameState.catapultTimeout * startShootTimeoutRate
        this.shootSqDist = gameState.catapultDistance * gameState.catapultDistance

        tickerAdd(this)
    }

    shoot() {
        this.shootTimeout = gameState.catapultTimeout

        let strongestEnemy = null
        let strongestHP = -Infinity
        const enemies = this.enemies.children
        const enemiesCount = enemies.length
        for (let i = 0; i < enemiesCount; i++) {
            const dx = this.x - enemies[i].x
            const dy = this.y - enemies[i].y
            const distance = dx * dx + dy * dy
            if (distance < this.shootSqDist && enemies[i].hp > strongestHP) {
                strongestHP = enemies[i].hp
                strongestEnemy = enemies[i]
            }
        }

        if (strongestHP <= 0) return
        this.rotation = Math.atan2(strongestEnemy.y, strongestEnemy.x)

        this.stones.addChild(
            createStone(this.x, this.y, strongestEnemy.x, strongestEnemy.y, this.particles, this.enemies)
        )
        this.gotoAndPlay(0)
    }

    tick(deltaMs) {
        if (this.shootTimeout > 0) this.shootTimeout -= deltaMs
        else this.shoot()
    }

    kill() {
        tickerRemove(this)
    }
}