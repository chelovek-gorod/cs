import { AnimatedSprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";
import { catapultShootDistance, catapultShootTimeout } from "../../state";
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

        this.shootTimeout = catapultShootTimeout * startShootTimeoutRate
        this.shootSqDist = catapultShootDistance * catapultShootDistance

        tickerAdd(this)
    }

    shoot() {
        this.shootTimeout = catapultShootTimeout

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