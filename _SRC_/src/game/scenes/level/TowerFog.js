import { Container, AnimatedSprite, Graphics } from "pixi.js"
import { tickerAdd, tickerRemove } from "../../../app/application"
import { atlases } from "../../../app/assets"
import { gameState } from "../../state"

const POOL_SIZE = 48
const SPAWN_INTERVAL = 50
const FOG_DURATION = 5000
const RING_RADIUS = 128
const ANIMATION_SPEED = 0.3
const TINT = 0x66ff44
const TAU = Math.PI * 2
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

const INNER_RADIUS = 96
const DAMAGE_RADIUS = 160
const DAMAGE_RADIUS_SQ = DAMAGE_RADIUS * DAMAGE_RADIUS
const DAMAGE_INTERVAL = 500

export default class TowerFog extends Container {
    constructor(enemiesContainer, onFinished) {
        super()

        this.onFinished = onFinished
        this.enemiesContainer = enemiesContainer
        this.isNotified = false

        this.rings = new Graphics()
        this.rings.circle(0, 0, INNER_RADIUS)
        this.rings.stroke({ width: 2, color: 0x66ff44, alpha: 0.4 })
        this.rings.circle(0, 0, DAMAGE_RADIUS)
        this.rings.stroke({ width: 2, color: 0x66ff44, alpha: 0.4 })
        this.rings.visible = false
        this.addChild(this.rings)

        this.pool = []
        this.active = []
        this.isSpawning = false
        this.spawnTimer = 0
        this.durationTimer = 0
        this.spawnAngle = 0
        this.damageTimer = 0

        for (let i = 0; i < POOL_SIZE; i++) {
            const sprite = new AnimatedSprite(atlases.smoke.animations.effect)
            sprite.anchor.set(0.5)
            sprite.animationSpeed = ANIMATION_SPEED
            sprite.loop = false
            sprite.tint = TINT
            this.pool.push(sprite)
        }

        tickerAdd(this)
    }

    start() {
        this.isSpawning = true
        this.spawnTimer = 0
        this.durationTimer = FOG_DURATION
        this.spawnAngle = Math.random() * TAU
        this.damageTimer = 0
        this.isNotified = false
        this.rings.visible = true
    }

    stop() {
        this.isSpawning = false
    }

    spawnAt(angle) {
        if (this.pool.length === 0) return

        const sprite = this.pool.pop()
        sprite.position.set(
            Math.cos(angle) * RING_RADIUS,
            Math.sin(angle) * RING_RADIUS
        )
        sprite.rotation = Math.random() * TAU
        sprite.gotoAndPlay(0)

        sprite.onComplete = () => {
            if (sprite.parent) this.removeChild(sprite)
            this.pool.push(sprite)
            const idx = this.active.indexOf(sprite)
            if (idx !== -1) this.active.splice(idx, 1)
        }

        this.addChild(sprite)
        this.active.push(sprite)
    }

    dealDamage() {
        if (!this.enemiesContainer) return

        const enemies = this.enemiesContainer.children
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i]
            if (enemy.hp <= 0) continue

            const distSq = enemy.x * enemy.x + enemy.y * enemy.y
            if (distSq <= DAMAGE_RADIUS_SQ) {
                enemy.setDamage(gameState.towerFogPower, true)
            }
        }
    }

    tick(deltaMs) {
        if (this.isSpawning) {
            this.durationTimer -= deltaMs
            if (this.durationTimer <= 0) {
                this.isSpawning = false
            } else {
                this.spawnTimer -= deltaMs
                if (this.spawnTimer <= 0) {
                    this.spawnTimer += SPAWN_INTERVAL
                    this.spawnAt(this.spawnAngle)
                    this.spawnAngle = (this.spawnAngle + GOLDEN_ANGLE) % TAU
                }
            }
        }

        if (this.active.length > 0) {
            this.damageTimer -= deltaMs
            if (this.damageTimer <= 0) {
                this.damageTimer += DAMAGE_INTERVAL
                this.dealDamage()
            }
        }

        if (!this.isSpawning && this.active.length === 0 && !this.isNotified) {
            this.isNotified = true
            this.rings.visible = false
            if (this.onFinished) this.onFinished()
        }
    }

    kill() {
        tickerRemove(this)
        for (const s of this.active) {
            if (s.parent) this.removeChild(s)
            s.destroy()
        }
        this.active.length = 0
        for (const s of this.pool) s.destroy()
        this.pool.length = 0
        if (this.parent) this.parent.removeChild(this)
        super.destroy({ children: true })
    }
}