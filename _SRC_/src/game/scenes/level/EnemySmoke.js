import { Particle, ParticleContainer, Container } from 'pixi.js'
import { tickerAdd, tickerRemove } from '../../../app/application'
import { images } from '../../../app/assets'
import { createParticlePool } from '../../../utils/pool'

const TAU = Math.PI * 2

// ================================================================
// ДЕФОЛТЫ
// ================================================================
const DEFAULT_COUNT     = 6
const DEFAULT_SPREAD    = 20
const DEFAULT_LIFE_MIN  = 600
const DEFAULT_LIFE_MAX  = 1400
const DEFAULT_SIZE_MIN  = 0.15
const DEFAULT_SIZE_MAX  = 0.35
const DEFAULT_DRIFT_MIN = 0.010
const DEFAULT_DRIFT_MAX = 0.040
const DEFAULT_TINT      = 0x666666
const DEFAULT_ALPHA     = 0.65

const MAX_PARTICLES = 800
const WARMUP_ALPHA  = 0.01

// Дрейф: вверх + лёгкий разброс в стороны
// -PI/2 = строго вверх по экрану (Y вверх отрицательный)
const DRIFT_BASE_ANGLE = -Math.PI * 0.5
const DRIFT_JITTER     = Math.PI * 0.4   // ±72° в стороны

// Alpha-профиль
const FADE_IN     = 0.20
const FADE_START  = 0.55
const INV_FADE_IN  = 1 / FADE_IN
const INV_FADE_OUT = 1 / (1 - FADE_START)

// ================================================================
// Класс
// ================================================================
export default class EnemySmoke extends Container {
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

        // Наполняем пул: add + put, чтобы частицы попали в free
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

    /**
     * @param {number} x
     * @param {number} y
     * @param {Object} [options]
     * @param {number} [options.count]     - сколько частиц за спавн
     * @param {number} [options.spread]    - радиус разброса точки рождения
     * @param {number} [options.lifeMin]
     * @param {number} [options.lifeMax]
     * @param {number} [options.sizeMin]
     * @param {number} [options.sizeMax]
     * @param {number} [options.driftMin]  - минимальная скорость дрейфа
     * @param {number} [options.driftMax]
     * @param {number} [options.tint]      - цвет дыма
     * @param {number} [options.alpha]     - максимальная прозрачность (0..1)
     */
    spawn(x, y, options) {
        const count    = options?.count    ?? DEFAULT_COUNT
        const spread   = options?.spread   ?? DEFAULT_SPREAD
        const lifeMin  = options?.lifeMin  ?? DEFAULT_LIFE_MIN
        const lifeMax  = options?.lifeMax  ?? DEFAULT_LIFE_MAX
        const sizeMin  = options?.sizeMin  ?? DEFAULT_SIZE_MIN
        const sizeMax  = options?.sizeMax  ?? DEFAULT_SIZE_MAX
        const driftMin = options?.driftMin ?? DEFAULT_DRIFT_MIN
        const driftMax = options?.driftMax ?? DEFAULT_DRIFT_MAX
        const tint     = options?.tint     ?? DEFAULT_TINT
        const alphaTop = options?.alpha    ?? DEFAULT_ALPHA

        for (let i = 0; i < count; i++) {
            const p = this.pool.get()
            if (!p) break

            // Точка рождения — равномерно в круге радиуса spread
            const spawnAngle  = Math.random() * TAU
            const spawnRadius = Math.random() * spread
            const px = x + Math.cos(spawnAngle) * spawnRadius
            const py = y + Math.sin(spawnAngle) * spawnRadius

            // Дрейф: вверх + вбок, bias к верхнему движению
            const driftAngle = DRIFT_BASE_ANGLE + (Math.random() - 0.5) * DRIFT_JITTER
            const driftSpeed = driftMin + Math.random() * (driftMax - driftMin)
            const vx = Math.cos(driftAngle) * driftSpeed
            const vy = Math.sin(driftAngle) * driftSpeed

            const size = sizeMin + Math.random() * (sizeMax - sizeMin)
            const life = lifeMin + Math.random() * (lifeMax - lifeMin)

            // scale и tint — один раз, в тике не трогаем
            p.x = px
            p.y = py
            p.scaleX = size
            p.scaleY = size
            p.rotation = 0
            p.alpha = 0
            p.tint = tint

            const d = p.data
            d.vx = vx
            d.vy = vy
            d.life = life
            d.invLife = 1 / life
            d.alphaTop = alphaTop

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

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i]
            const d = p.data

            d.life -= dt
            let progress = 1 - d.life * d.invLife
            if (progress < 0) progress = 0
            else if (progress > 1) progress = 1

            // движение: линейный дрейф
            p.x += d.vx * dt
            p.y += d.vy * dt

            // alpha: fade-in → hold → fade-out
            if (progress < FADE_IN) {
                p.alpha = d.alphaTop * (progress * INV_FADE_IN)
            } else if (progress < FADE_START) {
                p.alpha = d.alphaTop
            } else {
                const k = (progress - FADE_START) * INV_FADE_OUT
                p.alpha = d.alphaTop * (1 - k)
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