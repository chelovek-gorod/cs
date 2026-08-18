import { Container, Graphics, Text } from "pixi.js";
import { getSafeAreaOffsets, tickerAdd, tickerRemove } from "../../../app/application";
import { EventHub, events, showPopup } from "../../../app/events";
import { styles } from "../../../app/styles";
import FlyText from "../../effects/FlyText";
import { POPUP_TYPE } from "../../popup/popupTypes";
import { addRound, arrowPower, round } from "../../state";
import { ArrowOnGround } from "./ArrowOnGraund";
import { Enemy } from "./Enemy";
import Tower from "./Tower";
import { getRoundWaves } from "./waves"; 

let WAVES
const ENEMY_SPAWN_INTERVAL_MS = 600   // интервал между появлением отдельных врагов в линии

const SIZE = 800
const MAX_SCALE = 1.3
const MAX_ENEMY_HALF_SIZE = 64
const ENEMIES_SPAWN_RADIUS = SIZE * 0.5 + MAX_ENEMY_HALF_SIZE

export default class GameContainer extends Container {
    constructor() {
        super()

        WAVES = getRoundWaves(round)
        console.log(WAVES)

        this.arrowsOnGround = new Container()
        this.addChild(this.arrowsOnGround)

        this.arrowPoints = new Container()
        this.addChild(this.arrowPoints)

        this.arrows = new Container()

        this.tower = new Tower(this.arrowPoints, this.arrowsOnGround, this.arrows)
        this.arrowStartPower = arrowPower
        this.arrowCurrentPower = this.arrowStartPower
        this.arrowComboRate = 1.2
        this.arrowComboCount = 0
        this.arrowHeadShutRate = 3
        this.arrowLastTarget = null
        this.addChild(this.tower)

        this.enemies = new Container()
        this.enemiesWaveIndex = 0
        this.enemiesWaveLineIndex = 0
        this.enemiesSpawnTimeout = WAVES[this.enemiesWaveIndex][this.enemiesWaveLineIndex].timeout
        this.allWavesSpawned = false
        this.isLineSpawning = false
        this.enemySpawnQueue = []
        this.enemySpawnTimer = 0
        this.addChild(this.enemies)
        
        this.addChild(this.arrows)

        this.spawnSectors = [
            { start: 0, end: 90 },
            { start: 90, end: 180 },
            { start: 180, end: 270 },
            { start: 270, end: 360 },
        ]

        this.isWaveSpawnedCompletely = false
        this.popupDelay = 0

        this.roundText = new Text({text: '', style: styles.loading})
        this.roundText.anchor.set(0.5)
        this.addChild(this.roundText)
        this.updateRoundText()

        EventHub.on(events.arrowOnTarget, this.arrowOnTarget, this)

        tickerAdd(this)

        this.testGraphics = new Graphics()
        this.addChild(this.testGraphics)
    }

    screenResize(screenData) {
        let scale = 1
        const safeAreaOffsets = getSafeAreaOffsets()
        if (screenData.isLandscape) {
            const width = screenData.width + safeAreaOffsets.left + safeAreaOffsets.right
            scale = Math.min( MAX_SCALE, width / SIZE )
        } else {
            const height = screenData.height + safeAreaOffsets.top + safeAreaOffsets.bottom
            scale = Math.min( MAX_SCALE, height / SIZE )
        }

        // Обновляем секторы спавна в зависимости от масштаба и ориентации
        this.updateSpawnSectors(scale, screenData)

        const startPoint = -SIZE * 0.5 * scale
        const scaledSize = SIZE * scale
        this.testGraphics.clear()
        this.testGraphics.rect(startPoint, startPoint, scaledSize, scaledSize)
        this.testGraphics.stroke({width: 6, color: 0xffff00})

        const topOffset = 40
        const safeTop = safeAreaOffsets.top || 0
        this.roundText.position.set(0, -screenData.centerY + safeTop + topOffset)
    }

    updateRoundText() {
        this.roundText.text = `${round} (${this.enemiesWaveIndex + 1}/${WAVES.length})`
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

    arrowOnTarget(data) { /* data {x, y, direction}; enemies = [{x, y}, {x, y}] */
        let nearestIndex = -1
        let nearestSqDist = Infinity

        const enemies = this.enemies.children
        const enemiesSize = enemies.length
        for(let i = 0; i < enemiesSize; i++) {
            const enemy = enemies[i]
            const collider = enemy.collider
            const dx = data.x - enemy.x
            const dy = data.y - enemy.y
            const distSq = dx * dx + dy * dy

            if (distSq < collider * collider && distSq < nearestSqDist) {
                nearestSqDist = distSq
                nearestIndex = i
            }
        }

        if (nearestIndex > -1) {
            const x = enemies[nearestIndex].x
            const y = enemies[nearestIndex].y

            // check combo
            if (this.arrowLastTarget === enemies[nearestIndex]) {
                this.arrowComboCount++
                this.arrowCurrentPower = Math.floor(this.arrowCurrentPower * this.arrowComboRate)
            } else {
                this.arrowComboCount = 0
                this.arrowLastTarget = enemies[nearestIndex]
                this.arrowCurrentPower = this.arrowStartPower
            }

            let power = this.arrowCurrentPower

            // check head shut
            if (nearestSqDist < enemies[nearestIndex].headSqCollider) {
                power *= this.arrowHeadShutRate
                this.parent.flyTexts.addChild( new FlyText('HEAD SHUT', x, y - 18) )
            }
                
            const text = this.arrowComboCount > 0
                ? `-${power} Combo X${this.arrowComboCount}`
                : `-${power}`
            this.parent.flyTexts.addChild( new FlyText(text, x, y) )
            enemies[nearestIndex].setDamage(power)

        // miss
        } else {
            this.arrowComboCount = 0
            this.arrowLastTarget = null
            this.arrowCurrentPower = this.arrowStartPower
            this.arrowsOnGround.addChild( new ArrowOnGround(data.x, data.y, data.direction) )
        }
    }

    spawnEnemy(enemy) {
        const angle = this.getRandomSpawnAngle()
        const rx = Math.cos(angle) * (ENEMIES_SPAWN_RADIUS + 128)
        const ry = Math.sin(angle) * (ENEMIES_SPAWN_RADIUS + 128)

        this.enemies.addChild( new Enemy(rx, ry, enemy) )
    }

    nextWaveLine() {
        // Переход к следующей волне после зачистки текущей
        this.enemiesWaveLineIndex = 0
        this.enemiesWaveIndex++

        if (this.enemiesWaveIndex === WAVES.length) {
            this.allWavesSpawned = true
            return
        }

        this.updateRoundText()
        // Устанавливаем таймер первой линии новой волны
        this.enemiesSpawnTimeout = WAVES[this.enemiesWaveIndex][0].timeout
        this.isWaveSpawnedCompletely = false
        this.isLineSpawning = false
        this.enemySpawnQueue = []
    }

    startLineSpawning() {
        const lineData = WAVES[this.enemiesWaveIndex][this.enemiesWaveLineIndex]
        const enemies = lineData.enemies

        // Заполняем очередь врагов
        this.enemySpawnQueue = []
        for (const type in enemies) {
            let count = enemies[type]
            while (count-- > 0) this.enemySpawnQueue.push(type)
        }

        // Сразу спавним первого врага, чтобы не было пустой паузы
        if (this.enemySpawnQueue.length > 0) {
            const type = this.enemySpawnQueue.shift()
            this.spawnEnemy(type)
            this.enemySpawnTimer = ENEMY_SPAWN_INTERVAL_MS
        }

        this.isLineSpawning = true
    }

    onLineSpawned() {
        // Переходим к следующей линии
        this.enemiesWaveLineIndex++

        if (this.enemiesWaveLineIndex < WAVES[this.enemiesWaveIndex].length) {
            // Запускаем таймер следующей линии
            this.enemiesSpawnTimeout = WAVES[this.enemiesWaveIndex][this.enemiesWaveLineIndex].timeout
        } else {
            // Это была последняя линия волны — ждём её полной зачистки
            this.isWaveSpawnedCompletely = true
        }
    }

    handleSpawning(deltaMs) {
        // 1. Идёт поштучный спавн текущей линии
        if (this.isLineSpawning) {
            if (this.enemySpawnQueue.length > 0) {
                this.enemySpawnTimer -= deltaMs
                if (this.enemySpawnTimer <= 0) {
                    this.enemySpawnTimer = ENEMY_SPAWN_INTERVAL_MS
                    const type = this.enemySpawnQueue.shift()
                    this.spawnEnemy(type)
                }
            } else {
                // Все враги линии появились — линия полностью заспавнена
                this.isLineSpawning = false
                this.onLineSpawned()
            }
            return
        }

        // 2. Все линии волны заспавнены, ждём зачистки волны
        if (this.isWaveSpawnedCompletely) {
            if (this.enemies.children.length === 0) {
                this.isWaveSpawnedCompletely = false
                this.nextWaveLine()
            }
            return
        }

        // 3. Таймер до следующей линии ещё идёт
        if (this.enemiesSpawnTimeout > 0) {
            this.enemiesSpawnTimeout -= deltaMs
            return
        }

        // 4. Таймер истёк — начинаем спавн текущей линии
        this.startLineSpawning()
    }

    handleRoundEnd(deltaMs) {
        if (this.enemies.children.length === 0) {
            if (this.popupDelay === 0) {
                this.popupDelay = 1500
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

    kill() {
        EventHub.off(events.arrowOnTarget, this.arrowOnTarget, this)
        tickerRemove(this)

        this.removeChild(this.arrowsOnGround)
        this.arrowsOnGround.destroy({children: true})

        this.removeChild(this.arrowPoints)
        this.arrowPoints.destroy({children: true})

        this.removeChild(this.arrows)
        this.arrows.destroy({children: true})
    }
}