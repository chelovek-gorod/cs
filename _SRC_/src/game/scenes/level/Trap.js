import { AnimatedSprite, Graphics } from "pixi.js"
import { tickerAdd, tickerRemove } from "../../../app/application"
import { atlases, sounds } from "../../../app/assets"
import { soundPlay } from "../../../app/sound"
import { createObjectPool } from "../../../utils/pool"
import { gameState } from "../../state"
import { trapExploded, addExplosion } from "../../../app/events"

const TRAP_POOL = createObjectPool(100)

export function createTrap(x, y, particles, enemies, index) {
    let trap = TRAP_POOL.get()
    if (trap) {
        trap.reset(x, y, particles, enemies, index)
    } else {
        trap = new Trap(x, y, particles, enemies, index)
        TRAP_POOL.add(trap)
    }
    return trap
}

class Trap extends AnimatedSprite {
    constructor(x, y, particles, enemies, index) {
        super(atlases.trap.animations.burn)

        this.anchor.set(0.5)
        this.animationSpeed = 0.25
        this.play()

        this.rangeCircle = new Graphics()
        this.addChild(this.rangeCircle)

        this.reset(x, y, particles, enemies, index)
    }
  
    reset(x, y, particles, enemies, index) {
        this.position.set(x, y)

        this.slotIndex = index

        this.particles = particles
        this.enemies = enemies

        this.rotation = Math.random() * 6.3

        this.isCheckFrame = Math.random() < 0.5 ? false : true

        // test
        this.rangeCircle.clear()
        this.rangeCircle.circle(0, 0, gameState.trapRadius * 0.5)
        this.rangeCircle.stroke({ width: 2, color: 0xffff00 })

        tickerAdd(this)
        soundPlay(sounds.se_catapult_shoot.rate(0.8))
    }

    setDamage() {
        trapExploded(this.slotIndex)

        addExplosion({
            atlasName: 'explosion_stone',
            x: this.x,
            y: this.y,
            radius: gameState.trapRadius,
            frameDamage: 4,
            damage: gameState.trapPower, 
        })

        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        TRAP_POOL.put(this)
    }

    tick(deltaMs) {
        this.isCheckFrame = !this.isCheckFrame
        if (!this.isCheckFrame) return

        const enemies = this.enemies.children
        const triggerR = gameState.trapRadius * 0.5
        let isActive = false
    
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i]
            if (enemy.hp <= 0) continue
            if (enemy.alpha <= 0) continue

            const dx = this.x - enemy.x
            const dy = this.y - enemy.y
            const distSq = dx * dx + dy * dy

            const touchR = triggerR + enemy.bodyCollider

            if (distSq < touchR * touchR) {
                isActive = true
                break
            }
        }
    
        if (isActive) this.setDamage()
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
    }
}