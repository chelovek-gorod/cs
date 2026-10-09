import { Particle, ParticleContainer, Container } from 'pixi.js'
import { getAppRenderer, tickerAdd, tickerRemove } from '../../../app/application'
import { images } from '../../../app/assets'
import { createParticlePool } from '../../../utils/pool'

const TAU = Math.PI * 2

// ================================================================
// SIN-LUT — турбулентность в тике без Math.sin
// ================================================================
const SIN_SIZE = 256
const SIN_MASK = SIN_SIZE - 1
const SIN_LUT = new Float32Array(SIN_SIZE)
for (let i = 0; i < SIN_SIZE; i++) SIN_LUT[i] = Math.sin((i / SIN_SIZE) * TAU)

// ================================================================
// RNG-LUT — все рандомы на спавн, ноль Math.random в тике
// ================================================================
const LUT_SIZE = 8192
const LUT_MASK = LUT_SIZE - 1

const LUT_SPAWN_COS  = new Float32Array(LUT_SIZE)
const LUT_SPAWN_SIN  = new Float32Array(LUT_SIZE)
const LUT_DISC_COS   = new Float32Array(LUT_SIZE)
const LUT_DISC_SIN   = new Float32Array(LUT_SIZE)
// Радиус в долях радиуса круга (0..1.1) по твоей схеме 40/30/20/10
const LUT_DISC_RAD   = new Float32Array(LUT_SIZE)
const LUT_LIFE_R     = new Float32Array(LUT_SIZE)
const LUT_IGNITE_R   = new Float32Array(LUT_SIZE)   // только для искр
const LUT_SCALE_R    = new Float32Array(LUT_SIZE)
const LUT_ALPHA_R    = new Float32Array(LUT_SIZE)   // мерцание ядра
const LUT_PHASE      = new Uint8Array(LUT_SIZE)
const LUT_PHASE_STEP = new Uint8Array(LUT_SIZE)

for (let i = 0; i < LUT_SIZE; i++) {
    const a1 = Math.random() * TAU
    LUT_SPAWN_COS[i] = Math.cos(a1)
    LUT_SPAWN_SIN[i] = Math.sin(a1)

    const a2 = Math.random() * TAU
    LUT_DISC_COS[i]  = Math.cos(a2)
    LUT_DISC_SIN[i]  = Math.sin(a2)

    // === Радиальное распределение: 40 / 30 / 20 / 10 ===
    const r = Math.random()
    let discR
    if (r < 0.40)       discR = Math.random() * 0.20                 // центр
    else if (r < 0.70)  discR = 0.20 + Math.random() * 0.30          // ядро
    else if (r < 0.90)  discR = 0.50 + Math.random() * 0.40          // тело
    else                discR = 0.90 + Math.random() * 0.20          // ореол
    LUT_DISC_RAD[i] = discR

    LUT_LIFE_R[i]     = Math.random()
    LUT_IGNITE_R[i]   = Math.random()
    LUT_SCALE_R[i]    = Math.random()
    LUT_ALPHA_R[i]    = Math.random()
    LUT_PHASE[i]      = (Math.random() * SIN_SIZE) | 0
    LUT_PHASE_STEP[i] = 1 + ((Math.random() * 5) | 0)
}

// ================================================================
// LUT джиттера эмиссии: 80% — ×1, 15% — ×1.5, 5% — ×0
// ================================================================
const EMIT_SIZE = 64
const EMIT_MASK = EMIT_SIZE - 1
const LUT_EMIT_MUL = new Float32Array(EMIT_SIZE)
for (let i = 0; i < EMIT_SIZE; i++) {
    const r = Math.random()
    LUT_EMIT_MUL[i] = r < 0.80 ? 1.0 : (r < 0.95 ? 1.5 : 0.0)
}

// ================================================================
// ОБЩИЕ
// ================================================================
const MAX_PARTICLES = 6000
const SPAWN_RADIUS  = 3
const ALPHA_KILL    = 0.01

// ================================================================
// ЯДРО (CORE) — плотная яркая спица
// ================================================================
const CORE_RATIO      = 0.30
const CORE_RADIAL_MUL = 0.85
const CORE_LIFE_MIN   = 350
const CORE_LIFE_MAX   = 700
const CORE_FADE_IN    = 0.06      // быстрый впых
const CORE_FADE_START = 0.65      // после этой доли жизни начинается спад
const CORE_FADE_POW   = 1.6       // выше = резче в конце
const CORE_ALPHA_MIN  = 0.70      // ← мерцание: разброс alphaTop
const CORE_ALPHA_MAX  = 1.00
const CORE_SCALE_MIN  = 0.09      // ← разброс размера внутри слоя
const CORE_SCALE_MAX  = 0.18
const CORE_TURB       = 2.5
const CORE_PHASE_MUL  = 1.0
const CORE_C0 = 0xffffff
const CORE_C1 = 0xffee99
const CORE_C2 = 0xffdd55
const CORE_C3 = 0xff9922
const CORE_C4 = 0xff4400
const CORE_C5 = 0x661100

// ================================================================
// ТЕЛО (GLOW) — мягкое облако пламени
// ================================================================
const GLOW_RATIO      = 0.24
const GLOW_RADIAL_MUL = 1.00
const GLOW_LIFE_MIN   = 500
const GLOW_LIFE_MAX   = 1200
const GLOW_FADE_IN    = 0.08
const GLOW_FADE_START = 0.72
const GLOW_FADE_POW   = 1.8
const GLOW_ALPHA_MIN  = 0.40
const GLOW_ALPHA_MAX  = 0.60
const GLOW_SCALE_MIN  = 0.18
const GLOW_SCALE_MAX  = 0.42
const GLOW_TURB       = 4.5
const GLOW_PHASE_MUL  = 1.0
const GLOW_C0 = 0xffcc55
const GLOW_C1 = 0xff9933
const GLOW_C2 = 0xff6611
const GLOW_C3 = 0xcc3300
const GLOW_C4 = 0x882200
const GLOW_C5 = 0x331100

// ================================================================
// ИСКРЫ (SPARK) — СВЕТЛЯЧКИ: резкий блинк, сильный хаос, жизнь в 5× разбросе
// ================================================================
const SPARK_RATIO      = 0.32
const SPARK_RADIAL_MUL = 1.10    // чуть за границу круга
const SPARK_LIFE_MIN   = 150     // ← короткие
const SPARK_LIFE_MAX   = 750     // ← 5× разброс
const SPARK_FADE_IN    = 0.03    // ← резкий fade-in (блинк)
const SPARK_FADE_START = 0.55    // ← обрыв раньше, чем у остальных
const SPARK_FADE_POW   = 2.2     // ← резкий fade-out
const SPARK_ALPHA_MIN  = 0.80
const SPARK_ALPHA_MAX  = 1.00
const SPARK_SCALE_MIN  = 0.05    // ← совсем мелкие
const SPARK_SCALE_MAX  = 0.10
const SPARK_TURB       = 22.0    // ← огромная турбулентность
const SPARK_PHASE_MUL  = 2.5     // ← быстрее «пляшут» по фазе
const SPARK_IGNITE_MIN = 0.08
const SPARK_IGNITE_MAX = 0.70
const SPARK_C0 = 0xffffff
const SPARK_C1 = 0xffee77
const SPARK_C2 = 0xffaa33
const SPARK_C3 = 0xff5511
const SPARK_C4 = 0xaa2200
const SPARK_C5 = 0x441100

// ================================================================
// ДЫМ (SMOKE) — большие тусклые облака
// ================================================================
const SMOKE_RATIO      = 0.14
const SMOKE_RADIAL_MUL = 1.00
const SMOKE_LIFE_MIN   = 1200
const SMOKE_LIFE_MAX   = 2400
const SMOKE_FADE_IN    = 0.18    // ← плавное появление
const SMOKE_FADE_START = 0.80
const SMOKE_FADE_POW   = 1.2
const SMOKE_ALPHA_MIN  = 0.20
const SMOKE_ALPHA_MAX  = 0.38
const SMOKE_SCALE_MIN  = 0.65
const SMOKE_SCALE_MAX  = 1.20
const SMOKE_TURB       = 5.0
const SMOKE_PHASE_MUL  = 1.0
const SMOKE_C0 = 0x777777
const SMOKE_C1 = 0x5a5a5a
const SMOKE_C2 = 0x3a3a3a
const SMOKE_C3 = 0x222222
const SMOKE_C4 = 0x111111
const SMOKE_C5 = 0x000000

// ================================================================
// Класс
// ================================================================
export default class DragonFire extends Container {
    constructor() {
        super()

        this.smokeContainer = new ParticleContainer({
            dynamicProperties: { position: true, alpha: true, color: true },
        })
        this.smokeContainer.eventMode = 'none'
        this.addChild(this.smokeContainer)

        this.fireContainer = new ParticleContainer({
            dynamicProperties: { position: true, alpha: true, color: true },
        })
        this.fireContainer.eventMode = 'none'
        this.fireContainer.blendMode = 'add'
        this.addChild(this.fireContainer)

        this.particlePool = createParticlePool(MAX_PARTICLES)
        this.active = []
        this.isTickerAdded = false
        this.lutIdx = 0
        this.emitIdx = 0

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
            this.particlePool.add(p)
            this.particlePool.put(p)
        }
    }

    warmup(container) {
        return new Promise((resolve) => {
            if (!container) {
                console.warn('DragonFire.warmup: container required')
                resolve()
                return
            }
    
            const wasAdded = !!this.parent
            if (!wasAdded) container.addChild(this)

            const prevAlpha = this.alpha
            this.alpha = 0.01
    
            // Заполняем ОБА контейнера до MAX — они независимы
            const smokeFrac = SMOKE_RATIO
            const fireFrac  = CORE_RATIO + GLOW_RATIO + SPARK_RATIO
            const totalFrac = fireFrac + smokeFrac

            const fireMax  = Math.floor(MAX_PARTICLES * fireFrac / totalFrac)
            const smokeMax = MAX_PARTICLES - fireMax

            const warmFire  = this._fillContainer(this.fireContainer,  fireMax)
            const warmSmoke = this._fillContainer(this.smokeContainer, smokeMax)
    
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this._drainContainer(this.fireContainer,  warmFire)
                    this._drainContainer(this.smokeContainer, warmSmoke)
    
                    if (!wasAdded) container.removeChild(this)
                    this.alpha = prevAlpha
                    resolve()
                })
            })
        })
    }
    
    _fillContainer(particleContainer, count) {
        const list = []
        for (let i = 0; i < count; i++) {
            const p = this.particlePool.get()
            if (!p) break   // пул пуст — не создаём новые, MAX уже покрыт пулом
            p.x = 0
            p.y = 0
            p.alpha = 1
            p.scaleX = 0.1
            p.scaleY = 0.1
            particleContainer.addParticle(p)
            list.push(p)
        }
        return list
    }
    
    _drainContainer(particleContainer, list) {
        for (let i = 0; i < list.length; i++) {
            particleContainer.removeParticle(list[i])
            this.particlePool.put(list[i])
        }
    }

    /**
     * @param {number} apexX
     * @param {number} apexY
     * @param {number} centerX
     * @param {number} centerY
     * @param {number} radius
     * @param {number} count
     */
    emit(apexX, apexY, centerX, centerY, radius, count) {
        if (!count || !radius) return

        // ---- ДЖИТТЕР ЭМИССИИ: 80% норма, 15% ×1.5, 5% пропуск ----
        const jitterMul = LUT_EMIT_MUL[this.emitIdx & EMIT_MASK]
        this.emitIdx++
        if (jitterMul === 0) return
        count = Math.round(count * jitterMul)

        const coreN  = Math.round(count * CORE_RATIO)
        const glowN  = Math.round(count * GLOW_RATIO)
        const sparkN = Math.round(count * SPARK_RATIO)
        const smokeN = count - coreN - glowN - sparkN

        let lutIdx = this.lutIdx & LUT_MASK

        const spawnOne = (kind) => {
            let p = this.particlePool.get()
            if (!p) {
                p = new Particle({
                    texture: images.particle,
                    x: 0, y: 0,
                    anchorX: 0.5, anchorY: 0.5,
                    scaleX: 1, scaleY: 1,
                    rotation: 0,
                    alpha: 1,
                })
                p.data = {}
                this.particlePool.add(p)
            }

            // ---- параметры слоя ----
            let lifeMin, lifeMax
            let fadeIn, fadeStart, fadePow
            let alphaMin, alphaMax
            let scaleMin, scaleMax
            let turb, phaseMul, radialMul
            let igniteMin = 0, igniteMax = 0
            let c0, c1, c2, c3, c4, c5
            let isSmoke = false, isSpark = false

            if (kind === 0) {
                lifeMin = CORE_LIFE_MIN;  lifeMax = CORE_LIFE_MAX
                fadeIn = CORE_FADE_IN; fadeStart = CORE_FADE_START; fadePow = CORE_FADE_POW
                alphaMin = CORE_ALPHA_MIN; alphaMax = CORE_ALPHA_MAX
                scaleMin = CORE_SCALE_MIN; scaleMax = CORE_SCALE_MAX
                turb = CORE_TURB; phaseMul = CORE_PHASE_MUL; radialMul = CORE_RADIAL_MUL
                c0=CORE_C0; c1=CORE_C1; c2=CORE_C2; c3=CORE_C3; c4=CORE_C4; c5=CORE_C5
            } else if (kind === 1) {
                lifeMin = GLOW_LIFE_MIN;  lifeMax = GLOW_LIFE_MAX
                fadeIn = GLOW_FADE_IN; fadeStart = GLOW_FADE_START; fadePow = GLOW_FADE_POW
                alphaMin = GLOW_ALPHA_MIN; alphaMax = GLOW_ALPHA_MAX
                scaleMin = GLOW_SCALE_MIN; scaleMax = GLOW_SCALE_MAX
                turb = GLOW_TURB; phaseMul = GLOW_PHASE_MUL; radialMul = GLOW_RADIAL_MUL
                c0=GLOW_C0; c1=GLOW_C1; c2=GLOW_C2; c3=GLOW_C3; c4=GLOW_C4; c5=GLOW_C5
            } else if (kind === 2) {
                lifeMin = SPARK_LIFE_MIN;  lifeMax = SPARK_LIFE_MAX
                fadeIn = SPARK_FADE_IN; fadeStart = SPARK_FADE_START; fadePow = SPARK_FADE_POW
                alphaMin = SPARK_ALPHA_MIN; alphaMax = SPARK_ALPHA_MAX
                scaleMin = SPARK_SCALE_MIN; scaleMax = SPARK_SCALE_MAX
                turb = SPARK_TURB; phaseMul = SPARK_PHASE_MUL; radialMul = SPARK_RADIAL_MUL
                igniteMin = SPARK_IGNITE_MIN; igniteMax = SPARK_IGNITE_MAX
                c0=SPARK_C0; c1=SPARK_C1; c2=SPARK_C2; c3=SPARK_C3; c4=SPARK_C4; c5=SPARK_C5
                isSpark = true
            } else {
                lifeMin = SMOKE_LIFE_MIN;  lifeMax = SMOKE_LIFE_MAX
                fadeIn = SMOKE_FADE_IN; fadeStart = SMOKE_FADE_START; fadePow = SMOKE_FADE_POW
                alphaMin = SMOKE_ALPHA_MIN; alphaMax = SMOKE_ALPHA_MAX
                scaleMin = SMOKE_SCALE_MIN; scaleMax = SMOKE_SCALE_MAX
                turb = SMOKE_TURB; phaseMul = SMOKE_PHASE_MUL; radialMul = SMOKE_RADIAL_MUL
                c0=SMOKE_C0; c1=SMOKE_C1; c2=SMOKE_C2; c3=SMOKE_C3; c4=SMOKE_C4; c5=SMOKE_C5
                isSmoke = true
            }

            // ---- цель: точка в круге с радиальным распределением ----
            const discR = LUT_DISC_RAD[lutIdx] * radius * radialMul
            const tx = centerX + LUT_DISC_COS[lutIdx] * discR
            const ty = centerY + LUT_DISC_SIN[lutIdx] * discR

            // ---- старт ----
            let sx, sy
            if (isSpark) {
                // искра появляется на пути — на доле ignite
                const ig = igniteMin + (igniteMax - igniteMin) * LUT_IGNITE_R[lutIdx]
                sx = apexX + (tx - apexX) * ig
                sy = apexY + (ty - apexY) * ig
            } else {
                // обычная частица: строго из вершины с микро-джиттером
                const jr = LUT_DISC_RAD[lutIdx] * SPAWN_RADIUS
                sx = apexX + LUT_SPAWN_COS[lutIdx] * jr
                sy = apexY + LUT_SPAWN_SIN[lutIdx] * jr
            }

            // ---- нормаль к пути (перпендикуляр для турбулентности) ----
            const dx = tx - sx
            const dy = ty - sy
            const invLen = 1 / (Math.sqrt(dx * dx + dy * dy) || 1)
            const nx = -dy * invLen
            const ny =  dx * invLen

            // ---- размер ----
            const scale = scaleMin + (scaleMax - scaleMin) * LUT_SCALE_R[lutIdx]

            // ---- alphaTop: мерцание ----
            const alphaTop = alphaMin + (alphaMax - alphaMin) * LUT_ALPHA_R[lutIdx]

            // ---- жизнь ----
            const life = lifeMin + (lifeMax - lifeMin) * LUT_LIFE_R[lutIdx]

            // ---- инициализация (scale задаётся ОДИН раз) ----
            p.x = sx
            p.y = sy
            p.scaleX = scale
            p.scaleY = scale
            p.rotation = 0
            p.alpha = alphaTop * (fadeIn > 0 ? 0 : 1)   // если fade-in, старт с нуля
            p.tint = c0

            // ---- per-particle state ----
            const d = p.data
            d.sx = sx; d.sy = sy
            d.tx = tx; d.ty = ty
            d.nx = nx; d.ny = ny

            d.life     = life
            d.invLife  = 1 / life

            d.fadeIn    = fadeIn
            d.invFadeIn = fadeIn > 0 ? 1 / fadeIn : 0
            d.fadeStart = fadeStart
            d.invFadeOut = 1 / (1 - fadeStart)
            d.fadePow   = fadePow
            d.alphaTop  = alphaTop

            d.turb      = turb
            d.phaseIdx  = LUT_PHASE[lutIdx]
            d.phaseStep = LUT_PHASE_STEP[lutIdx] * phaseMul

            d.c0=c0; d.c1=c1; d.c2=c2; d.c3=c3; d.c4=c4; d.c5=c5
            d.isSmoke = isSmoke

            if (isSmoke) this.smokeContainer.addParticle(p)
            else this.fireContainer.addParticle(p)
            this.active.push(p)

            lutIdx = (lutIdx + 1) & LUT_MASK
        }

        for (let i = 0; i < coreN;  i++) spawnOne(0)
        for (let i = 0; i < glowN;  i++) spawnOne(1)
        for (let i = 0; i < sparkN; i++) spawnOne(2)
        for (let i = 0; i < smokeN; i++) spawnOne(3)

        this.lutIdx = lutIdx

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

            // ---- прогресс 0..1 ----
            d.life -= dt
            let progress = 1 - d.life * d.invLife
            if (progress < 0) progress = 0
            else if (progress > 1) progress = 1

            // ---- ease-out-cubic к цели ----
            const inv = 1 - progress
            const e = 1 - inv * inv * inv

            const bx = d.sx + (d.tx - d.sx) * e
            const by = d.sy + (d.ty - d.sy) * e

            // ---- турбулентность поперёк пути ----
            d.phaseIdx = (d.phaseIdx + d.phaseStep) & SIN_MASK
            const env = 4 * progress * inv
            const wob = SIN_LUT[d.phaseIdx] * d.turb * env

            p.x = bx + d.nx * wob
            p.y = by + d.ny * wob

            // ---- цвет: 6 ступеней ----
            if (progress < 0.10)      p.tint = d.c0
            else if (progress < 0.30) p.tint = d.c1
            else if (progress < 0.50) p.tint = d.c2
            else if (progress < 0.70) p.tint = d.c3
            else if (progress < 0.85) p.tint = d.c4
            else                      p.tint = d.c5

            // ---- alpha: fade-in → hold → нелинейный fade-out ----
            if (progress < d.fadeIn) {
                p.alpha = d.alphaTop * progress * d.invFadeIn
            } else if (progress < d.fadeStart) {
                p.alpha = d.alphaTop
            } else {
                const k = (progress - d.fadeStart) * d.invFadeOut
                const kPow = Math.pow(1 - k, d.fadePow)
                p.alpha = d.alphaTop * kPow
            }

            if (d.life <= 0 || p.alpha <= ALPHA_KILL) {
                if (d.isSmoke) this.smokeContainer.removeParticle(p)
                else this.fireContainer.removeParticle(p)
                this.particlePool.put(p)
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
        for (const p of this.active) this.particlePool.put(p)
        this.active.length = 0
        if (this.parent) this.parent.removeChild(this)
        super.destroy({ children: true })
    }
}