import { Container, Graphics } from "pixi.js"
import { tickerAdd, tickerRemove } from "../../../app/application"
import { EventHub, events, showPopup } from "../../../app/events"
import FlyText from "../../effects/FlyText"
import { POPUP_TYPE } from "../../popup/popupTypes"
import { addGold, addRound, arrowPower, gold, round, towerHP } from "../../state"
import { ArrowOnGround } from "./ArrowOnGround"
import { clearEnemyPool, Enemy } from "./Enemy"
import { clearStonePool } from "./Stone"
import Tower from "./Tower"
import { getRoundWaves, FIRST_WAVE_TIMEOUT, WAVE_TIMEOUT, WAVE_NEXT_ENEMY_TIMEOUT_MAX,
    WAVE_NEXT_ENEMY_TIMEOUT_MIN, MAX_WAVE_SPAWN_TIME } from "./waves"

let WAVES

const SIZE = 800
const MAX_SCALE = 1.3
const MAX_ENEMY_HALF_SIZE = 64
const ENEMIES_SPAWN_RADIUS = SIZE * 0.5 + MAX_ENEMY_HALF_SIZE

export default class GameContainer extends Container {
    constructor() {
        super()

        WAVES = getRoundWaves(round)

        this.goldAtStart = gold

        this.deadEnemies = new Container()
        this.addChild(this.deadEnemies)

        this.arrowPoints = new Container()
        this.addChild(this.arrowPoints)

        this.arrowsOnGround = new Container()
        this.addChild(this.arrowsOnGround)

        this.arrows = new Container()
        this.stones = new Container()
        this.particles = null

        this.lightnings = new Graphics()

        this.enemies = new Container()
        this.addChild(this.enemies)

        this.tower = new Tower(
            this.arrowPoints, this.arrowsOnGround, this.arrows,
            this.stones, this.lightnings, this.enemies, this.particles
        )

        this.enemyArrows = new Container()

        this.arrowStartPower = arrowPower
        this.arrowCurrentPower = this.arrowStartPower
        this.arrowComboRate = 1.2
        this.arrowComboCount = 0
        this.arrowHeadShutRate = 3
        this.arrowLastTarget = null
        this.addChild(this.tower)

        // ---- Управление волнами ----
        this.enemiesWaveIndex = 0
        this.enemiesSpawnTimeout = FIRST_WAVE_TIMEOUT   // задержка перед первой волной
        this.allWavesSpawned = false
        this.isWaveSpawning = false                     // идёт ли спавн текущей волны
        this.isWaveSpawnedCompletely = false            // все враги волны заспавнены, ждём зачистки
        this.enemySpawnQueue = []                       // очередь типов врагов текущей волны
        this.enemySpawnTimer = 0                        // таймер до следующего пакета
        this.enemySpawnInterval = Math.max(
            WAVE_NEXT_ENEMY_TIMEOUT_MIN,
            WAVE_NEXT_ENEMY_TIMEOUT_MAX - round
        )
        this.wavePackets = []                           // размеры пакетов для пакетного спавна
        this.currentPacketIndex = 0

        this.addChild(this.lightnings)
        this.addChild(this.enemyArrows)
        this.addChild(this.arrows)
        this.addChild(this.stones)

        this.spawnSectors = [
            { start: 0, end: 90 },
            { start: 90, end: 180 },
            { start: 180, end: 270 },
            { start: 270, end: 360 },
        ]

        this.popupDelay = 0

        EventHub.on(events.arrowOnTarget, this.arrowOnTarget, this)
        tickerAdd(this)

        this.testGraphics = new Graphics()
        this.addChild(this.testGraphics)

        requestAnimationFrame(() => {
            this.parent.ui.setWaveText(this.enemiesWaveIndex + 1, WAVES.length)
        })
    }

    screenResize(screenData, safeAreaOffsets) {
        let scale = 1
        if (screenData.isLandscape) {
            const width = screenData.width - safeAreaOffsets.left - safeAreaOffsets.right
            scale = Math.min(MAX_SCALE, width / SIZE)
        } else {
            const height = screenData.height - safeAreaOffsets.top - safeAreaOffsets.bottom
            scale = Math.min(MAX_SCALE, height / SIZE)
        }

        this.scale.set(scale)

        this.updateSpawnSectors(scale, screenData)

        this.testGraphics.clear()
        this.testGraphics.rect(-SIZE * 0.5, -SIZE * 0.5, SIZE, SIZE)
        this.testGraphics.stroke({ width: 6, color: 0xffff00 })
    }

    updateSpawnSectors(scale, screenData) {
        if (scale >= 1) {
            this.spawnSectors = [
                { start: 0, end: 90 },
                { start: 90, end: 180 },
                { start: 180, end: 270 },
                { start: 270, end: 360 },
            ]
            return
        }

        let V
        if (!screenData.isLandscape) V = screenData.width / (2 * scale)
        else V = screenData.height / (2 * scale)
        V = Math.max(0, Math.min(400, V))

        const reductionAngle = (1 - V / 400) * 90

        if (!screenData.isLandscape) {
            this.spawnSectors = [
                { start: reductionAngle, end: 90 },
                { start: 90, end: 180 - reductionAngle },
                { start: 180 + reductionAngle, end: 270 },
                { start: 270, end: 360 - reductionAngle },
            ]
        } else {
            this.spawnSectors = [
                { start: 0, end: 90 - reductionAngle },
                { start: 90 + reductionAngle, end: 180 },
                { start: 180, end: 270 - reductionAngle },
                { start: 270 + reductionAngle, end: 360 },
            ]
        }
    }

    getRandomSpawnAngle() {
        const totalLength = this.spawnSectors.reduce(
            (sum, interval) => sum + (interval.end - interval.start), 0
        )
        if (totalLength <= 0) return 0

        let random = Math.random() * totalLength
        for (const interval of this.spawnSectors) {
            const length = interval.end - interval.start
            if (random < length) {
                const angleDeg = interval.start + random
                return angleDeg * Math.PI / 180
            }
            random -= length
        }
        return 0
    }

    arrowOnTarget(data) {
        let nearestIndex = -1
        let nearestSqDist = Infinity

        const enemies = this.enemies.children
        const enemiesSize = enemies.length
        for(let i = 0; i < enemiesSize; i++) {
            const enemy = enemies[i]
            const dx = data.x - enemy.x
            const dy = data.y - enemy.y
            const distSq = dx * dx + dy * dy

            if (distSq < enemy.bodySqCollider && distSq < nearestSqDist) {
                nearestSqDist = distSq
                nearestIndex = i
            }
        }

        if (nearestIndex > -1) {
            const x = enemies[nearestIndex].x
            const y = enemies[nearestIndex].y

            if (this.arrowLastTarget === enemies[nearestIndex]) {
                this.arrowComboCount++
                this.arrowCurrentPower = Math.floor(this.arrowCurrentPower * this.arrowComboRate)
            } else {
                this.arrowComboCount = 0
                this.arrowLastTarget = enemies[nearestIndex]
                this.arrowCurrentPower = this.arrowStartPower
            }

            let power = this.arrowCurrentPower

            if (nearestSqDist < enemies[nearestIndex].headSqCollider) {
                power *= this.arrowHeadShutRate
                this.parent.flyTexts.addChild(new FlyText('HEAD SHUT', x, y - 18))
            }

            const text = this.arrowComboCount > 0
                ? `-${power} Combo X${this.arrowComboCount}`
                : `-${power}`
            this.parent.flyTexts.addChild(new FlyText(text, x, y))
            enemies[nearestIndex].setDamage(power)
        } else {
            this.arrowComboCount = 0
            this.arrowLastTarget = null
            this.arrowCurrentPower = this.arrowStartPower
            this.arrowsOnGround.addChild(new ArrowOnGround(data.x, data.y, data.direction))
        }
    }

    spawnEnemy(type) {
        const angle = this.getRandomSpawnAngle()
        const rx = Math.cos(angle) * (ENEMIES_SPAWN_RADIUS + 128)
        const ry = Math.sin(angle) * (ENEMIES_SPAWN_RADIUS + 128)
        this.enemies.addChild(new Enemy(rx, ry, type, this.deadEnemies, this.enemyArrows))
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

    // Начинает спавн текущей волны
    startWaveSpawning() {
        this.enemySpawnQueue = WAVES[this.enemiesWaveIndex].slice()
        this.isWaveSpawning = true
        this.currentPacketIndex = 0

        this.wavePackets = this.buildWavePackets(this.enemySpawnQueue.length)

        this.spawnNextPacket()
    }

    // Спавнит следующий пакет или одиночного врага
    spawnNextPacket() {
        let packetSize = 1

        if (this.wavePackets) {
            packetSize = this.wavePackets[this.currentPacketIndex] || 0
            this.currentPacketIndex++
        }

        for (let i = 0; i < packetSize && this.enemySpawnQueue.length > 0; i++) {
            const type = this.enemySpawnQueue.shift()
            this.spawnEnemy(type)
        }

        if (this.enemySpawnQueue.length === 0) {
            this.isWaveSpawning = false
            this.isWaveSpawnedCompletely = true
            this.wavePackets = []
        } else {
            this.enemySpawnTimer = this.enemySpawnInterval
        }
    }

    // Переход к следующей волне после зачистки
    nextWave() {
        this.enemiesWaveIndex++
        if (this.enemiesWaveIndex >= WAVES.length) {
            this.allWavesSpawned = true
            return
        }

        this.parent.ui.setWaveText(this.enemiesWaveIndex + 1, WAVES.length)
        this.enemiesSpawnTimeout = WAVE_TIMEOUT
        this.isWaveSpawning = false
        this.isWaveSpawnedCompletely = false
        this.enemySpawnQueue = []
        this.wavePackets = []
    }

    handleSpawning(deltaMs) {
        // 1. Идёт спавн текущей волны
        if (this.isWaveSpawning) {
            if (this.enemySpawnQueue.length > 0) {
                this.enemySpawnTimer -= deltaMs
                if (this.enemySpawnTimer <= 0) {
                    this.spawnNextPacket()
                }
            } else {
                this.isWaveSpawning = false
                this.isWaveSpawnedCompletely = true
                this.wavePackets = []
            }
            return
        }

        // 2. Все враги волны заспавнены, ждём зачистки
        if (this.isWaveSpawnedCompletely) {
            if (this.enemies.children.length === 0) {
                this.isWaveSpawnedCompletely = false
                this.nextWave()
            }
            return
        }

        // 3. Таймер до начала следующей волны
        if (this.enemiesSpawnTimeout > 0) {
            this.enemiesSpawnTimeout -= deltaMs
            return
        }

        // 4. Таймер истёк — начинаем спавн текущей волны
        this.startWaveSpawning()
    }

    handleRoundEnd(deltaMs) {
        if (this.enemies.children.length === 0) {
            if (this.popupDelay === 0) {
                this.popupDelay = 1500

                if (this.tower.hp === towerHP) {
                    const extraGold = Math.round((gold - this.goldAtStart) * 0.5)
                    this.parent.flyTexts.addChild(new FlyText(`+${extraGold} EXTRA GOLD`, 0, 0))
                    addGold(extraGold)
                }
                return
            }

            this.popupDelay -= deltaMs
            if (this.popupDelay <= 0) {
                tickerRemove(this)
                showPopup(POPUP_TYPE.UPGRADE)
                addRound()
            }
        }
    }

    tick(deltaMs) {
        if (this.allWavesSpawned) this.handleRoundEnd(deltaMs)
        else this.handleSpawning(deltaMs)
    }

    clearContainer(container) {
        for (let i = 0; i < container.children.length; i++) {
            const child = container.children[0]
            container.removeChild(child)
            if ('kill' in child) child.kill()
            else child.destroy({ children: true })
        }
        this.removeChild(container)
    }

    kill() {
        EventHub.off(events.arrowOnTarget, this.arrowOnTarget, this)
        tickerRemove(this)

        this.clearContainer(this.deadEnemies)
        this.clearContainer(this.enemies)
        this.clearContainer(this.arrowsOnGround)
        this.clearContainer(this.arrowPoints)
        this.clearContainer(this.arrows)
        this.clearContainer(this.enemyArrows)
        clearEnemyPool()
        clearStonePool()
    }
}