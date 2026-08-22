import { AnimatedSprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";
import { catapultShutTimeout } from "../../state";
import { Stone } from "./Stone";


export default class Catapult extends AnimatedSprite {
    constructor(x, y, catapultStones, enemies, startShutTimeoutRate, particles) {
        super(atlases.catapult.animations.shut)

        this.anchor.set(0.5)
        this.animationSpeed = 0.5
        this.loop = false
        this.position.set(x, y)

        this.stones = catapultStones
        this.particles = particles
        this.enemies = enemies

        this.shutTimeout = catapultShutTimeout * startShutTimeoutRate

        tickerAdd(this)
    }

    shut() {
        this.shutTimeout = catapultShutTimeout

        let strongestEnemy = null
        let strongestHP = -Infinity
        const enemies = this.enemies.children
        const enemiesCount = enemies.length
        for (let i = 0; i < enemiesCount; i++) {
            if (enemies[i].hp > strongestHP) {
                strongestHP = enemies[i].hp
                strongestEnemy = enemies[i]
            }
        }

        if (strongestHP <= 0) return

        this.rotation = Math.atan2(strongestEnemy.y, strongestEnemy.x)
        this.stones.addChild(
            new Stone(this.x, this.y, strongestEnemy.x, strongestEnemy.y, this.particles, this.enemies)
        )
        this.gotoAndPlay(0)
    }

    tick(deltaMs) {
        if (this.shutTimeout > 0) this.shutTimeout -= deltaMs
        else this.shut()
    }

    kill() {
        tickerRemove(this)
    }
}