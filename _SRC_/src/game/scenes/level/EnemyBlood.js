import { Particle, ParticleContainer } from 'pixi.js'
import { tickerAdd, tickerRemove } from '../../../app/application'
import { images } from '../../../app/assets'
import { EventHub, events } from '../../../app/events'
import { createParticlePool } from '../../../utils/pool'

const TAU = Math.PI * 2

// ================================================================
// ТИПЫ КРОВИ
// ================================================================
export const BLOOD_GREEN = 0
export const BLOOD_BLACK = 1

const GREEN_COLS = [0xaaff77, 0x66ff22, 0x00dd00, 0x0a8822, 0x04440a]
const BLACK_COLS = [0x666666, 0x444444, 0x222222, 0x111111, 0x050505]

// Индекс "тёмного" цвета для пятна (нижние 2 оттенка из палитры)
const DARK_IDX_MIN = 3
const DARK_IDX_MAX = 4

// ================================================================
// ПАРАМЕТРЫ
// ================================================================
const MAX_PARTICLES = 1500

const BLOOD_COUNT_MIN   = 6
const BLOOD_COUNT_MAX   = 120
const BLOOD_DAMAGE_RATE = 2
const KILL_RATE         = 9       // ×9 капель при убийстве

// Разлёт
const DIST_MIN  = 3
const DIST_MAX  = 72
const SPEED_MIN = 0.03
const SPEED_MAX = 0.18
const FLIGHT_MIN_MS = 180
const FLIGHT_MAX_MS = 720

// Форма капли В ПОЛЁТЕ
const SIZE_FLY_MIN = 0.06
const SIZE_FLY_MAX = 0.18
const FLY_ASPECT_MIN = 0.6      // scaleX / scaleY отношение, минимум
const FLY_ASPECT_MAX = 1.2      // максимум

// Форма ПЯТНА на земле
const STAIN_SCALE_MUL   = 1.5    // общий множитель относительно полёта
const STAIN_ASPECT_X_MIN = 1.0
const STAIN_ASPECT_X_MAX = 1.36  // пятно растянуто по X сильнее
const STAIN_ASPECT_Y_MIN = 0.72
const STAIN_ASPECT_Y_MAX = 1.0   // ...и сжато по Y

// Жизнь
const LIFE_MIN = 1200
const LIFE_MAX = 3000

// Alpha
const ALPHA_FADE_IN    = 0.03
const ALPHA_HOLD_FLY   = 0.72
const ALPHA_HOLD_STAIN = 0.48     // пятно заметно прозрачнее
const ALPHA_FADE_START = 0.60

const WARMUP_ALPHA = 0.01

const INV_FADE_IN  = 1 / ALPHA_FADE_IN
const INV_FADE_OUT = 1 / (1 - ALPHA_FADE_START)

// ================================================================
// Класс
// ================================================================
export default class EnemyBlood {
    constructor() {
        this.stainContainer = new ParticleContainer({
            dynamicProperties: { position: true, alpha: true, color: true },
        })
        this.stainContainer.eventMode = 'none'

        this.flyContainer = new ParticleContainer({
            dynamicProperties: { position: true, alpha: true, color: true },
        })
        this.flyContainer.eventMode = 'none'

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

        EventHub.on(events.enemyHit, this.onEnemyHit, this)
    }

    onEnemyHit(data) {
        this.emit(data.x, data.y, data.damage, data.bloodType, data.isKill)
    }

    warmup() {
        return new Promise((resolve) => {
            const prevStainAlpha = this.stainContainer.alpha
            const prevFlyAlpha   = this.flyContainer.alpha
            this.stainContainer.alpha = WARMUP_ALPHA
            this.flyContainer.alpha   = WARMUP_ALPHA

            const warmFly = this._fillContainer(this.flyContainer, MAX_PARTICLES)

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this._drainContainer(this.flyContainer, warmFly)

                    const warmStain = this._fillContainer(this.stainContainer, MAX_PARTICLES)

                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            this._drainContainer(this.stainContainer, warmStain)

                            this.stainContainer.alpha = prevStainAlpha
                            this.flyContainer.alpha   = prevFlyAlpha
                            resolve()
                        })
                    })
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

    emit(x, y, damage, bloodType, isKill) {
        let count = Math.ceil(damage / BLOOD_DAMAGE_RATE)
        if (isKill) count *= KILL_RATE
        if (count < BLOOD_COUNT_MIN) count = BLOOD_COUNT_MIN
        if (count > BLOOD_COUNT_MAX) count = BLOOD_COUNT_MAX

        const cols = bloodType === BLOOD_BLACK ? BLACK_COLS : GREEN_COLS
        const colsLen = cols.length

        for (let i = 0; i < count; i++) {
            const p = this.pool.get()
            if (!p) break

            // ---- рандомы + bias ----
            const angle = Math.random() * TAU

            const distR = Math.random()
            const dist  = DIST_MIN + (DIST_MAX - DIST_MIN) * distR * Math.sqrt(distR)

            const spdR  = Math.random()
            const speed = SPEED_MIN + (SPEED_MAX - SPEED_MIN) * spdR * Math.sqrt(spdR)

            // базовый размер + пропорция овала
            const baseSize = SIZE_FLY_MIN + (SIZE_FLY_MAX - SIZE_FLY_MIN) * Math.sqrt(Math.random())
            const aspect   = FLY_ASPECT_MIN + (FLY_ASPECT_MAX - FLY_ASPECT_MIN) * Math.random()
            const sizeX = baseSize * aspect
            const sizeY = baseSize / aspect

            const rotation = Math.random() * TAU

            const life      = LIFE_MIN  + Math.random() * (LIFE_MAX - LIFE_MIN)
            const colIdx    = (Math.random() * colsLen) | 0
            // пятно будет тёмнее — из "нижних" индексов палитры
            const colIdxStain = DARK_IDX_MIN + ((Math.random() * (DARK_IDX_MAX - DARK_IDX_MIN + 1)) | 0)

            const dirX = Math.cos(angle)
            const dirY = Math.sin(angle)

            const tx = x + dirX * dist
            const ty = y + dirY * dist

            let flightTime = dist / speed
            if (flightTime < FLIGHT_MIN_MS) flightTime = FLIGHT_MIN_MS
            else if (flightTime > FLIGHT_MAX_MS) flightTime = FLIGHT_MAX_MS

            // ---- инициализация капли: овал, свой угол, свой цвет ----
            p.x = x
            p.y = y
            p.scaleX = sizeX
            p.scaleY = sizeY
            p.rotation = rotation
            p.alpha = 0
            p.tint = cols[colIdx]

            // ---- state ----
            const d = p.data
            d.sx = x
            d.sy = y
            d.tx = tx
            d.ty = ty

            d.life    = life
            d.invLife = 1 / life

            d.flightTime = flightTime
            d.invFlight  = 1 / flightTime

            // Пятно — эллипс, случайный поворот, тёмный цвет
            const stainBaseX = baseSize * STAIN_SCALE_MUL * (STAIN_ASPECT_X_MIN + (STAIN_ASPECT_X_MAX - STAIN_ASPECT_X_MIN) * Math.random())
            const stainBaseY = baseSize * STAIN_SCALE_MUL * (STAIN_ASPECT_Y_MIN + (STAIN_ASPECT_Y_MAX - STAIN_ASPECT_Y_MIN) * Math.random())
            d.stainScaleX = stainBaseX
            d.stainScaleY = stainBaseY
            d.stainRotation = Math.random() * TAU
            d.stainTint = cols[colIdxStain]

            d.alphaHold = ALPHA_HOLD_FLY
            d.inFly = true

            this.flyContainer.addParticle(p)
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

            const elapsed = progress / d.invLife

            let flightP = elapsed * d.invFlight
            if (flightP > 1) flightP = 1
            else if (flightP < 0) flightP = 0

            // ease-out-cubic — плавный приезд к цели
            const invF = 1 - flightP
            const e = 1 - invF * invF * invF

            p.x = d.sx + (d.tx - d.sx) * e
            p.y = d.sy + (d.ty - d.sy) * e

            // ---- ПРИЗЕМЛЕНИЕ ----
            if (flightP >= 1 && d.inFly) {
                d.inFly = false

                // scale, rotation — не dynamic, задаём ОДИН раз перед addParticle
                p.scaleX = d.stainScaleX
                p.scaleY = d.stainScaleY
                p.rotation = d.stainRotation
                // tint — dynamic, можно менять в любой момент
                p.tint = d.stainTint

                d.alphaHold = ALPHA_HOLD_STAIN

                this.flyContainer.removeParticle(p)
                this.stainContainer.addParticle(p)
            }

            // ---- альфа ----
            if (progress < ALPHA_FADE_IN) {
                p.alpha = d.alphaHold * (progress * INV_FADE_IN)
            } else if (progress < ALPHA_FADE_START) {
                p.alpha = d.alphaHold
            } else {
                const k = (progress - ALPHA_FADE_START) * INV_FADE_OUT
                p.alpha = d.alphaHold * (1 - k)
            }

            if (d.life <= 0 || p.alpha <= 0) {
                if (d.inFly) this.flyContainer.removeParticle(p)
                else this.stainContainer.removeParticle(p)
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
        EventHub.off(events.enemyHit, this.onEnemyHit, this)

        for (const p of this.active) {
            if (p.data.inFly) this.flyContainer.removeParticle(p)
            else this.stainContainer.removeParticle(p)
            this.pool.put(p)
        }
        this.active.length = 0

        if (this.stainContainer) {
            if (this.stainContainer.parent) this.stainContainer.parent.removeChild(this.stainContainer)
            this.stainContainer.destroy({ children: true })
            this.stainContainer = null
        }
        if (this.flyContainer) {
            if (this.flyContainer.parent) this.flyContainer.parent.removeChild(this.flyContainer)
            this.flyContainer.destroy({ children: true })
            this.flyContainer = null
        }
    }
}