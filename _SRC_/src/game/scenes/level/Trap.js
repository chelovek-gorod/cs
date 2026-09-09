import { AnimatedSprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases, sounds } from "../../../app/assets";
import { soundPlay } from "../../../app/sound";
import { moveToTarget } from "../../../utils/functions";
import { createObjectPool } from "../../../utils/pool";
import Explosion from "../../effects/Explosion";
import { catapultDamageRadius, catapultPower, trapActivationDistance, trapDamageRadius, trapPower } from "../../state";

const TRAP_POOL = createObjectPool(100)

export function createTrap(x, y, particles, enemies) {
    let trap = TRAP_POOL.get()
    if (trap) {
        trap.reset(x, y, particles, enemies)
    } else {
        trap = new Trap(x, y, particles, enemies)
        TRAP_POOL.add(trap)
    }
    return trap
}

class Trap extends AnimatedSprite {
    constructor(x, y, particles, enemies) {
        super(atlases.trap.animations.burn)

        this.anchor.set(0.5)
        this.animationSpeed = 0.25
        this.play()

        this.rangeSq = trapActivationDistance * trapActivationDistance
        this.damageSq = trapDamageRadius * trapDamageRadius

        this.reset(x, y, particles, enemies)
    }
  
    reset(x, y, particles, enemies) {
        this.position.set(x, y)

        this.particles = particles
        this.enemies = enemies

        this.rotation = Math.random() * 6.3

        this.isCheckFrame = Math.random() < 0.5 ? false : true

        tickerAdd(this)
        soundPlay(sounds.se_catapult_shoot.rate(0.8))
    }

    setDamage(enemies) {
        this.parent.addChild(
            new Explosion(this.x, this.y, 'explosion_stone', catapultDamageRadius)
        )

        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].setDamage(trapPower)
        }

        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        TRAP_POOL.put(this)
    }

    tick(deltaMs) {
        this.isCheckFrame = !this.isCheckFrame
        if (!this.isCheckFrame) return

        const enemies = this.enemies.children
        const enemiesCount = enemies.length
        const damagedEnemies = []
        let isActive = false
    
        for (let i = 0; i < enemiesCount; i++) {
            const dx = this.x - enemies[i].x
            const dy = this.y - enemies[i].y
            const dist = dx * dx + dy * dy
            if (dist < this.damageSq) {
                damagedEnemies.push(enemies[i])
                if (!isActive && dist < this.rangeSq) isActive = true
            }
        }
    
        if (isActive) this.setDamage(damagedEnemies)
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
    }
}