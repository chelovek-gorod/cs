import { Container, AnimatedSprite, Graphics } from "pixi.js"
import { tickerAdd, tickerRemove } from "../../../app/application"
import { atlases } from "../../../app/assets"
import { gameState } from "../../state"

const POOL_SIZE = 128
const TINT = 0x66ff44
const TAU = Math.PI * 2
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const ANIMATION_SPEED = 0.5

// кольцо
const RING_WIDTH = 64
const START_RADIUS_MIN = 12
const MAX_RING_RADIUS = 256
const RING_SPEED = 0.06   // px/ms

// плотность тумана
const SPAWN_INTERVAL = 12  // мс, базовый интервал при минимальном кольце

// урон
const DAMAGE_INTERVAL = 120

// площадь кольца при минимальном радиусе (π сокращается в ratio)
const AREA_MIN = (START_RADIUS_MIN + RING_WIDTH) ** 2 - START_RADIUS_MIN ** 2

export default class TowerFog extends Container {
    constructor(enemiesContainer, onFinished) {
        super()

        this.onFinished = onFinished
        this.enemiesContainer = enemiesContainer
        this.isNotified = false

        this.innerRingRadius = START_RADIUS_MIN

        this.rings = new Graphics()
        this.rings.visible = false
        this.addChild(this.rings)
        this.drawRings()

        this.pool = []
        this.active = []
        this.isGrowing = false
        this.spawnTimer = 0
        this.damageTimer = 0
        this.spawnAngle = 0

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
        this.innerRingRadius = START_RADIUS_MIN
        this.isGrowing = true
        this.spawnTimer = 0
        this.damageTimer = DAMAGE_INTERVAL
        this.spawnAngle = Math.random() * TAU
        this.isNotified = false
        this.rings.visible = true
        this.drawRings()
    }

    stop() {
        this.isGrowing = false
    }

    drawRings() {
        const inner = this.innerRingRadius
        const outer = this.innerRingRadius + RING_WIDTH

        this.rings.clear()
        this.rings.circle(0, 0, inner)
        this.rings.stroke({ width: 2, color: TINT, alpha: 0.4 })
        this.rings.circle(0, 0, outer)
        this.rings.stroke({ width: 2, color: TINT, alpha: 0.4 })
    }

    spawnAt() {
        if (this.pool.length === 0) return

        const radius = this.innerRingRadius + Math.random() * RING_WIDTH
        const angle = this.spawnAngle

        const sprite = this.pool.pop()
        sprite.position.set(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
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

        this.spawnAngle = (this.spawnAngle + GOLDEN_ANGLE) % TAU
    }

    dealDamage() {
        if (!this.enemiesContainer) return

        const innerR = this.innerRingRadius
        const outerR = this.innerRingRadius + RING_WIDTH
        const innerSq = innerR * innerR
        const outerSq = outerR * outerR

        const enemies = this.enemiesContainer.children
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i]
            if (enemy.hp <= 0) continue
            if (enemy.alpha <= 0) continue

            const distSq = enemy.x * enemy.x + enemy.y * enemy.y
            if (distSq >= innerSq && distSq <= outerSq) {
                enemy.setDamage(gameState.fogPower, true)
            }
        }
    }

    tick(deltaMs) {
        if (this.isGrowing) {
            this.innerRingRadius += RING_SPEED * deltaMs
            if (this.innerRingRadius >= MAX_RING_RADIUS) {
                this.innerRingRadius = MAX_RING_RADIUS
                this.isGrowing = false
            }
            this.drawRings()
        }

        if (this.isGrowing) {
            const innerR = this.innerRingRadius
            const areaCur = (innerR + RING_WIDTH) ** 2 - innerR ** 2
            const rateMul = areaCur / AREA_MIN

            this.spawnTimer -= deltaMs * rateMul
            while (this.spawnTimer <= 0) {
                this.spawnTimer += SPAWN_INTERVAL
                this.spawnAt()
            }
        }

        if (this.active.length > 0) {
            this.damageTimer -= deltaMs
            if (this.damageTimer <= 0) {
                this.damageTimer += DAMAGE_INTERVAL
                this.dealDamage()
            }
        }

        if (!this.isGrowing && this.active.length === 0 && !this.isNotified) {
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