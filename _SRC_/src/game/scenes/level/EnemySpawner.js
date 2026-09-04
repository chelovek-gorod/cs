import { tickerAdd, tickerRemove } from "../../../app/application"
import { createEnum } from "../../../utils/functions"
import { round } from "../../state"
import { createEnemy } from "./Enemy"
import { getRoundWaves } from "./waves"

const SIZE = 800
const MAX_ENEMY_HALF_SIZE = 64
const ENEMIES_SPAWN_RADIUS = SIZE * 0.5 + MAX_ENEMY_HALF_SIZE

// --- ТАЙМИНГИ (экспортируем для GameContainer) ---
export const FIRST_WAVE_TIMEOUT = 1200
export const WAVE_TIMEOUT = 600
export const WAVE_NEXT_ENEMY_TIMEOUT_MAX = 900 
export const WAVE_NEXT_ENEMY_TIMEOUT_MIN = 120 
// this.spawnInterval = Math.max(WAVE_NEXT_ENEMY_TIMEOUT_MIN, WAVE_NEXT_ENEMY_TIMEOUT_MAX - round)
// Получается, чем выше раунд, тем быстрее спавнятся враги, но не быстрее 120 мс.

// --- ПАКЕТНЫЙ СПАВН (экспортируем) ---
export const MAX_WAVE_SPAWN_TIME = 12000 // мс
// Если в текущей волне спавн дольше 12 секунд, то начинается пакетный спавн.

const STATE = createEnum([
    'AWAIT_NEXT_WAVE',
    'AWAIT_NEXT_ENEMY',
    'AWAIT_ENEMIES_CLEAR',
    'AWAIT_ROUND_END'
])

export default class EnemySpawner {
    constructor(gameContainer, ui) {
        this.waves = getRoundWaves(round)

        this.parentUi = ui

        this.enemies = gameContainer.enemies
        this.deadEnemies = gameContainer.deadEnemies
        this.enemyArrows = gameContainer.enemyArrows
        this.enemiesHp = gameContainer.enemiesHp
        this.gameHandleRoundWin = gameContainer.handleRoundWin.bind(gameContainer)

        this.waveIndex = 0
        this.timeout = FIRST_WAVE_TIMEOUT
        this.state = STATE.AWAIT_NEXT_WAVE
        this.spawnQueue = []
        
        this.spawnInterval = Math.max(
            WAVE_NEXT_ENEMY_TIMEOUT_MIN,
            WAVE_NEXT_ENEMY_TIMEOUT_MAX - round
        )
        this.wavePackets = []  // размеры пакетов для пакетного спавна
        this.currentPacketIndex = 0

        this.spawnSectors = [
            { start: 0, end: 90 },
            { start: 90, end: 180 },
            { start: 180, end: 270 },
            { start: 270, end: 360 },
        ]
        this.sectorIndex = Math.floor(Math.random() * this.spawnSectors.length)
        this.sectorSideIndex = Math.random() < 0.5 ? 0 : 1

        this.parentUi.setWaveText(this.waveIndex + 1, this.waves.length)

        this.isActive = true
        tickerAdd(this)
    }

    screenResize(screenData, scale) {
        this.isLandscape = screenData.isLandscape

        this.spawnSectors = [
            { start: 0, end: 90 },
            { start: 90, end: 180 },
            { start: 180, end: 270 },
            { start: 270, end: 360 },
        ]
        
        if (scale >= 1) return

        const halfSize = SIZE * 0.5
        const shortSide = screenData.isLandscape ? screenData.height : screenData.width
        const shortVisible = Math.max(0, Math.min(halfSize, shortSide / (2 * scale)))
        const reductionAngle = (1 - shortVisible / halfSize) * 90

        if (screenData.isLandscape) {
            this.spawnSectors = [
                { start: 0, end: 90 - reductionAngle },
                { start: 90 + reductionAngle, end: 180 },
                { start: 180, end: 270 - reductionAngle },
                { start: 270 + reductionAngle, end: 360 },
            ]
        } else {
            this.spawnSectors = [
                { start: reductionAngle, end: 90 },
                { start: 90, end: 180 - reductionAngle },
                { start: 180 + reductionAngle, end: 270 },
                { start: 270, end: 360 - reductionAngle },
            ]
        }
    }

    getNextSpawnAngle() {
        const sector = this.spawnSectors[this.sectorIndex]
        let angleDeg

        if (sector.end - sector.start < 60) {
            // Маленький сектор – просто случайная точка внутри
            angleDeg = sector.start + Math.random() * (sector.end - sector.start)
            this.sectorIndex++
        } else {
            // Большой сектор – делим пополам, чередуем половины
            const mid = (sector.start + sector.end) / 2
            if (this.sectorSideIndex % 2 === 0) {
                angleDeg = sector.start + Math.random() * (mid - sector.start)
            } else {
                angleDeg = mid + Math.random() * (sector.end - mid)
            }
        }

        // Переходим к следующему сектору
        this.sectorIndex++
        if (this.sectorIndex >= this.spawnSectors.length) {
            this.sectorIndex++
            this.sectorIndex -= this.spawnSectors.length
            this.sectorSideIndex++
        }

        return angleDeg * Math.PI / 180
    }

    spawnEnemy(type) {
        const angle = this.getNextSpawnAngle()
        const rx = Math.cos(angle) * (ENEMIES_SPAWN_RADIUS + 128)
        const ry = Math.sin(angle) * (ENEMIES_SPAWN_RADIUS + 128)
        this.enemies.addChild(
            createEnemy(rx, ry, type, this.deadEnemies, this.enemyArrows, this.enemiesHp)
        )
    }

    // Строит массив размеров пакетов так, чтобы спавн волны длился не дольше MAX_WAVE_SPAWN_TIME
    buildWavePackets(queueLength) {
        const maxTicks = Math.floor(MAX_WAVE_SPAWN_TIME / WAVE_NEXT_ENEMY_TIMEOUT_MIN)
        if (queueLength <= maxTicks) {
            return null // пакетный спавн не нужен
        }

        const packets = []
        let remaining = queueLength
        let step = 1
        let index = 0

        while (remaining > 0 && index < maxTicks) {
            const add = Math.min(step, remaining)
            packets.push(add)
            remaining -= add
            index++
            if (index % 3 === 0) step++ // наращиваем пакет
        }

        if (remaining > 0) packets[packets.length - 1] += remaining

        return packets
    }

    awaitNextWave(deltaMs) {
        this.timeout -= deltaMs
        if (this.timeout > 0) return

        // Если все волны вышли — раунд заканчивается
        if (this.waveIndex >= this.waves.length) {
            this.state = STATE.AWAIT_ROUND_END
            this.timeout = 0
            return
        }

        // Готовим очередь врагов текущей волны
        this.spawnQueue = this.waves[this.waveIndex].slice()
        this.currentPacketIndex = 0
        this.wavePackets = this.buildWavePackets(this.spawnQueue.length)

        // Переходим к спавну врагов
        this.state = STATE.AWAIT_NEXT_ENEMY
        this.timeout = 0 // первый враг появится сразу
    }

    awaitNextEnemy(deltaMs) {
        this.timeout -= deltaMs
        if (this.timeout > 0) return
    
        // Если очередь пуста - волна завершена
        if (this.spawnQueue.length === 0) {
            this.state = STATE.AWAIT_ENEMIES_CLEAR
            return
        }
    
        // Определяем размер пакета
        let packetSize = 1
        if (this.wavePackets) {
            packetSize = this.wavePackets[this.currentPacketIndex] || 0
            this.currentPacketIndex++
        }
    
        // Спавним пакет
        for (let i = 0; i < packetSize && this.spawnQueue.length > 0; i++) {
            const type = this.spawnQueue.shift()
            this.spawnEnemy(type)
        }
    
        // Таймер до следующего пакета
        this.timeout = this.spawnInterval
    }

    awaitEnemiesClear() {
        // Ждём зачистки всех врагов текущей волны
        if (this.enemies.children.length === 0) {
            this.waveIndex++
    
            if (this.waveIndex >= this.waves.length) {
                // Все волны пройдены
                this.state = STATE.AWAIT_ROUND_END
            } else {
                this.parentUi.setWaveText(this.waveIndex + 1, this.waves.length)
                this.state = STATE.AWAIT_NEXT_WAVE
            }

            this.timeout = WAVE_TIMEOUT
        }
    }

    awaitRoundEnd(deltaMs) {
        this.timeout -= deltaMs
        if (this.timeout > 0) return

        this.gameHandleRoundWin()
        this.kill()
    }

    tick(deltaMs) {
        if (!this.isActive) return

        switch(this.state) {
            case STATE.AWAIT_NEXT_WAVE: this.awaitNextWave(deltaMs); break;
            case STATE.AWAIT_NEXT_ENEMY: this.awaitNextEnemy(deltaMs); break;
            case STATE.AWAIT_ENEMIES_CLEAR: this.awaitEnemiesClear(deltaMs); break;
            case STATE.AWAIT_ROUND_END: this.awaitRoundEnd(deltaMs); break;
        }
    }

    kill() {
        this.isActive = false
        tickerRemove(this)
        if (this.spawnQueue) this.spawnQueue.length = 0
        if (this.wavePackets) this.wavePackets.length = 0

        this.enemies = null
        this.deadEnemies = null
        this.enemyArrows = null
        this.parentUi = null
        this.gameHandleRoundWin = null
    }
}