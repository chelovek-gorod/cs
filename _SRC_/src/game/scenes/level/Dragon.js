import { AnimatedSprite, Graphics } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";
import { dragonFuelMax, gameState } from "../../state";

const TOWER_OFFSET = 180          // Радиус полета
const FLY_SPEED = 0.0004
const FLY_AWAY_SPEED = 0.08
const FLY_AWAY_ALPHA_STEP = 0.00009

const SPARKS_COUNT = 96
const FIRE_DURATION = 1200
const DAMAGE_TIMEOUT = 120

const SCAN_TIMEOUT = 120
const SCAN_RADIUS = 80
const SCAN_OFFSET_FORWARD = 120 // Небольшой сдвиг вдоль тела дракона
const SCAN_OFFSET_SIDE = 30     // Дополнительный сдвиг В СТОРОНУ БАШНИ от зоны атаки

export default class Dragon extends AnimatedSprite {
    constructor(enemies, emitFire) {
        super(atlases.dragon.animations.fly)

        this.anchor.set(0.8, 0.5)
        this.position.set(0, -TOWER_OFFSET)
        this.rotation = 0

        this.animationSpeed = 0.5
        this.play()

        this.enemies = enemies
        this.emitFire = emitFire

        this.isOnAttack = false
        this.fuel = gameState.dragonFuel
        this.scanTimeout = SCAN_TIMEOUT
        this.damageTimeout = DAMAGE_TIMEOUT
        this.fireTimeout = 0
        //this.isParticleFrame = false

        this.scanLocalPoint = { x: SCAN_OFFSET_FORWARD, y: SCAN_OFFSET_SIDE }

        this.circles = new Graphics()
        this.addChild(this.circles)
        this.updateCircles()

        tickerAdd(this)
    }

    updateCircles(isOnAttack = false) {
        return
        this.circles.clear()

        this.circles.circle(this.scanLocalPoint.x, this.scanLocalPoint.y, SCAN_RADIUS)
        this.circles.stroke({ width: 2, color: isOnAttack ? 0xff0000 : 0xffff00 })

        // Рисуем конус атаки (треугольник от головы до краев круга)
        const H = { x: 0, y: 0 } // Голова
        const C = this.scanLocalPoint // Центр круга
        const R = SCAN_RADIUS
        
        // Вектор от головы к центру круга
        const Vx = C.x - H.x
        const Vy = C.y - H.y
        const L = Math.sqrt(Vx * Vx + Vy * Vy)
        
        // Нормализованный вектор
        const Nx = Vx / L
        const Ny = Vy / L
        
        // Перпендикулярный вектор (для ширины конуса)
        const Px = -Ny
        const Py = Nx
        
        // Две точки на окружности круга (основание треугольника)
        const leftX = C.x + Px * R
        const leftY = C.y + Py * R
        const rightX = C.x - Px * R
        const rightY = C.y - Py * R
        
        // Рисуем треугольник
        this.circles.moveTo(H.x, H.y)
        this.circles.lineTo(leftX, leftY)
        this.circles.lineTo(rightX, rightY)
        this.circles.closePath()
        this.circles.stroke({ width: 2, color: 0xff00ff }) // Зеленый конус
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
                // ВРАГ ОБНАРУЖЕН - сразу начинаем атаку
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
        //this.isParticleFrame = !this.isParticleFrame
        //if (!this.isParticleFrame) return
    
        // apex (голова дракона) и центр scan-круга — в системе родителя
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

        // Один раз переводим локальные точки в систему координат врагов
        const globalH = this.enemies.toLocal(H, this)
        const globalC = this.enemies.toLocal(C, this)

        // Вектор от головы к центру круга
        const Vx = globalC.x - globalH.x
        const Vy = globalC.y - globalH.y
        const L_sq = Vx * Vx + Vy * Vy

        for (let i = 0; i < this.enemies.children.length; i++) {
            const enemy = this.enemies.children[i]
            if (enemy.hp <= 0) continue

            // Враги уже в системе координат this.enemies
            const ex = enemy.x
            const ey = enemy.y

            // Вектор от головы к врагу
            const Wx = ex - globalH.x
            const Wy = ey - globalH.y

            // Проекция врага на ось "голова -> центр круга" (от 0 до 1)
            let t = (Wx * Vx + Wy * Vy) / L_sq

            if (t < 0) t = 0
            if (t > 1) t = 1

            // Ближайшая точка на оси конуса
            const closestX = globalH.x + t * Vx
            const closestY = globalH.y + t * Vy

            // Расстояние от врага до оси
            const dx = ex - closestX
            const dy = ey - closestY
            const distSq = dx * dx + dy * dy

            // Допустимый радиус
            const allowedRadius = t * R
            const allowedRadiusSq = allowedRadius * allowedRadius

            if (distSq <= allowedRadiusSq) {
                enemy.setDamage(gameState.dragonPower)
            }
        }

        this.fuel--
        if (this.fuel <= 0) {
            gameState.dragonsCount -= 1
            gameState.dragonFuel = dragonFuelMax
        }
    }

    tick(deltaMs) {
        if (this.fuel <= 0) {
            // Летим по прямой, сохраняя текущее направление
            const speed = FLY_AWAY_SPEED * deltaMs
            this.position.x += Math.cos(this.rotation) * speed
            this.position.y += Math.sin(this.rotation) * speed
        
            // Постепенное исчезновение
            this.alpha -= FLY_AWAY_ALPHA_STEP * deltaMs
            if (this.alpha <= 0) this.kill()
            
            return
        }

        // полет
        this.rotation += FLY_SPEED * deltaMs
        this.position.set(
            Math.sin(this.rotation) * TOWER_OFFSET,
            -Math.cos(this.rotation) * TOWER_OFFSET
        )

        // скан
        this.scanTimeout -= deltaMs
        if (this.scanTimeout <= 0) this.scanEnemies()

        // выпуск частиц огня
        if (this.fireTimeout > 0) {
            this.fireTimeout -= deltaMs
            if (this.fireTimeout <= 0) {
                this.isOnAttack = false
                this.updateCircles(false)
            }
            else this.addFire()
        }

        // атака
        if (this.isOnAttack) {
            this.damageTimeout -= deltaMs
            if (this.damageTimeout <= 0) {
                this.addDamage()
                this.damageTimeout = DAMAGE_TIMEOUT // Сбрасываем таймер для следующего тика урона
            }
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        this.destroy()
    }
}