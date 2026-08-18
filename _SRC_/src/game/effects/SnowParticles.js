import { Particle, ParticleContainer } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../app/application";
import { atlases } from "../../app/assets";
import { NOISE_BUFFER, NOISE_BUFFER_SIZE, NOISE_MASK, _2PI } from "./constants";
import { createEnum } from "../../utils/functions";
import { timeScale } from "../state";

// Таблица синусов для ветра (1024 точки)
const SINE_TABLE_SIZE = 1024
const SINE_TABLE = new Float32Array(SINE_TABLE_SIZE)
for (let i = 0; i < SINE_TABLE_SIZE; i++) {
    SINE_TABLE[i] = Math.sin((i / SINE_TABLE_SIZE) * _2PI)
}

// Типы снежинок (размер, скорость, амплитуда)
const SNOW_TYPES = {
    LARGE: {
        scaleMin: 0.65, scaleMax: 1.15,
        speedMult: 1.25,          // быстрее уносится влево
        fallMin: 0.055, fallMax: 0.095,
        alphaMin: 0.85, alphaMax: 1.0,
        driftAmp: 0.11,
        ratio: 0.2
    },
    MEDIUM: {
        scaleMin: 0.35, scaleMax: 0.65,
        speedMult: 0.7,
        fallMin: 0.035, fallMax: 0.065,
        alphaMin: 0.6, alphaMax: 0.9,
        driftAmp: 0.07,
        ratio: 0.3
    },
    SMALL: {
        scaleMin: 0.15, scaleMax: 0.35,
        speedMult: 0.3,
        fallMin: 0.02, fallMax: 0.04,
        alphaMin: 0.35, alphaMax: 0.65,
        driftAmp: 0.04,
        ratio: 0.5
    }
}

const WIND_BASE_FREQ = 0.0018
const WIND_FREQ_VAR = 0.0012
const ROTATION_SPEED_MIN = -0.001
const ROTATION_SPEED_MAX = 0.001
const NOISE_STEP = 2
const JITTER_STRENGTH = 0.03
const COUNT_PER_PX = 0.00012      // плотность частиц (на пиксель площади)
const TINTS = [0xffffff, 0xf5f9ff, 0xe8f0f8, 0xdce6f2]

const RESPAWN_SIDE = createEnum(['TOP', 'RIGHT'])

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

export default class SnowParticles {
    constructor(scrollSpeed) {
        this.scrollSpeed = scrollSpeed;
        this.container = new ParticleContainer({
            dynamicProperties: {
                position: true,
                rotation: true,
                scale: false,
                alpha: true,
                color: true
            }
        })

        this.pools = { LARGE: [], MEDIUM: [], SMALL: [] }
        this.flakes = []
        this.typeCounts = { LARGE: 0, MEDIUM: 0, SMALL: 0 }
        this.typeLimits = { LARGE: 0, MEDIUM: 0, SMALL: 0 }

        this.minX = -1600
        this.maxX = 1600
        this.minY = -900
        this.maxY = 900
        this.respawnMarginX = 60
        this.respawnLeft = 0
        this.respawnRight = 0
        this.respawnTop = 0
        this.respawnRightX = 0

        this.initPools()
        tickerAdd(this)
    }

    initPools() {
        const defaultTotal = Math.floor(1600 * 900 * COUNT_PER_PX)
        for (const [type, cfg] of Object.entries(SNOW_TYPES)) {
            const poolSize = Math.floor(defaultTotal * cfg.ratio * 0.3)
            for (let i = 0; i < poolSize; i++) {
                this.pools[type].push(this.createFlake(type))
            }
        }
    }

    createFlake(type) {
        const cfg = SNOW_TYPES[type]
        const scale = randomRange(cfg.scaleMin, cfg.scaleMax)
        const flake = new Particle({
            texture: atlases.gameplay.textures.snowflake,
            x: 0, y: 0,
            anchorX: 0.5, anchorY: 0.5,
            scaleX: scale, scaleY: scale,
            rotation: Math.random() * _2PI,
            alpha: randomRange(cfg.alphaMin, cfg.alphaMax),
            tint: TINTS[Math.floor(Math.random() * TINTS.length)]
        })
        flake.data = {
            type,
            scrollSpeed: 0,
            fallSpeed: 0,
            windPhase: 0,
            windFreq: 0,
            driftAmp: 0,
            rotationSpeed: 0,
            noiseOffset: 0
        }
        return flake
    }

    initFlake(flake, type, side = null) {
        const cfg = SNOW_TYPES[type]
        const data = flake.data

        if (side === RESPAWN_SIDE.TOP) {
            flake.x = randomRange(this.minX, this.maxX)
            flake.y = this.respawnTop - randomRange(0, 40)
        } else if (side === RESPAWN_SIDE.RIGHT) {
            flake.x = this.respawnRightX + randomRange(0, 40)
            flake.y = randomRange(this.minY, this.maxY)
        } else {
            flake.x = randomRange(this.minX, this.maxX)
            flake.y = randomRange(this.minY, this.maxY)
        }

        data.scrollSpeed = this.scrollSpeed * cfg.speedMult
        data.fallSpeed = randomRange(cfg.fallMin, cfg.fallMax)
        data.windPhase = Math.random() * SINE_TABLE_SIZE
        data.windFreq = (WIND_BASE_FREQ + Math.random() * WIND_FREQ_VAR) * (SINE_TABLE_SIZE / _2PI)
        data.driftAmp = cfg.driftAmp * (0.9 + Math.random() * 0.2)
        data.rotationSpeed = randomRange(ROTATION_SPEED_MIN, ROTATION_SPEED_MAX)
        data.noiseOffset = Math.floor(Math.random() * NOISE_BUFFER_SIZE)

        flake.alpha = randomRange(cfg.alphaMin, cfg.alphaMax)
        flake.tint = TINTS[Math.floor(Math.random() * TINTS.length)]
        flake.rotation = Math.random() * _2PI
    }

    adjustToLimits() {
        for (const [type, limit] of Object.entries(this.typeLimits)) {
            const current = this.typeCounts[type]
            const need = limit - current
            if (need > 0) {
                for (let i = 0; i < need; i++) {
                    const pool = this.pools[type]
                    let flake = pool.length ? pool.pop() : this.createFlake(type)
                    this.initFlake(flake, type, null)  // null означает случайную позицию по экрану
                    this.container.addParticle(flake)
                    this.flakes.push(flake)
                    this.typeCounts[type]++
                }
            }
        }
    }

    resize(appScreen) {
        const margin = SNOW_TYPES.LARGE.scaleMax * 16
        this.minX = (-appScreen.width - margin) * 0.5
        this.maxX = (appScreen.width + margin) * 0.5
        this.minY = (-appScreen.height - margin) * 0.5
        this.maxY = (appScreen.height + margin) * 0.5

        this.respawnLeft = this.minX - this.respawnMarginX
        this.respawnRight = this.maxX + this.respawnMarginX
        this.respawnTop = this.minY - 80
        this.respawnRightX = this.maxX

       const area = appScreen.width * appScreen.height
        const total = Math.floor(area * COUNT_PER_PX)
        for (const [type, cfg] of Object.entries(SNOW_TYPES)) {
            this.typeLimits[type] = Math.floor(total * cfg.ratio)
        }

        this.adjustToLimits()
    }

    tick(deltaMs) {
        const scaledDelta = deltaMs * timeScale
        if (scaledDelta === 0) return

        const flakes = this.flakes
        const minX = this.minX
        const maxX = this.maxX
        const minY = this.minY
        const maxY = this.maxY
        const respawnLeft = this.respawnLeft
        const respawnRight = this.respawnRight
        const respawnTop = this.respawnTop
        const respawnRightX = this.respawnRightX

        for (let i = 0; i < flakes.length; i++) {
            const flake = flakes[i]
            const data = flake.data
            const type = data.type

            const windIndex = data.windPhase & (SINE_TABLE_SIZE - 1)
            const windOffset = SINE_TABLE[windIndex] * data.driftAmp
            data.windPhase += data.windFreq * scaledDelta
            if (data.windPhase >= SINE_TABLE_SIZE) data.windPhase -= SINE_TABLE_SIZE

            const noiseIndex = (data.noiseOffset + NOISE_STEP) & NOISE_MASK
            const jitter = NOISE_BUFFER[noiseIndex] * JITTER_STRENGTH
            data.noiseOffset = noiseIndex

            flake.x += (-data.scrollSpeed + windOffset + jitter) * scaledDelta
            flake.y += data.fallSpeed * scaledDelta
            flake.rotation += data.rotationSpeed * scaledDelta

            let respawnSide = null
            if (flake.y > maxY) {
                respawnSide = RESPAWN_SIDE.TOP
            } else if (flake.x < respawnLeft) {
                respawnSide = RESPAWN_SIDE.RIGHT
            } else if (flake.x > respawnRight) {
                respawnSide = RESPAWN_SIDE.RIGHT
            }

            if (respawnSide) {
                if (this.typeCounts[type] > this.typeLimits[type]) {
                    this.container.removeParticle(flake)
                    this.pools[type].push(flake)
                    flakes[i] = flakes[flakes.length - 1]
                    flakes.pop()
                    this.typeCounts[type]--
                    i--
                } else {
                    this.initFlake(flake, type, respawnSide)
                }                
            }
        }
    }

    kill() {
        tickerRemove(this)
        if (this.container) {
            this.container.destroy({ children: true })
            this.container = null
        }
        this.flakes.length = 0
        this.pools = { LARGE: [], MEDIUM: [], SMALL: [] }
        this.typeCounts = { LARGE: 0, MEDIUM: 0, SMALL: 0 }
        this.typeLimits = { LARGE: 0, MEDIUM: 0, SMALL: 0 }
    }
}