import { Container, AnimatedSprite, Graphics } from "pixi.js"
import { tickerAdd, tickerRemove } from "../../../app/application"
import { atlases, sounds } from "../../../app/assets"
import { addGoldForKill, setDamage, addExplosion, addEnemySmoke, enemyHit, addVoodooFX } from "../../../app/events"
import { createEnum, getDistance } from "../../../utils/functions"
import { createObjectPool } from "../../../utils/pool"
import { createHpBar } from "./EnemiesHpBar"
import { createEnemyArrow } from "./EnemyArrow"
import { createEnemyStone } from "./EnemyStone"
import { BLOOD_GREEN, BLOOD_BLACK, BLOOD_ICE } from './EnemyBlood'
import { soundPlay } from "../../../app/sound"
import { gameState } from "../../state"
import { createVoodooFX } from "./VoodooFX"

const ENEMY_POOL = createObjectPool(100)
const VOODOO_POOL = createObjectPool(20)

// voodoo
const VOODOO_ALPHA_STEP = 0.001
const VOODOO_HILL_RADIUS_SQ = 320 * 320
const VOODOO_HEAL_RATE = 0.25
const VOODOO_HEAL_FRAME = 24

export function createEnemy(x, y, type, deadEnemiesContainer, enemyArrows, hpContainer) {
    if (type === TYPES.VOODOO) {
        let voodoo = VOODOO_POOL.get()
        if (voodoo) {
            voodoo.reset(x, y, type, deadEnemiesContainer, enemyArrows, hpContainer)
        } else {
            voodoo = new VoodooEnemy(x, y, type, deadEnemiesContainer, enemyArrows, hpContainer)
            VOODOO_POOL.add(voodoo)
        }
        return voodoo
    }

    let enemy = ENEMY_POOL.get()
    if (enemy) {
        enemy.reset(x, y, type, deadEnemiesContainer, enemyArrows, hpContainer)
    } else {
        enemy = new Enemy(x, y, type, deadEnemiesContainer, enemyArrows, hpContainer)
        ENEMY_POOL.add(enemy)
    }
    return enemy
}

export const TYPES = createEnum(['NORMAL', 'FAST', 'SHOOTER', 'RIDER', 'BOMB', 'TANK', 'VOODOO', 'BOSS'])
export const ENEMY_STATE = createEnum(['WALK', 'ATTACK', 'HIT', 'ICE', 'LIGHTNING', 'DIE'])

const ALPHA_STEP = 0.001
const DEAD_ALPHA_STEP = 0.002
const TOWER_OFFSET = 90
const LIGHTNING_FRAMES = 12

const BOMB_SPLASH_DAMAGE = 25

const ENEMY = {
    [TYPES.NORMAL]: {
        atlas: 'enemy_normal',
        bloodType: BLOOD_GREEN,
        screamRate: 1.6,
        hp: 40,
        speed: 0.03,
        damage: 4,
        attackTimeout: 800,
        attackStartFrameIndex: 5,
        reward: 1,
        towerOffset: TOWER_OFFSET + 30,
        bodyCollider: 24,
        headCollider: 12,
    },
    [TYPES.FAST]: {
        atlas: 'enemy_runner',
        bloodType: BLOOD_GREEN,
        screamRate: 1.8,
        hp: 20,
        speed: 0.08,
        damage: 3,
        attackTimeout: 700,
        attackStartFrameIndex: 9,
        reward: 1,
        towerOffset: TOWER_OFFSET + 12,
        bodyCollider: 20,
        headCollider: 10,
    },
    [TYPES.SHOOTER]: {
        atlas: 'enemy_shooter',
        bloodType: BLOOD_GREEN,
        screamRate: 1.2,
        hp: 50,
        speed: 0.04,
        damage: 2,
        attackTimeout: 600,
        attackStartFrameIndex: 8,
        reward: 2,
        towerOffset: TOWER_OFFSET + 100,
        bodyCollider: 20,
        headCollider: 10,
    },
    [TYPES.TANK]: {
        atlas: 'enemy_tank',
        bloodType: BLOOD_BLACK,
        screamRate: null,
        hp: 200,
        speed: 0.02,
        damage: 10,
        attackTimeout: 2000,
        attackStartFrameIndex: 0,
        reward: 5,
        towerOffset: TOWER_OFFSET + 140,
        bodyCollider: 44,
        headCollider: 0,
    },
    [TYPES.RIDER]: {
        atlas: 'enemy_rider',
        screamRate: 1,
        bloodType: BLOOD_GREEN,
        hp: 60,
        speed: 0.05,
        damage: 6,
        attackTimeout: 1500,
        attackStartFrameIndex: 6,
        reward: 3,
        towerOffset: TOWER_OFFSET + 50,
        bodyCollider: 40,
        headCollider: 0,
    },
    [TYPES.BOMB]: {
        atlas: 'enemy_bomber',
        bloodType: BLOOD_GREEN,
        screamRate: 1.4,
        hp: 30,
        speed: 0.07,
        damage: 25,
        attackTimeout: Infinity,
        attackStartFrameIndex: 0,
        reward: 1,
        towerOffset: TOWER_OFFSET + 20,
        bodyCollider: 24,
        headCollider: 12,
    },
    [TYPES.VOODOO]: {
        atlas: 'enemy_voodoo',
        bloodType: BLOOD_GREEN,
        screamRate: 1.2,
        hp: 150,
        speed: 0,
        damage: 0,
        attackTimeout: Infinity,
        attackStartFrameIndex: 0,
        reward: 3,
        towerOffset: TOWER_OFFSET + 120,
        bodyCollider: 40,
        headCollider: 20,
    },
    [TYPES.BOSS]: {
        atlas: 'enemy_boss',
        bloodType: BLOOD_GREEN,
        screamRate: 0.9,
        hp: 500,
        speed: 0.06,
        damage: 5,
        attackTimeout: 1000,
        attackStartFrameIndex: 0,
        reward: 10,
        towerOffset: TOWER_OFFSET + 64,
        bodyCollider: 50,
        headCollider: 15,
    },
}

const FAST_TURN_DISTANCE = TOWER_OFFSET + 90
const FAST_TURN_ANGLE = 50 * (Math.PI / 180)
const FAST_TURN_COUNT = 3
const FAST_TURN_MIN_TIME = 600
const FAST_TURN_MAX_TIME = 1200

class Enemy extends Container {
    constructor(x, y, type, deadEnemiesContainer, enemyArrows, hpContainer) {
        super()

        this.image = new AnimatedSprite(atlases[ENEMY[type].atlas].animations.walk)
        this.image.anchor.set(0.5)
        this.image.animationSpeed = 0.5
        this.image.loop = true
        this.addChild(this.image)

        this.colliderCircle = new Graphics()
        this.addChild(this.colliderCircle)

        this.hpBar = null

        this.reset(x, y, type, deadEnemiesContainer, enemyArrows, hpContainer)
    }

    reset(x, y, type, deadEnemiesContainer, enemyArrows, hpContainer) {
        this.type = type
        this.position.set(x, y)
        this.alpha = 0
        this.tint = null
        
        this.bloodType = ENEMY[type].bloodType
        this.screamRate = ENEMY[type].screamRate

        this.colliderCircle.clear()
        this.colliderCircle.circle(0, 0, ENEMY[type].headCollider)
        this.colliderCircle.stroke({color: 0xff0000, width: 1})
        this.colliderCircle.circle(0, 0, ENEMY[type].bodyCollider)
        this.colliderCircle.stroke({color: 0xff0000, width: 1})

        this.enemyArrows = (this.type === TYPES.SHOOTER || this.type === TYPES.TANK)
            ? enemyArrows : null

        this.atlasName = ENEMY[type].atlas
        this.deadEnemiesContainer = deadEnemiesContainer

        this.reward = ENEMY[type].reward

        this.isOnMove = true
        this.maxHp = ENEMY[type].hp
        this.hp = this.maxHp
        this.speed = ENEMY[type].speed
        this.damage = ENEMY[type].damage
        this.lightningCount = 0
        this.lightningDamage = 0
        this.bodyCollider = ENEMY[type].bodyCollider
        this.bodySqCollider = ENEMY[type].bodyCollider * ENEMY[type].bodyCollider
        this.headSqCollider = ENEMY[type].headCollider * ENEMY[type].headCollider
        this.towerOffset = ENEMY[type].towerOffset

        this.hpBar = createHpBar(x, y)
        hpContainer.addChild(this.hpBar)

        this.attackTimeout = ENEMY[type].attackTimeout
        this.isAttacking = false
        this.image.onComplete = null

        this.turnToTower()

        this.isOnTurn = false
        if (type === TYPES.FAST || type === TYPES.BOMB) {
            this.turnCount = FAST_TURN_COUNT
            this.turnTimer = FAST_TURN_MIN_TIME + Math.random() * (FAST_TURN_MAX_TIME - FAST_TURN_MIN_TIME)
        } else {
            this.turnCount = 0
            this.turnTimer = 0
        }

        this.isOnHit = false
        this.isIce = false
        this.iceTimeout = 0
        this.isDying = false

        this.state = null
        this.setState(ENEMY_STATE.WALK)
        tickerAdd(this)
    }

    setState(newState) {
        this.image.onComplete = null

        if (this.state === newState && newState !== ENEMY_STATE.ATTACK) return

        if (this.isAttacking && newState !== ENEMY_STATE.ATTACK) {
            this.isAttacking = false
            this.attackTimeout = 0
            this.image.onComplete = null
            this.image.stop()
        }

        this.state = newState

        let textures = ''
        let loop = true
        let speed = 0.5

        switch (newState) {
            case ENEMY_STATE.WALK:
                textures = 'walk'
                speed = 0.5
                loop = true
                break
            case ENEMY_STATE.ATTACK:
                textures = 'attack'
                speed = 0.7
                loop = false
                break
            case ENEMY_STATE.HIT:
                textures = 'hit'
                speed = 1
                loop = false
                break
            case ENEMY_STATE.ICE:
                textures = 'ice'
                speed = 0.1
                loop = true
                break
            case ENEMY_STATE.LIGHTNING:
                textures = 'lightning'
                speed = 0.8
                loop = true
                break
            case ENEMY_STATE.DIE:
                textures = 'die'
                speed = 0.8
                loop = false
                break
        }

        this.image.textures = atlases[this.atlasName].animations[textures]
        this.image.animationSpeed = speed
        this.image.loop = loop

        if (newState === ENEMY_STATE.ATTACK) {
            this.image.gotoAndPlay(ENEMY[this.type].attackStartFrameIndex)
        } else {
            this.image.gotoAndPlay(0)
        }
    }

    onIce(time) {
        if (this.hp === 0) return

        this.isIce = true
        this.iceTimeout = time
        this.isOnHit = false
        this.setState(ENEMY_STATE.ICE)
    }

    onLightning(power) {
        this.lightningDamage += power
        this.lightningCount = LIGHTNING_FRAMES
        this.setState(ENEMY_STATE.LIGHTNING)
    }

    setDamage(power, isRadial = false) {
        if (this.hp === 0) return

        const wasIce = this.isIce
        const finalPower = wasIce ? Math.round(power * gameState.iceFreezeDepth) : power

        this.hp = Math.max(0, this.hp - finalPower)
        this.hpBar.setLineScale(this.hp / this.maxHp)

        const bloodType = (wasIce && this.hp > 0) ? BLOOD_ICE : this.bloodType

        enemyHit({
            x: this.x,
            y: this.y,
            damage: finalPower,
            bloodType,
            isKill: this.hp === 0,
            fromAngle: isRadial ? null : Math.atan2(this.y, this.x),
        })

        if (this.hp === 0) {
            if (this.screamRate !== null) {
                soundPlay(sounds.se_scream_die.rate(this.screamRate))
            }

            this.isIce = false
            this.iceTimeout = 0
            
            this.hpBar.release()
            this.hpBar = null

            this.isDying = true
            this.isOnMove = false
            this.isOnHit = false
            this.lightningCount = 0
            this.lightningDamage = 0

            if (this.type === TYPES.BOMB || this.type === TYPES.TANK) {
                this.addExplosion(false)
                return
            }

            if (this.deadEnemiesContainer && this.parent !== this.deadEnemiesContainer) {
                if (this.parent) this.parent.removeChild(this)
                this.deadEnemiesContainer.addChild(this)
            }

            this.setState(ENEMY_STATE.DIE)
        } else {
            if (this.isIce) return

            if (this.screamRate !== null) {
                const rate = this.screamRate - 0.1 + Math.random() * 0.2
                soundPlay(sounds.se_scream_hit.rate(rate))
            }

            this.isOnHit = true
            this.setState(ENEMY_STATE.HIT)

            this.image.onComplete = () => {
                this.isOnHit = false
                this.image.onComplete = null

                if (this.isOnMove) this.setState(ENEMY_STATE.WALK)
                else this.startAttack()
            }
        }
    }

    turnToTower() {
        const angleToTower = Math.atan2(0 - this.y, 0 - this.x)
        this.directionCos = Math.cos(angleToTower)
        this.directionSin = Math.sin(angleToTower)
        this.image.rotation = angleToTower
    }

    moveForward(deltaMs) {
        const pathSize = this.speed * deltaMs
        this.x += this.directionCos * pathSize
        this.y += this.directionSin * pathSize
        this.hpBar.position.set(this.x, this.y)

        this.isOnMove = getDistance(this, {x: 0, y: 0}) > this.towerOffset
        if (!this.isOnMove) {
            if (this.type === TYPES.BOMB) {
                this.hpBar.release()
                this.addExplosion(true)
            } else {
                this.startAttack()
            }
        }
    }

    moveWithTurns(deltaMs) {
        const pathSize = this.speed * deltaMs
        this.x += this.directionCos * pathSize
        this.y += this.directionSin * pathSize
        this.hpBar.position.set(this.x, this.y)

        const distance = getDistance(this, {x: 0, y: 0})
        if (distance <= this.towerOffset) {
            this.isOnMove = false
            this.isOnTurn = false
            this.turnToTower()

            if (this.type === TYPES.BOMB) {
                this.hpBar.release()
                this.addExplosion(true)
            } else {
                this.startAttack()
            }
            
            return
        }

        if (distance < FAST_TURN_DISTANCE) {
            this.turnToTower()
            this.turnCount = 0
            this.turnTimer = 0
            return
        }

        this.turnTimer -= deltaMs
        if (this.turnTimer > 0) return

        if (this.isOnTurn) {
            this.isOnTurn = false
            this.turnCount--
            this.turnToTower()
        } else {
            this.isOnTurn = true
            const turnAngle = Math.random() < 0.5 ? FAST_TURN_ANGLE : -FAST_TURN_ANGLE
            const oldDirCos = this.directionCos
            const oldDirSin = this.directionSin
            const cos = Math.cos(turnAngle)
            const sin = Math.sin(turnAngle)
            this.directionCos = oldDirCos * cos - oldDirSin * sin
            this.directionSin = oldDirCos * sin + oldDirSin * cos
            this.image.rotation = Math.atan2(this.directionSin, this.directionCos)
        }

        this.turnTimer = FAST_TURN_MIN_TIME + Math.random() * (FAST_TURN_MAX_TIME - FAST_TURN_MIN_TIME)
    }

    startAttack() {
        this.isAttacking = true
        this.setState(ENEMY_STATE.ATTACK)

        this.image.onComplete = () => {
            if (this.enemyArrows) {
                const shieldBuild = this.type === TYPES.TANK ? createEnemyStone : createEnemyArrow
                this.enemyArrows.addChild( shieldBuild(this.x, this.y, this.damage) )
            } else {
                setDamage({value:this.damage, x: this.x, y: this.y})
            }
            this.isAttacking = false
            this.attackTimeout = ENEMY[this.type].attackTimeout
            this.image.onComplete = null
        }
    }

    attackTower(deltaMs) {
        if (this.isAttacking) return

        this.attackTimeout -= deltaMs
        if (this.attackTimeout <= 0) {
            this.startAttack()
        }
    }

    addExplosion(isTowerDamage = true) {
        const isBomb = this.type === TYPES.BOMB
    
        addExplosion({
            atlasName: 'explosion_bomb',
            x: this.x,
            y: this.y,
            radius: 128,
            frameDamage: 4,
            damage: isBomb ? BOMB_SPLASH_DAMAGE : 0,
        })
    
        if (isTowerDamage) setDamage({ value: this.damage, x: this.x, y: this.y })
    
        tickerRemove(this)
        ENEMY_POOL.put(this)
        addGoldForKill(this.reward)
    }

    die() {
        if (!this.parent) return

        tickerRemove(this)
        this.parent.removeChild(this)
        ENEMY_POOL.put(this)
        addGoldForKill(this.reward)
    }

    tick(deltaMs) {
        if (this.alpha < 1 && !this.isDying) this.alpha += ALPHA_STEP * deltaMs

        if (this.isDying) {
            if (this.image.currentFrame < this.image.totalFrames - 1) return

            this.alpha = Math.max(0, this.alpha - DEAD_ALPHA_STEP * deltaMs)
            if (this.alpha <= 0) {
                this.die()
            }
            return
        }

        if (this.isIce) {
            this.iceTimeout -= deltaMs
            if (this.iceTimeout <= 0) {
                this.isIce = false
            } else {
                this.setState(ENEMY_STATE.ICE)
                return
            }
        }

        if (this.lightningCount > 0) {
            this.lightningCount--
            if (this.lightningCount === 0) {
                this.setDamage(this.lightningDamage)
                this.lightningDamage = 0
            }
            return
        }

        if (this.isOnHit) return

        if (this.isOnMove) {
            this.setState(ENEMY_STATE.WALK)
            if (this.turnCount > 0) {
                this.moveWithTurns(deltaMs)
            } else {
                this.moveForward(deltaMs)
            }
        } else {
            this.attackTower(deltaMs)
        }
    }

    kill() {
        if (this.hpBar) {
            this.hpBar.release()
            this.hpBar = null
        }
        
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
    }
}

class VoodooEnemy extends Enemy {
    reset(x, y, type, deadEnemiesContainer, enemyArrows, hpContainer) {
        super.reset(x, y, type, deadEnemiesContainer, enemyArrows, hpContainer)

        this.isOnMove = false
        this.alpha = 0
        this.isDying = false
        this.hasHealed = false
        this.phase = 'invisible'
        this.hiddenTimeout = 2400

        this.jump()
    }

    jump() {
        const angle = Math.random() * Math.PI * 2
        this.position.set(
            Math.cos(angle) * this.towerOffset,
            Math.sin(angle) * this.towerOffset
        )
        this.hpBar.position.set(this.x, this.y)
        this.turnToTower()
    }

    spawnFX() {
        addVoodooFX({ x: this.x, y: this.y })
    }

    onIce(time) {
        if (this.hp === 0 || this.alpha <= 0) return

        super.onIce(time)
        this.alpha = 1
    }

    onLightning(power) {
        if (this.hp === 0) return
        if (this.alpha <= 0) return
        super.onLightning(power)
    }

    startAttack() {
        this.isAttacking = true
        this.setState(ENEMY_STATE.ATTACK)

        this.image.onComplete = () => {
            this.isAttacking = false
            this.image.onComplete = null
            this.phase = 'out'
            this.spawnFX()
        }
    }

    healAllies() {
        if (!this.parent) return

        const enemies = this.parent.children
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i]
            if (e === this) continue
            if (e.hp <= 0) continue

            const dx = e.x - this.x
            const dy = e.y - this.y
            if (dx * dx + dy * dy > VOODOO_HILL_RADIUS_SQ) continue

            const healValue = Math.floor(e.maxHp * VOODOO_HEAL_RATE)
            const hpBefore = e.hp
            e.hp = Math.min(e.maxHp, e.hp + healValue)
            if (e.hpBar) e.hpBar.setLineScale(e.hp / e.maxHp)

            if (e.hp > hpBefore) {   // + ДОБАВЛЕНО: спавним только если реально вылечили
                addEnemySmoke({
                    x: e.x,
                    y: e.y,
                    options: {
                        tint: 0x66ff44,
                        count: 24,         // ~ ИЗМЕНЕНО: было 12
                        spread: 40,        // ~ ИЗМЕНЕНО: было 20
                        lifeMin: 800,      // ~ ИЗМЕНЕНО: было 600
                        lifeMax: 1400,     // ~ ИЗМЕНЕНО: было 1200
                    }
                })
            }
        }
    }

    setDamage(power, isRadial = false) {
        if (this.hp === 0) return
        if (this.alpha <= 0) return

        const wasIce = this.isIce
        const finalPower = wasIce ? Math.round(power * gameState.iceFreezeDepth) : power

        this.hp = Math.max(0, this.hp - finalPower)
        this.hpBar.setLineScale(this.hp / this.maxHp)

        const bloodType = (wasIce && this.hp > 0) ? BLOOD_ICE : this.bloodType

        enemyHit({
            x: this.x,
            y: this.y,
            damage: finalPower,
            bloodType,
            isKill: this.hp === 0,
            fromAngle: isRadial ? null : Math.atan2(this.y, this.x),
        })

        if (this.hp === 0) {
            if (this.screamRate !== null) {
                soundPlay(sounds.se_scream_die.rate(this.screamRate))
            }

            this.isIce = false
            this.iceTimeout = 0
            this.isDying = true
            this.isAttacking = false
            this.image.onComplete = null
            this.lightningCount = 0
            this.lightningDamage = 0

            this.setState(ENEMY_STATE.DIE)
        } else {
            if (this.isIce) return

            if (this.screamRate !== null) {
                const rate = this.screamRate - 0.1 + Math.random() * 0.2
                soundPlay(sounds.se_scream_hit.rate(rate))
            }

            this.isOnHit = true
            this.setState(ENEMY_STATE.HIT)

            this.image.onComplete = () => {
                this.isOnHit = false
                this.image.onComplete = null
                if (this.phase === 'magic') this.startAttack()
            }
        }
    }

    die() {
        if (!this.parent) return

        if (this.hpBar) {
            this.hpBar.release()
            this.hpBar = null
        }

        tickerRemove(this)
        this.parent.removeChild(this)
        VOODOO_POOL.put(this)
        addGoldForKill(this.reward)
    }

    tick(deltaMs) {
        if (this.hpBar) this.hpBar.alpha = this.alpha

        if (this.isIce) {
            this.iceTimeout -= deltaMs
            if (this.iceTimeout <= 0) {
                this.isIce = false
                this.phase = 'out'
                this.setState(ENEMY_STATE.WALK)
            }
            return
        }

        if (this.isDying) {
            if (this.image.currentFrame < this.image.totalFrames - 1) return

            this.alpha -= VOODOO_ALPHA_STEP * deltaMs
            if (this.alpha <= 0) {
                this.alpha = 0
                this.die()
            }
            return
        }

        if (this.phase === 'invisible') {
            this.hiddenTimeout -= deltaMs
            if (this.hiddenTimeout <= 0) {
                this.jump()
                this.phase = 'in'
                this.spawnFX()
            }
            return
        }

        if (this.phase === 'in') {
            this.alpha += VOODOO_ALPHA_STEP * deltaMs
            if (this.alpha >= 1) {
                this.alpha = 1
                this.hasHealed = false
                this.phase = 'magic'
                this.startAttack()
            }
            return
        }

        if (this.phase === 'magic') {
            if (this.isIce) {
                this.iceTimeout -= deltaMs
                if (this.iceTimeout <= 0) {
                    this.isIce = false
                } else {
                    this.setState(ENEMY_STATE.ICE)
                    return
                }
            }

            if (this.lightningCount > 0) {
                this.lightningCount--
                if (this.lightningCount === 0) {
                    this.setDamage(this.lightningDamage)
                    this.lightningDamage = 0
                }
                return
            }

            if (this.isOnHit) return

            if (!this.hasHealed && this.image.currentFrame >= VOODOO_HEAL_FRAME) {
                this.hasHealed = true
                this.healAllies()
            }
            return
        }

        if (this.phase === 'out') {
            this.alpha -= VOODOO_ALPHA_STEP * deltaMs
            if (this.alpha <= 0) {
                this.alpha = 0
                this.phase = 'invisible'
                this.hiddenTimeout = 2400
            }
            return
        }
    }
}