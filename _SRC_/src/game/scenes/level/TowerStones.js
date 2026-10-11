import { Particle, ParticleContainer, Container } from 'pixi.js'
import { tickerAdd, tickerRemove } from '../../../app/application'
import { images } from '../../../app/assets'
import { createParticlePool } from '../../../utils/pool'

const TAU = Math.PI * 2

// ================================================================
// ПАЛИТРА — 5 оттенков: светлый → тёмный
// ================================================================
const STONE_COLS = [0xd8d8d8, 0xb0b0b0, 0x888888, 0x5a5a5a, 0x3a3a3a]

// ================================================================
// ПАРАМЕТРЫ
// ================================================================
const MAX_PARTICLES = 500

// Количество осколков от урона
const COUNT_MIN = 18
const COUNT_MAX = 72
const DAMAGE_RATE = 1.5

// Разлёт — узкий конус в сторону атаки
const SPREAD = Math.PI * 1.2   // ±25°

// Размер
const SIZE_MIN = 0.07
const SIZE_MAX = 0.21

// Скорость
const SPEED_MIN = 0.35
const SPEED_MAX = 0.75
const SIZE_SPEED_PENALTY = 0.4

// Жизнь
const LIFE_MIN = 240
const LIFE_MAX = 480
const LIFE_SIZE_BONUS = 240      // крупные живут дольше

// Трение — двухфазное
const FRICTION_FLIGHT = 0.992    // пока летит — почти нет торможения
const FRICTION_STOP   = 0.94     // в конце — резкая остановка
const STOP_AT = 0.78             // на какой доле жизни начинается резкое торможение

// Отскок
const BOUNCE_CHANCE      = 0.55
const BOUNCE_AT_MIN      = 0.30
const BOUNCE_AT_MAX      = 0.70
const BOUNCE_SPEED_LOSS  = 0.42
const BOUNCE_ANGLE_JITTER = 0.8   // ±23° от чистого разворота

// Alpha
const ALPHA_FADE_IN    = 0.06
const ALPHA_FADE_START = 0.55
const ALPHA_MAX        = 0.95

const INV_FADE_IN  = 1 / ALPHA_FADE_IN
const INV_FADE_OUT = 1 / (1 - ALPHA_FADE_START)

const WARMUP_ALPHA = 0.01

// ================================================================
// Класс
// ================================================================
export default class TowerStones extends Container {
    constructor() {
        super()

        this.particleContainer = new ParticleContainer({
            dynamicProperties: { position: true, alpha: true, color: true },
        })
        this.particleContainer.eventMode = 'none'
        this.addChild(this.particleContainer)

        this.pool = createParticlePool(MAX_PARTICLES)
        this.active = []
        this.isTickerAdded = false

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = new Particle({
                texture: images.particle,
                x: 0, y: 0,
                anchorX: 0.5, anchorY: 0.5,
                scaleX: 1, scaleY: 1,
                rotation: 0,
                alpha: 1,
            })
            p.data = {}
            this.pool.add(p)
            this.pool.put(p)
        }
    }

    warmup() {
        return new Promise((resolve) => {
            const prevAlpha = this.particleContainer.alpha
            this.particleContainer.alpha = WARMUP_ALPHA

            const warmList = this._fillContainer(this.particleContainer, MAX_PARTICLES)

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this._drainContainer(this.particleContainer, warmList)
                    this.particleContainer.alpha = prevAlpha
                    resolve()
                })
            })
        })
    }

    _fillContainer(pc, count) {
        const list = []
        for (let i = 0; i < count; i++) {
            const p = this.pool.get()
            if (!p) break
            p.x = 0
            p.y = 0
            p.alpha = 1
            p.scaleX = 0.1
            p.scaleY = 0.1
            pc.addParticle(p)
            list.push(p)
        }
        return list
    }

    _drainContainer(pc, list) {
        for (let i = 0; i < list.length; i++) {
            pc.removeParticle(list[i])
            this.pool.put(list[i])
        }
    }

    spawn(x, y, angle, damage) {
        let count = Math.ceil(damage * DAMAGE_RATE)
        if (count < COUNT_MIN) count = COUNT_MIN
        if (count > COUNT_MAX) count = COUNT_MAX

        const colsLen = STONE_COLS.length

        for (let i = 0; i < count; i++) {
            const p = this.pool.get()
            if (!p) break

            // Размер
            const size = SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN)
            const sizeNorm = (size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)

            // Скорость — крупные медленнее
            const baseSpeed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)
            const speed = baseSpeed * (1 - sizeNorm * SIZE_SPEED_PENALTY)

            // Направление — узкий конус
            const dir = angle + (Math.random() - 0.5) * SPREAD
            const vx = Math.cos(dir) * speed
            const vy = Math.sin(dir) * speed

            // Жизнь: базовое + бонус за размер
            const life = LIFE_MIN + Math.random() * (LIFE_MAX - LIFE_MIN) + sizeNorm * LIFE_SIZE_BONUS

            const colIdx = (Math.random() * colsLen) | 0

            // Отскок — рандомный шанс и точка срабатывания
            const willBounce = Math.random() < BOUNCE_CHANCE
            const bounceAt = willBounce
                ? BOUNCE_AT_MIN + Math.random() * (BOUNCE_AT_MAX - BOUNCE_AT_MIN)
                : 2.0   // не сработает никогда

            // scale, rotation, tint — один раз
            p.x = x
            p.y = y
            p.scaleX = size
            p.scaleY = size
            p.rotation = Math.random() * TAU
            p.alpha = 0
            p.tint = STONE_COLS[colIdx]

            const d = p.data
            d.vx = vx
            d.vy = vy
            d.life = life
            d.invLife = 1 / life
            d.bounceAt = bounceAt
            d.bounced = false

            this.particleContainer.addParticle(p)
            this.active.push(p)
        }

        if (!this.isTickerAdded) {
            tickerAdd(this)
            this.isTickerAdded = true
        }
    }

    tick(deltaMs) {
        const particles = this.active
        const dt = deltaMs

        // Две Math.pow на весь тик (не на частицу)
        const flightFriction = Math.pow(FRICTION_FLIGHT, dt)
        const stopFriction   = Math.pow(FRICTION_STOP, dt)

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i]
            const d = p.data

            d.life -= dt
            let progress = 1 - d.life * d.invLife
            if (progress < 0) progress = 0
            else if (progress > 1) progress = 1

            // ---- ОТСКОК: раз в жизнь, в середине полёта ----
            if (!d.bounced && progress >= d.bounceAt) {
                d.bounced = true

                const speedSq = d.vx * d.vx + d.vy * d.vy
                const speedOld = Math.sqrt(speedSq)
                const angleOld = Math.atan2(d.vy, d.vx)
                const jitter = (Math.random() - 0.5) * BOUNCE_ANGLE_JITTER
                const angleNew = angleOld + Math.PI + jitter
                const speedNew = speedOld * BOUNCE_SPEED_LOSS

                d.vx = Math.cos(angleNew) * speedNew
                d.vy = Math.sin(angleNew) * speedNew
            }

            // ---- Движение + трение по фазе ----
            p.x += d.vx * dt
            p.y += d.vy * dt

            const friction = progress < STOP_AT ? flightFriction : stopFriction
            d.vx *= friction
            d.vy *= friction

            // ---- Alpha ----
            if (progress < ALPHA_FADE_IN) {
                p.alpha = ALPHA_MAX * (progress * INV_FADE_IN)
            } else if (progress < ALPHA_FADE_START) {
                p.alpha = ALPHA_MAX
            } else {
                const k = (progress - ALPHA_FADE_START) * INV_FADE_OUT
                p.alpha = ALPHA_MAX * (1 - k)
            }

            if (d.life <= 0 || p.alpha <= 0) {
                this.particleContainer.removeParticle(p)
                this.pool.put(p)
                particles.splice(i, 1)
            }
        }

        if (particles.length === 0 && this.isTickerAdded) {
            tickerRemove(this)
            this.isTickerAdded = false
        }
    }

    kill() {
        tickerRemove(this)
        for (const p of this.active) this.pool.put(p)
        this.active.length = 0
        if (this.parent) this.parent.removeChild(this)
        super.destroy({ children: true })
    }
}