import { AnimatedSprite, Graphics } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";
import { updateDragonFuel } from "../../../app/events";
import { dragonFuelMax, gameState } from "../../state";

const TAU = Math.PI * 2

const TOWER_OFFSET = 180
const FLY_SPEED = 0.0004
const FLY_AWAY_SPEED = 0.08
const FLY_AWAY_ALPHA_STEP = 0.00012

const FLY_IN_START_DIST = 600    // стартовая дистанция от точки входа вдоль касательной

const SPARKS_COUNT = 96
const FIRE_DURATION = 1200
const DAMAGE_TIMEOUT = 120

const SCAN_TIMEOUT = 120
const SCAN_RADIUS = 80
const SCAN_OFFSET_FORWARD = 120
const SCAN_OFFSET_SIDE = 30

export default class Dragon extends AnimatedSprite {
    constructor(enemies, emitFire, onFuelEmpty) {
        super(atlases.dragon.animations.fly)

        this.anchor.set(0.8, 0.5)
        this.animationSpeed = 0.5
        this.play()

        this.onFuelEmpty = onFuelEmpty

        // ---------------- Состояние ----------------
        // 'fly_in' | 'orbit' | 'fly_away'
        this.state = 'fly_in'

        // Случайная точка входа на орбите
        const entryAngle = Math.random() * TAU
        this.entryAngle = entryAngle

        // Касательный вектор (направление движения по орбите)
        const tangentX = Math.cos(entryAngle)
        const tangentY = Math.sin(entryAngle)

        // Точка входа на орбите
        const entryX = Math.sin(entryAngle) * TOWER_OFFSET
        const entryY = -Math.cos(entryAngle) * TOWER_OFFSET

        // Стартовая позиция — "позади" точки входа по касательной
        this.position.set(
            entryX - tangentX * FLY_IN_START_DIST,
            entryY - tangentY * FLY_IN_START_DIST
        )

        // Спрайт смотрит по касательной — как будто уже летит по орбите
        this.rotation = entryAngle
        this.alpha = 0
        this.flyInRemaining = FLY_IN_START_DIST

        // ---------------- Общее ----------------
        this.enemies = enemies
        this.emitFire = emitFire

        this.isOnAttack = false
        this.fuel = gameState.dragonFuel
        this.scanTimeout = SCAN_TIMEOUT
        this.damageTimeout = DAMAGE_TIMEOUT
        this.fireTimeout = 0

        this.scanLocalPoint = { x: SCAN_OFFSET_FORWARD, y: SCAN_OFFSET_SIDE }

        this.circles = new Graphics()
        this.addChild(this.circles)
        this.updateCircles()

        tickerAdd(this)
        updateDragonFuel(1)
    }

    updateCircles(isOnAttack = false) {
        return
        this.circles.clear()

        this.circles.circle(this.scanLocalPoint.x, this.scanLocalPoint.y, SCAN_RADIUS)
        this.circles.stroke({ width: 2, color: isOnAttack ? 0xff0000 : 0xffff00 })

        const H = { x: 0, y: 0 }
        const C = this.scanLocalPoint
        const R = SCAN_RADIUS

        const Vx = C.x - H.x
        const Vy = C.y - H.y
        const L = Math.sqrt(Vx * Vx + Vy * Vy)
        const Nx = Vx / L
        const Ny = Vy / L
        const Px = -Ny
        const Py = Nx
        const leftX = C.x + Px * R
        const leftY = C.y + Py * R
        const rightX = C.x - Px * R
        const rightY = C.y - Py * R

        this.circles.moveTo(H.x, H.y)
        this.circles.lineTo(leftX, leftY)
        this.circles.lineTo(rightX, rightY)
        this.circles.closePath()
        this.circles.stroke({ width: 2, color: 0xff00ff })
    }

    scanEnemies() {
        this.scanTimeout = SCAN_TIMEOUT

        const localScan = this.parent.toLocal(this.scanLocalPoint, this)
        const radiusSq = SCAN_RADIUS * SCAN_RADIUS

        for (let i = 0; i < this.enemies.children.length; i++) {
            const enemy = this.enemies.children[i]
            if (enemy.hp <= 0) continue

            const dx = enemy.x - localScan.x
            const dy = enemy.y - localScan.y
            if (dx * dx + dy * dy <= radiusSq) {
                if (!this.isOnAttack) {
                    this.isOnAttack = true
                    this.damageTimeout = DAMAGE_TIMEOUT
                    this.updateCircles(true)
                }
                this.fireTimeout = FIRE_DURATION
            }
        }
    }

    addFire() {
        const apex   = this.parent.toLocal({ x: 0, y: 0 }, this)
        const center = this.parent.toLocal(this.scanLocalPoint, this)

        this.emitFire(
            apex.x, apex.y,
            center.x, center.y,
            SCAN_RADIUS,
            SPARKS_COUNT
        )
    }

    addDamage() {
        this.damageTimeout = DAMAGE_TIMEOUT

        const H = {x: 0, y: 0}
        const C = this.scanLocalPoint
        const R = SCAN_RADIUS

        const globalH = this.enemies.toLocal(H, this)
        const globalC = this.enemies.toLocal(C, this)

        const Vx = globalC.x - globalH.x
        const Vy = globalC.y - globalH.y
        const L_sq = Vx * Vx + Vy * Vy

        for (let i = 0; i < this.enemies.children.length; i++) {
            const enemy = this.enemies.children[i]
            if (enemy.hp <= 0) continue

            const ex = enemy.x
            const ey = enemy.y

            const Wx = ex - globalH.x
            const Wy = ey - globalH.y

            let t = (Wx * Vx + Wy * Vy) / L_sq
            if (t < 0) t = 0
            if (t > 1) t = 1

            const closestX = globalH.x + t * Vx
            const closestY = globalH.y + t * Vy

            const dx = ex - closestX
            const dy = ey - closestY
            const distSq = dx * dx + dy * dy

            const allowedRadius = t * R
            const allowedRadiusSq = allowedRadius * allowedRadius

            if (distSq <= allowedRadiusSq) {
                enemy.setDamage(gameState.dragonPower)
            }
        }

        this.fuel--
        if (this.fuel <= 0) {
            updateDragonFuel(0)
            this.state = 'fly_away'
            this.onFuelEmpty()
        } else {
            updateDragonFuel(this.fuel / gameState.dragonFuel)
        }
    }

    // ============================================================
    // Tick
    // ============================================================
    tick(deltaMs) {
        if (this.state === 'fly_in')   return this.tickFlyIn(deltaMs)
        if (this.state === 'fly_away') return this.tickFlyAway(deltaMs)
        return this.tickOrbit(deltaMs)
    }

    tickFlyIn(deltaMs) {
        const step = FLY_AWAY_SPEED * deltaMs
        this.flyInRemaining -= step

        if (this.flyInRemaining <= 0) {
            // Влетели — снап на орбиту
            this.x = Math.sin(this.entryAngle) * TOWER_OFFSET
            this.y = -Math.cos(this.entryAngle) * TOWER_OFFSET
            this.rotation = this.entryAngle
            this.alpha = 1
            this.state = 'orbit'
            return
        }

        this.x += Math.cos(this.entryAngle) * step
        this.y += Math.sin(this.entryAngle) * step

        this.alpha = Math.min(1, this.alpha + FLY_AWAY_ALPHA_STEP * deltaMs)
    }

    tickOrbit(deltaMs) {
        this.rotation += FLY_SPEED * deltaMs
        this.position.set(
            Math.sin(this.rotation) * TOWER_OFFSET,
            -Math.cos(this.rotation) * TOWER_OFFSET
        )

        this.scanTimeout -= deltaMs
        if (this.scanTimeout <= 0) this.scanEnemies()

        if (this.fireTimeout > 0) {
            this.fireTimeout -= deltaMs
            if (this.fireTimeout <= 0) {
                this.isOnAttack = false
                this.updateCircles(false)
            }
            else this.addFire()
        }

        if (this.isOnAttack) {
            this.damageTimeout -= deltaMs
            if (this.damageTimeout <= 0) {
                this.addDamage()
                this.damageTimeout = DAMAGE_TIMEOUT
            }
        }
    }

    tickFlyAway(deltaMs) {
        const speed = FLY_AWAY_SPEED * deltaMs
        this.position.x += Math.cos(this.rotation) * speed
        this.position.y += Math.sin(this.rotation) * speed

        this.alpha -= FLY_AWAY_ALPHA_STEP * deltaMs
        if (this.alpha <= 0) this.kill()
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        this.destroy()
    }
}