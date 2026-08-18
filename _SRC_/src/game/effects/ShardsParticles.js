import { Particle, ParticleContainer } from 'pixi.js'
import { tickerAdd, tickerRemove } from '../../app/application'
import { atlases } from '../../app/assets'

// ----------------------------------------------------------------------
// Настройки физики осколков (можно тюнить)
// ----------------------------------------------------------------------
const SHARDS_CONFIG = {
    GRAVITY: 0.0009,            // ускорение падения
    SPEED_MIN: 0.24,            // минимальная начальная скорость
    SPEED_MAX: 0.36,            // максимальная начальная скорость
    HORIZONTAL_SPREAD_FACTOR: 0.8,  // уменьшить боковой разлёт (1.0 = без изменений)
    HORIZONTAL_DECAY: 0.999,   // затухание горизонтальной скорости (1.0 = без затухания)
    VERTICAL_BOOST: 1.3,            // усилить взлёт вверх (1.0 = без изменений)
    ALPHA_DECAY: 0.00012,       // скорость угасания
    ROTATION_SPEED_MIN: -0.0012,// минимальная угловая скорость
    ROTATION_SPEED_MAX: 0.0012, // максимальная угловая скорость
    MAX_ALPHA: 1,
    SPAWN_OFFSET: 36,           // смещение точек старта от центра
}

const _2PI = Math.PI * 2

// ----------------------------------------------------------------------
// Вспомогательные функции получения текстур
// ----------------------------------------------------------------------
function getBigTexture(index, tinted) {
    const key = `shard_big_${index}${tinted ? '_tint' : ''}`
    return atlases.shards.textures[key]
}
function getMidTexture(index, tinted) {
    const key = `shard_mid_${index}${tinted ? '_tint' : ''}`
    return atlases.shards.textures[key]
}
function getSmallTexture(index, tinted) {
    const key = `shard_small_${index}${tinted ? '_tint' : ''}`
    return atlases.shards.textures[key]
}

// ----------------------------------------------------------------------
// Фабрика частицы (создаётся без привязки к конкретным параметрам эффекта)
// ----------------------------------------------------------------------
function createShard(texture, homePool) {
    const p = new Particle({
        texture,
        x: 0, y: 0,
        anchorX: 0.5, anchorY: 0.5,
        scaleX: 1, scaleY: 1,
        rotation: Math.random() * _2PI,
        alpha: SHARDS_CONFIG.MAX_ALPHA,
    })
    p.data = { homePool }
    return p
}

// ----------------------------------------------------------------------
// Менеджер осколков
// ----------------------------------------------------------------------
export default class ShardsParticles {
    constructor(width, height) {
        this.container = new ParticleContainer({
            dynamicProperties: {
                position: true,
                rotation: true,
                scale: false,
                alpha: true,
                color: true,
            }
        })

        // Шесть пулов: normalBig(0), normalMid(1), normalSmall(2), tintBig(3), tintMid(4), tintSmall(5)
        this.pools = [[], [], [], [], [], []]
        this.activeShards = []

        this.fillPool(0, 16, false, 'big')    // normalBig
        this.fillPool(1, 32, false, 'mid')    // normalMid
        this.fillPool(2, 64, false, 'small')  // normalSmall
        this.fillPool(3, 16, true, 'big')     // tintBig
        this.fillPool(4, 32, true, 'mid')     // tintMid
        this.fillPool(5, 64, true, 'small')   // tintSmall

        // Границы (обновятся через resize)
        this.minX = -1000
        this.maxX = 2000
        this.minY = -1000
        this.maxY = 2000

        this.resize(width, height)
    }

    fillPool(poolIndex, count, tinted, size) {
        const pool = this.pools[poolIndex]
        for (let i = 0; i < count; i++) {
            const imgIndex = (i % 4) + 1
            let texture
            if (size === 'big') texture = getBigTexture(imgIndex, tinted)
            else if (size === 'mid') texture = getMidTexture(imgIndex, tinted)
            else texture = getSmallTexture(imgIndex, tinted)
            pool.push(createShard(texture, pool))
        }
    }

    replenishPool(poolIndex, tinted, size) {
        const pool = this.pools[poolIndex]
        for (let imgIndex = 1; imgIndex <= 4; imgIndex++) {
            let texture
            if (size === 'big') texture = getBigTexture(imgIndex, tinted)
            else if (size === 'mid') texture = getMidTexture(imgIndex, tinted)
            else texture = getSmallTexture(imgIndex, tinted)
            pool.push(createShard(texture, pool))
        }
    }

    getFromPool(poolIndex, tinted, size) {
        if (this.pools[poolIndex].length === 0) {
            this.replenishPool(poolIndex, tinted, size)
        }
        return this.pools[poolIndex].pop()
    }

    /**
     * Основной метод: добавляет осколки в заданной точке.
     * @param {number} x центр эффекта
     * @param {number} y центр эффекта
     * @param {number|null} tint если null – normal текстуры, иначе tint-версии с заданным цветом
     * @param {number} startAlpha начальная прозрачность (по умолчанию 1)
     */
    addShards(x, y, tint = null, startAlpha = 1) {
        const tinted = tint !== null
        const bigPoolIdx = tinted ? 3 : 0
        const midPoolIdx = tinted ? 4 : 1
        const smallPoolIdx = tinted ? 5 : 2

        const spawnPoints = [
            { x: x - SHARDS_CONFIG.SPAWN_OFFSET, y },
            { x: x + SHARDS_CONFIG.SPAWN_OFFSET, y },
            { x: x, y },
        ]

        // 3 больших
        for (let i = 0; i < 2; i++) {
            const shard = this.getFromPool(bigPoolIdx, tinted, 'big')
            this.setupShard(shard, spawnPoints[i].x, spawnPoints[i].y, tint, startAlpha)
            this.activeShards.push(shard)
            this.container.addParticle(shard)
        }

        // 6 средних (по 2 на точку)
        for (let i = 0; i < 4; i++) {
            const pt = spawnPoints[i % 3]
            const shard = this.getFromPool(midPoolIdx, tinted, 'mid')
            this.setupShard(shard, pt.x, pt.y, tint, startAlpha)
            this.activeShards.push(shard)
            this.container.addParticle(shard)
        }

        // 9 мелких (по 3 на точку)
        for (let i = 0; i < 6; i++) {
            const pt = spawnPoints[i % 3]
            const shard = this.getFromPool(smallPoolIdx, tinted, 'small')
            this.setupShard(shard, pt.x, pt.y, tint, startAlpha)
            this.activeShards.push(shard)
            this.container.addParticle(shard)
        }

        if (this.activeShards.length) {
            tickerAdd(this)
        }
    }

    setupShard(shard, x, y, tint, startAlpha) {
        shard.x = x
        shard.y = y
        shard.alpha = Math.min(startAlpha, SHARDS_CONFIG.MAX_ALPHA)
        if (tint !== null) shard.tint = tint
        shard.rotation = Math.random() * _2PI
    
        const data = shard.data
        data.gravity = SHARDS_CONFIG.GRAVITY + Math.random() * 0.0003
        const angle = Math.random() * _2PI
        const totalSpeed = SHARDS_CONFIG.SPEED_MIN + Math.random() * (SHARDS_CONFIG.SPEED_MAX - SHARDS_CONFIG.SPEED_MIN)
        data.vx = Math.cos(angle) * totalSpeed
        data.vy = Math.sin(angle) * totalSpeed
        data.vx *= SHARDS_CONFIG.HORIZONTAL_SPREAD_FACTOR
        if (data.vy < 0) data.vy *= SHARDS_CONFIG.VERTICAL_BOOST
        data.alphaDecay = SHARDS_CONFIG.ALPHA_DECAY + Math.random() * 0.0001
        data.rotationSpeed = SHARDS_CONFIG.ROTATION_SPEED_MIN + Math.random() * (SHARDS_CONFIG.ROTATION_SPEED_MAX - SHARDS_CONFIG.ROTATION_SPEED_MIN)
    }

    resize(width, height) {
        this.minX = -width
        this.maxX = width * 2
        this.minY = -height
        this.maxY = height * 2
    }

    tick(deltaMs) {
        const shards = this.activeShards
        for (let i = shards.length - 1; i >= 0; i--) {
            const s = shards[i]
            const d = s.data

            s.x += d.vx * deltaMs
            s.y += d.vy * deltaMs
            d.vy += d.gravity * deltaMs
            // если нужно лёгкое горизонтальное замедление, можно добавить:
            d.vx *= Math.pow(SHARDS_CONFIG.HORIZONTAL_DECAY, deltaMs)
            s.alpha = Math.max(0, s.alpha - d.alphaDecay * deltaMs)
            s.rotation += d.rotationSpeed * deltaMs

            if (s.alpha <= 0 ||
                s.x < this.minX || s.x > this.maxX ||
                s.y < this.minY || s.y > this.maxY) {

                this.container.removeParticle(s)
                d.homePool.push(s)

                shards[i] = shards[shards.length - 1]
                shards.pop()
            }
        }

        if (shards.length === 0) {
            tickerRemove(this)
        }
    }

    kill() {
        tickerRemove(this)
        if (this.container) {
            this.container.destroy({ children: true })
            this.container = null
        }
        this.activeShards.length = 0
        for (const pool of this.pools) {
            pool.length = 0
        }
    }
}