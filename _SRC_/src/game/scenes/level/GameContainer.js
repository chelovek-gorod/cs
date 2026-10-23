import { Container, Graphics, Text } from "pixi.js"
import { kill, tickerAdd, tickerRemove } from "../../../app/application"
import { sounds } from "../../../app/assets"
import { addGoldForKill, EventHub, events, showPopup, startScene, dragonIsEmpty,
    updateTrapsAvailable, updateFogAvailable } from "../../../app/events"
import { soundPlay } from "../../../app/sound"
import FlyText from "../../effects/FlyText"
import { POPUP_TYPE } from "../../popup/popupTypes"
import { gameState, goldForSavingHp } from "../../state"
import { SCENE_NAME } from "../SceneManager"
import { createArrowOnGround } from "./ArrowOnGround"
import ChestsContainer from "./Chest"
import Dragon from "./Dragon"
import DragonFire from "./DragonFire"
import EnemyBlood from "./EnemyBlood"
import EnemySmoke from "./EnemySmoke"
import Explosion from "./Explosion"
import Tower from "./Tower"
import TowerStones from "./TowerStones"
import { createTrap } from "./Trap"
import Trees from "./Trees"
import TowerFog from "./TowerFog"
import TrailEmitter from "./TrailEmitter"

const SIZE = 720
const MAX_SCALE = 1.3
const RESULT_POPUP_TIMEOUT = 1800

const TRAP_SLOTS_SMALL = 12
const TRAP_SLOTS_BIG = 18
const TRAP_SLOTS_TOTAL = TRAP_SLOTS_SMALL + TRAP_SLOTS_BIG
const TRAP_RADIUS_SMALL = 130
const TRAP_RADIUS_BIG = 190

function getTrapSlotPosition(index) {
    if (index < TRAP_SLOTS_SMALL) {
        const angle = (Math.PI * 2 * index) / TRAP_SLOTS_SMALL
        return { x: Math.cos(angle) * TRAP_RADIUS_SMALL, y: Math.sin(angle) * TRAP_RADIUS_SMALL }
    }
    const i = index - TRAP_SLOTS_SMALL
    const angle = (Math.PI * 2 * i) / TRAP_SLOTS_BIG
    return { x: Math.cos(angle) * TRAP_RADIUS_BIG, y: Math.sin(angle) * TRAP_RADIUS_BIG }
}

export default class GameContainer extends Container {
    constructor() {
        super()

        this.blood = new EnemyBlood()
        this.addChild(this.blood.stainContainer)

        this.deadEnemies = new Container()
        this.addChild(this.deadEnemies)

        this.traps = new Container()
        this.addChild(this.traps)
        this.trapSlots = new Array(TRAP_SLOTS_TOTAL).fill(null)

        this.chests = new ChestsContainer()
        this.addChild(this.chests)

        this.arrowPoints = new Container()
        this.addChild(this.arrowPoints)

        this.arrowsOnGround = new Container()
        this.addChild(this.arrowsOnGround)

        this.arrows = new Container()
        this.stones = new Container()

        this.lightnings = new Graphics()

        this.towerStones = new TowerStones()
        this.addChild(this.towerStones)
        requestAnimationFrame(() => this.towerStones.warmup())

        this.enemies = new Container()

        this.fog = new TowerFog(this.enemies, this.onFogFinished.bind(this))
        this.addChild(this.fog)

        this.addChild(this.enemies)

        this.addChild(this.blood.flyContainer)
        requestAnimationFrame(() => this.blood.warmup())

        this.trees = new Trees()
        this.addChild(this.trees)

        this.enemiesHp = new Container()

        this.smoke = new EnemySmoke()
        requestAnimationFrame( () => this.smoke.warmup() )

        this.tower = new Tower(
            this.arrowPoints, this.arrows, this.smoke,
            this.stones, this.lightnings, this.enemies,
            this.towerStones
        )

        this.enemyArrows = new Container()

        this.arrowStartPower = gameState.arrowPower
        this.arrowCurrentPower = this.arrowStartPower
        this.arrowComboRate = 1.2
        this.arrowComboCount = 0
        this.arrowHeadShootRate = 3
        this.arrowLastTarget = null
        this.addChild(this.tower)

        this.explosions = new Container()
        this.addChild(this.explosions)

        this.addChild(this.lightnings)
        this.addChild(this.smoke)
        this.addChild(this.enemyArrows)
        this.addChild(this.arrows)
        this.addChild(this.stones)

        this.trail = new TrailEmitter()
        this.addChild(this.trail)

        this.dragon = null
        this.dragonFire = new DragonFire()
        this.addChild(this.dragonFire)
        requestAnimationFrame(() => this.dragonFire.warmup())

        // TODO: заменить на клик по иконке. Для теста — автоспавн через 12 сек.
        
        
        this.addChild(this.enemiesHp)

        this.resultPopupTimer = 0

        EventHub.on(events.arrowOnTarget, this.arrowOnTarget, this)
        EventHub.on(events.setTrapsOnMap, this.setTrapsOnMap, this)
        EventHub.on(events.addDragon, this.addDragon, this)
        EventHub.on(events.addExplosion, this.addExplosion, this)
        EventHub.on(events.trapExploded, this.onTrapExploded, this)
        EventHub.on(events.fogStart, this.startFog, this)
        EventHub.on(events.trailEmit, this.onTrailEmit, this)

        this.testGraphics = new Graphics()
        this.addChild(this.testGraphics)
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

        this.chests.screenResize(screenData, scale)

        this.trees.screenResize(screenData)

        this.testGraphics.clear()
        this.testGraphics.rect(-SIZE * 0.5, -SIZE * 0.5, SIZE, SIZE)
        this.testGraphics.stroke({ width: 1, color: 0xffff00 })
    }

    setTrapsOnMap() {
        if (gameState.trapsCount <= 0) return
    
        const freeSmall = []
        const freeBig = []
        for (let i = 0; i < TRAP_SLOTS_TOTAL; i++) {
            if (this.trapSlots[i] !== null) continue
            if (i < TRAP_SLOTS_SMALL) freeSmall.push(i)
            else freeBig.push(i)
        }
    
        let freeSlots
        let baseIndex
        let N
        if (freeSmall.length > 0) {
            freeSlots = freeSmall
            baseIndex = 0
            N = TRAP_SLOTS_SMALL
        } else if (freeBig.length > 0) {
            freeSlots = freeBig
            baseIndex = TRAP_SLOTS_SMALL
            N = TRAP_SLOTS_BIG
        } else {
            return
        }
    
        const count = Math.min(6, freeSlots.length, gameState.trapsCount)
        if (count <= 0) return
    
        let placed = 0
    
        if (freeSlots.length <= count) {
            for (const index of freeSlots) {
                this.placeTrapAtSlot(index)
                placed++
            }
        } else {
            const step = N / 6
            const seed = freeSlots[Math.floor(Math.random() * freeSlots.length)] - baseIndex
    
            outer: for (let offset = 0; offset < step; offset++) {
                for (let i = 0; i < 6; i++) {
                    if (placed >= count) break outer
                    const localPos = (seed + offset + i * step) % N
                    const index = baseIndex + localPos
                    if (this.trapSlots[index] !== null) continue
                    this.placeTrapAtSlot(index)
                    placed++
                }
            }
        }
    
        gameState.trapsCount -= placed
        this.emitTrapsAvailable()
    }
    
    placeTrapAtSlot(index) {
        const pos = getTrapSlotPosition(index)
        const trap = createTrap(pos.x, pos.y, null, this.enemies, index)
        this.traps.addChild(trap)
        this.trapSlots[index] = trap
    }
    emitTrapsAvailable() {
        const hasFreeSlot = this.trapSlots.some(slot => slot === null)
        updateTrapsAvailable(gameState.trapsCount > 0 && hasFreeSlot)
    }
    onTrapExploded(slotIndex) {
        this.trapSlots[slotIndex] = null
        this.emitTrapsAvailable()
    }

    addDragon() {
        if (this.dragon || gameState.dragonsCount < 1) return

        gameState.dragonsCount--

        this.dragon = new Dragon(
            this.enemies,
            this.dragonFire.emit.bind(this.dragonFire),
            this.onDragonFuelEmpty.bind(this)
        )
        this.addChild(this.dragon)
    }
    
    onDragonFuelEmpty() {
        this.dragon = null
        dragonIsEmpty()
    }

    startFog() {
        if (gameState.towerFogCount <= 0) return
        gameState.towerFogCount--
        this.fog.start()
        updateFogAvailable(false)
    }
    
    onFogFinished() {
        updateFogAvailable(gameState.towerFogCount > 0)
    }

    addExplosion(data) {
        const explosion = new Explosion(
            data.atlasName,
            data.x,
            data.y,
            data.radius,
            data.frameDamage,
            data.damage,
            this.enemies
        )
        this.explosions.addChild(explosion)
    }

    onTrailEmit(data) {
        this.trail.spawn(
            data.x, data.y, data.vx, data.vy,
            data.tint, data.scale, data.alphaStart, data.alphaDecay
        )
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
            const enemy = enemies[nearestIndex]
            const x = enemy.x
            const y = enemy.y

            if (this.arrowLastTarget === enemy) {
                this.arrowComboCount++
                this.arrowCurrentPower = Math.floor(this.arrowCurrentPower * this.arrowComboRate)
            } else {
                this.arrowComboCount = 0
                this.arrowLastTarget = enemy
                this.arrowCurrentPower = this.arrowStartPower
            }

            let power = this.arrowCurrentPower
            const textPoint = this.parent.toLocal({ x, y }, this)

            if (nearestSqDist < enemy.headSqCollider) {
                power *= this.arrowHeadShootRate
                this.parent.flyTexts.addChild(
                    new FlyText('HEAD SHOOT', textPoint.x, textPoint.y - 18)
                )
            }

            if (data.isRage === true) power *= gameState.berserkPowerRate

            power = Math.round(power)
            const text = this.arrowComboCount > 0
                ? `-${power} Combo X${this.arrowComboCount}`
                : `-${power}`
            this.parent.flyTexts.addChild(
                new FlyText(text, textPoint.x, textPoint.y)
            )

            enemy.setDamage(power)

            if (data.isRage !== true) EventHub.emit(events.addRage, power)

            if (data.isIce === true && enemy.hp > 0) {
                enemy.onIce(gameState.iceDuration)
            }
        } else {
            this.arrowComboCount = 0
            this.arrowLastTarget = null
            this.arrowCurrentPower = this.arrowStartPower

            const chestReward = this.chests.checkShut(data.x, data.y)
            if (chestReward > 0) {
                const textPoint = this.parent.toLocal({x: data.x, y: data.y}, this)
                this.parent.flyTexts.addChild(
                    new FlyText(`+${chestReward} Gold`, textPoint.x, textPoint.y)
                )
                addGoldForKill(chestReward)
                soundPlay(sounds.se_coins)
            } else {
                this.arrowsOnGround.addChild(createArrowOnGround(data.x, data.y, data.direction))
            }
        }
    }

    handleRoundWin() {
        this.chests.stopSpawning()

        if (this.tower.hp > 9) {
            const extraGold = Math.floor(this.tower.hp * goldForSavingHp)
            this.parent.flyTexts.addChild(new FlyText(`+${extraGold} EXTRA GOLD`, 0, 0))
            gameState.gold += extraGold
        }

        if (this.dragon) gameState.dragonsCount += 1

        this.resultPopupTimer = RESULT_POPUP_TIMEOUT
        tickerAdd(this)
    }

    handleRoundLose() {
        gameState.trapsCount += this.traps.children.length

        if (this.dragon) gameState.dragonsCount += 1
        this.parent.enemiesSpawner.kill()
        startScene(SCENE_NAME.Menu)
    }

    tick(deltaMs) {
        if (this.chests.children.length > 0) return
        
        this.resultPopupTimer -= deltaMs
        if (this.resultPopupTimer > 0) return

        tickerRemove(this)
        showPopup(POPUP_TYPE.UPGRADE)
        gameState.round += 1
        gameState.trapsCount += this.traps.children.length
    }

    kill() {
        tickerRemove(this)

        if (this.trees) {
            this.trees.kill()
            this.trees = null
        }
        
        if (this.dragonSpawnTimeout) {
            clearTimeout(this.dragonSpawnTimeout)
            this.dragonSpawnTimeout = null
        }
        if (this.dragon) {
            this.dragon.kill()
            this.dragon = null
        }
        if (this.dragonFire) {
            this.dragonFire.kill()
            this.dragonFire = null
        }

        EventHub.off(events.arrowOnTarget, this.arrowOnTarget, this)
        EventHub.off(events.setTrapsOnMap, this.setTrapsOnMap, this)
        EventHub.off(events.addDragon, this.addDragon, this)
        EventHub.off(events.addExplosion, this.addExplosion, this)
        EventHub.off(events.trapExploded, this.onTrapExploded, this)
        EventHub.off(events.fogStart, this.startFog, this)
        EventHub.off(events.trailEmit, this.onTrailEmit, this)

        if (this.blood) {
            this.blood.kill()
            this.blood = null
        }

        if (this.smoke) {
            this.smoke.kill()
            this.smoke = null
        }

        if (this.fog) {
            this.fog.kill()
            this.fog = null
        }

        if (this.towerStones) {
            this.towerStones.kill()
            this.towerStones = null
        }

        if (this.trail) {
            this.trail.kill()
            this.trail = null
        }

        kill(this.deadEnemies)
        kill(this.traps)
        kill(this.enemies)
        kill(this.arrowsOnGround)
        kill(this.arrowPoints)
        kill(this.arrows)
        kill(this.enemyArrows)

        kill(this.tower)
        kill(this.chests)
        kill(this.lightnings)
        kill(this.stones)
        kill(this.enemiesHp)
        kill(this.testGraphics)
        kill(this.explosions)
    }
}