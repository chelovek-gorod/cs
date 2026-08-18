import { Particle, ParticleContainer, Container } from 'pixi.js'
import { tickerAdd, tickerRemove } from '../../app/application'
import { images } from '../../app/assets'
import { _2PI } from './constants'


// ----------------------------------------------------------------------
// Настройки хвоста (меняй только здесь, чтобы подобрать визуал)
// ----------------------------------------------------------------------
const TRAIL_CONFIG = {
    // ---------- Внешний вид частиц ----------
    GLOW_SCALE: 0.36,            // фиксированный размер свечения (множитель текстуры)
    CORE_SCALE: 0.24,             // фиксированный размер ядра

    // ---------- Яркость и угасание ----------
    GLOW_ALPHA_START: 0.65,       // начальная яркость свечения (0..1)
    GLOW_ALPHA_DECAY: 0.0012,    // скорость угасания свечения (альфа/мс)
    CORE_ALPHA_START: 0.75,       // начальная яркость ядра
    CORE_ALPHA_DECAY: 0.0018,    // скорость угасания ядра

    // ---------- Движение (основная струя) ----------
    BACKWARD_SPEED: 0.12,        // базовая скорость назад (пикселей/мс)
    SPEED_VARIANCE: 0.06,        // случайный разброс скорости
    CENTER_ATTRACTION: 0.0012,      // сила притяжения к центральной линии (0 = нет, 1 = сильное)
    SPEED_DECAY: 0.999,           // общее замедление скорости (умножается через Math.pow на deltaMs)

    // ---------- Хаотичные искры ----------
    CHAOS_RATE: 0.06,            // вероятность (0..1), что частица будет хаотичной (0.33 ≈ каждая третья)
    CHAOS_SPEED_MIN: 0.12,        // минимальная скорость хаотичной частицы
    CHAOS_SPEED_MAX: 0.36,        // максимальная скорость хаотичной частицы

    // ---------- Область рождения частиц ----------
    SPAWN_RADIUS: 24,            // радиус круга вокруг центра мяча, где появляются частицы
}

// ----------------------------------------------------------------------
// Фабрика частицы
// ----------------------------------------------------------------------
function createParticle(texture) {
    const p = new Particle({
        texture,
        x: 0, y: 0,
        anchorX: 0.5, anchorY: 0.5,
        scaleX: 1, scaleY: 1,   // масштаб зададим в emit
        rotation: 0,
        alpha: 1,
    })
    p.data = {}   // сюда будем класть vx, vy, и т.д.
    return p
}

// ----------------------------------------------------------------------
// Менеджер частиц хвоста
// ----------------------------------------------------------------------
export default class TrailParticles {
    constructor(width, height) {
        // Общий контейнер, который можно добавить в сцену
        this.container = new Container()

        // Слой свечений (нижний, рисуется additive)
        this.glowContainer = new ParticleContainer({
            dynamicProperties: {
                position: true,
                scale: false,     // масштаб не меняется динамически
                alpha: true,
                color: true,
            },
            blendMode: 'add',
        })

        // Слой ядер (верхний, обычный blend)
        this.coreContainer = new ParticleContainer({
            dynamicProperties: {
                position: true,
                scale: false,
                alpha: true,
                color: true,
            },
        })

        this.container.addChild(this.glowContainer)
        this.container.addChild(this.coreContainer)

        // Пулы
        this.glowPool = []
        this.corePool = []
        this.activeGlow = []
        this.activeCore = []

        // Стартовое наполнение (по 200 частиц)
        for (let i = 0; i < 200; i++) {
            this.glowPool.push(createParticle(images.particle))
            this.corePool.push(createParticle(images.particle))
        }

        // Границы удаления (обновляются в resize)
        this.minX = -1000
        this.maxX = 2000
        this.minY = -1000
        this.maxY = 2000
        this.resize(width, height)

        this.isTickerAdded = false
    }

    /**
     * Достаёт одну частицу из пула. Если пул пуст – пополняет на 10 штук.
     */
    getFromPool(pool) {
        if (pool.length === 0) {
            for (let i = 0; i < 10; i++) {
                pool.push(createParticle(images.particle))
            }
        }
        return pool.pop()
    }

    /**
     * Вызывается каждый кадр из мяча.
     * @param {number} x  - позиция мяча
     * @param {number} y
     * @param {number} dx - направление мяча (единичный вектор)
     * @param {number} dy
     * @param {number} tintIn - цвет
     * @param {number} tintOut - цвет свечения
     * @param {number} count - сколько искр создать в этом кадре
     */
    emit(x, y, dx, dy, tintIn, tintOut, count) {
        // Направление «назад» (против движения мяча)
        const baseAngle = Math.atan2(-dy, -dx)

        // Перпендикулярный вектор к направлению мяча (для расчёта притяжения)
        const perpX = -dy
        const perpY = dx

        for (let i = 0; i < count; i++) {
            // 1. Случайная точка рождения внутри окружности мяча
            const angleOffset = Math.random() * _2PI
            const dist = Math.random() * TRAIL_CONFIG.SPAWN_RADIUS
            const spawnX = x + Math.cos(angleOffset) * dist
            const spawnY = y + Math.sin(angleOffset) * dist

            // 2. Определим, будет ли эта частица хаотичной
            const isChaos = Math.random() < TRAIL_CONFIG.CHAOS_RATE

            let vx, vy

            if (isChaos) {
                // Хаотичная частица: летит в случайном направлении в задней полусфере
                const chaosAngle = baseAngle + (Math.random() - 0.5) * Math.PI // от -90° до +90° от baseAngle
                const chaosSpeed = TRAIL_CONFIG.CHAOS_SPEED_MIN + Math.random() * (TRAIL_CONFIG.CHAOS_SPEED_MAX - TRAIL_CONFIG.CHAOS_SPEED_MIN)
                vx = Math.cos(chaosAngle) * chaosSpeed
                vy = Math.sin(chaosAngle) * chaosSpeed
            } else {
                // Обычная частица: движение назад + притяжение к центральной оси

                // Базовая скорость назад
                const speed = TRAIL_CONFIG.BACKWARD_SPEED + Math.random() * TRAIL_CONFIG.SPEED_VARIANCE
                vx = Math.cos(baseAngle) * speed
                vy = Math.sin(baseAngle) * speed

                // Притяжение к оси: чем дальше от центра, тем сильнее
                // Вычисляем смещение точки рождения от центра мяча вдоль перпендикуляра
                const offsetX = spawnX - x
                const offsetY = spawnY - y
                const perpDist = offsetX * perpX + offsetY * perpY // скалярное произведение (положительное или отрицательное)

                // Добавляем скорость, направленную к оси (противоположную perpDist)
                const attractionStrength = perpDist * TRAIL_CONFIG.CENTER_ATTRACTION
                vx -= perpX * attractionStrength
                vy -= perpY * attractionStrength
            }

            // --- Свечение ---
            const glow = this.getFromPool(this.glowPool)
            glow.x = spawnX
            glow.y = spawnY
            glow.scaleX = TRAIL_CONFIG.GLOW_SCALE
            glow.scaleY = TRAIL_CONFIG.GLOW_SCALE
            glow.alpha = TRAIL_CONFIG.GLOW_ALPHA_START
            glow.tint = tintOut
            glow.data.vx = vx
            glow.data.vy = vy

            // --- Ядро ---
            const core = this.getFromPool(this.corePool)
            core.x = spawnX
            core.y = spawnY
            core.scaleX = TRAIL_CONFIG.CORE_SCALE
            core.scaleY = TRAIL_CONFIG.CORE_SCALE
            core.alpha = TRAIL_CONFIG.CORE_ALPHA_START
            core.tint = tintIn
            core.data.vx = vx
            core.data.vy = vy

            this.activeGlow.push(glow)
            this.activeCore.push(core)
            this.glowContainer.addParticle(glow)
            this.coreContainer.addParticle(core)
        }

        if (!this.isTickerAdded) {
            tickerAdd(this)
            this.isTickerAdded = true
        }
    }

    resize(width, height) {
        this.minX = -width
        this.maxX = width * 2
        this.minY = -height
        this.maxY = height * 2
    }

    tick(deltaMs) {
        const glowArr = this.activeGlow
        const coreArr = this.activeCore

        for (let i = glowArr.length - 1; i >= 0; i--) {
            const g = glowArr[i]
            const c = coreArr[i]

            // Движение (одинаковое для свечения и ядра)
            g.x += g.data.vx * deltaMs
            g.y += g.data.vy * deltaMs
            c.x += c.data.vx * deltaMs
            c.y += c.data.vy * deltaMs

            // Замедление скорости (стабильно независимо от частоты кадров)
            const decay = Math.pow(TRAIL_CONFIG.SPEED_DECAY, deltaMs)
            g.data.vx *= decay
            g.data.vy *= decay
            c.data.vx *= decay
            c.data.vy *= decay

            // Угасание альфы
            g.alpha = Math.max(0, g.alpha - TRAIL_CONFIG.GLOW_ALPHA_DECAY * deltaMs)
            c.alpha = Math.max(0, c.alpha - TRAIL_CONFIG.CORE_ALPHA_DECAY * deltaMs)

            // Удаление, если альфа кончилась или вышли за экран
            if (g.alpha <= 0 ||
                g.x < this.minX || g.x > this.maxX ||
                g.y < this.minY || g.y > this.maxY) {

                this.glowContainer.removeParticle(g)
                this.coreContainer.removeParticle(c)
                this.glowPool.push(g)
                this.corePool.push(c)

                // Удаляем из активных массивов (без swap, чтобы не сломать синхронность)
                glowArr.splice(i, 1)
                coreArr.splice(i, 1)
            }
        }

        if (glowArr.length === 0 && this.isTickerAdded) {
            tickerRemove(this)
            this.isTickerAdded = false
        }
    }

    kill() {
        tickerRemove(this)
        if (this.container) {
            this.container.destroy({ children: true })
            this.container = null
        }
        this.activeGlow.length = 0
        this.activeCore.length = 0
        this.glowPool.length = 0
        this.corePool.length = 0
        this.isTickerAdded = false
    }
}