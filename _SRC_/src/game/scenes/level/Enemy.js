import { Container, AnimatedSprite, Sprite } from "pixi.js"
import { tickerAdd, tickerRemove } from "../../../app/application"
import { atlases, images } from "../../../app/assets"
import { addGoldForKill, setDamage } from "../../../app/events"
import { createEnum, getDistance } from "../../../utils/functions"
import { EnemyArrow } from "./EnemyArrow"

const POOL = []

export function clearEnemyPool() {
    while (POOL.length > 0) {
        const enemy = POOL.pop()
        enemy.destroy({children: true})
    }
}

export const TYPES = createEnum(['NORMAL', 'FAST', 'SHOOTER', 'BOMB', 'TANK', 'BOSS'])
export const ENEMY_STATE = createEnum(['WALK', 'ATTACK', 'HIT', 'ICE', 'LIGHTNING', 'DIE'])

const ALPHA_STEP = 0.001
const DEAD_ALPHA_STEP = 0.002
const TOWER_OFFSET = 96
const LIGHTNING_FRAMES = 12

const ENEMY = {
    [TYPES.NORMAL]: {
        atlas: 'enemy_other',
        hp: 50,
        speed: 0.03,
        damage: 3,
        attackTimeout: 1000, // время атаки = attackTimeout + длительность анимации атаки
        attackStartFrameIndex: 7,
        scale: 0.8,
        towerOffset: TOWER_OFFSET + Math.ceil(86 * 0.8),
        bodyCollider: Math.ceil(64 * 0.8),
        headCollider: Math.ceil(24 * 0.8),
        tint: 0x6666ff
    },
    [TYPES.FAST]: {
        atlas: 'enemy_runner',
        hp: 25,
        speed: 0.06,
        damage: 1,
        attackTimeout: 500,
        attackStartFrameIndex: 7,
        scale: 1,
        towerOffset: TOWER_OFFSET + 48,
        bodyCollider: 24,
        headCollider: 12,
        tint: 0xffffff
    },
    [TYPES.SHOOTER]: {
        atlas: 'enemy_shooter',
        hp: 50,
        speed: 0.04,
        damage: 2,
        attackTimeout: 1500,
        attackStartFrameIndex: 8,
        scale: 1,
        towerOffset: TOWER_OFFSET + 150,
        bodyCollider: 24,
        headCollider: 12,
        tint: 0xffffff
    },
    [TYPES.TANK]: {
        atlas: 'enemy_other',
        hp: 150,
        speed: 0.03,
        damage: 5,
        attackTimeout: 1500,
        attackStartFrameIndex: 7,
        scale: 1.2,
        towerOffset: TOWER_OFFSET + Math.ceil(86 * 1.2),
        bodyCollider: Math.ceil(64 * 1.2),
        headCollider: Math.ceil(24 * 1.2),
        tint: 0xffff66
    },
    [TYPES.BOMB]: {
        atlas: 'enemy_other',
        hp: 40,
        speed: 0.05,
        damage: 25,
        attackTimeout: Infinity,
        attackStartFrameIndex: 0,
        scale: 1,
        towerOffset: TOWER_OFFSET + Math.ceil(86 * 1),
        bodyCollider: Math.ceil(64 * 1),
        headCollider: Math.ceil(24 * 1),
        tint: 0xff6666
    },
    [TYPES.BOSS]: {
        atlas: 'enemy_other',
        hp: 500,
        speed: 0.02,
        damage: 10,
        attackTimeout: 750,
        attackStartFrameIndex: 7,
        scale: 2,
        towerOffset: TOWER_OFFSET + Math.ceil(86 * 2),
        bodyCollider: Math.ceil(64 * 2),
        headCollider: Math.ceil(24 * 2),
        tint: 0xff66ff
    },
}

const FAST_TURN_DISTANCE = 240
const FAST_TURN_ANGLE = 60 * (Math.PI / 180)
const FAST_TURN_COUNT = 3
const FAST_TURN_MIN_TIME = 900
const FAST_TURN_MAX_TIME = 1800

class PrototypeEnemy extends Container {
    constructor(x, y, type, deadEnemiesContainer, enemyArrows) {
        super()

        this.image = new AnimatedSprite(atlases[ENEMY[type].atlas].animations.walk)
        this.image.anchor.set(0.5)
        this.image.animationSpeed = 0.5
        this.image.loop = true
        this.addChild(this.image)

        this.hpBar = new Container()
        this.addChild(this.hpBar)
        this.hpBg = new Sprite(images.hp_bar_bg)
        this.hpBg.position.set(-28, -64 * ENEMY[type].scale)
        this.hpBar.addChild(this.hpBg)
        this.hpLine = new Sprite(images.hp_bar_line)
        this.hpLine.position.set(-25, -64 * ENEMY[type].scale + 2)
        this.hpBar.addChild(this.hpLine)

        this.reset(x, y, type, deadEnemiesContainer, enemyArrows)
    }

    reset(x, y, type, deadEnemiesContainer, enemyArrows) {
        this.type = type
        this.position.set(x, y)
        this.alpha = 0

        this.enemyArrows = this.type === TYPES.SHOOTER ? enemyArrows : null

        this.atlasName = ENEMY[type].atlas
        this.deadEnemiesContainer = deadEnemiesContainer

        this.isOnMove = true
        this.maxHp = ENEMY[type].hp
        this.hp = this.maxHp
        this.speed = ENEMY[type].speed
        this.damage = ENEMY[type].damage
        this.image.tint = ENEMY[type].tint
        this.image.scale.set(ENEMY[type].scale)
        this.lightningCount = 0
        this.lightningDamage = 0
        this.bodySqCollider = ENEMY[type].bodyCollider * ENEMY[type].bodyCollider
        this.headSqCollider = ENEMY[type].headCollider * ENEMY[type].headCollider
        this.towerOffset = ENEMY[type].towerOffset

        this.hpLine.tint = 0x00ff00
        this.hpLine.scale.x = 1
        this.hpBg.position.set(-28, -64 * ENEMY[type].scale)
        this.hpLine.position.set(-25, -64 * ENEMY[type].scale + 2)

        this.attackTimeout = ENEMY[type].attackTimeout
        this.isAttacking = false
        this.image.onComplete = null

        this.turnToTower()

        this.isOnTurn = false
        if (type === TYPES.FAST) {
            this.turnCount = FAST_TURN_COUNT
            this.turnTimer = FAST_TURN_MIN_TIME + Math.random() * (FAST_TURN_MAX_TIME - FAST_TURN_MIN_TIME)
        } else {
            this.turnCount = 0
            this.turnTimer = 0
        }

        this.isOnHit = false
        this.isIce = false
        this.iceTimeout = 0
        this.hitTimer = 0
        this.isDying = false

        this.setState(ENEMY_STATE.WALK)
        tickerAdd(this)
    }

    setState(newState) {
        // Для ATTACK разрешаем повторный вызов, чтобы перезапускать анимацию
        if (this.state === newState && newState !== ENEMY_STATE.ATTACK) return

        // Прерывание атаки при переходе в другое состояние
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

    onLightning(power) {
        this.lightningDamage += power
        this.lightningCount = LIGHTNING_FRAMES
        this.setState(ENEMY_STATE.LIGHTNING)
    }

    setDamage(power) {
        if (this.hp === 0) return

        this.hp = Math.max(0, this.hp - power)

        this.hpLine.scale.x = this.hp / this.maxHp
        if (this.hpLine.scale.x > 0.4) this.hpLine.tint = 0x00ff00
        else if (this.hpLine.scale.x > 0.25) this.hpLine.tint = 0xffff00
        else if (this.hpLine.scale.x > 0.12) this.hpLine.tint = 0xff7700
        else this.hpLine.tint = 0xff0000

        if (this.hp === 0) {
            this.isDying = true
            this.isOnMove = false
            this.isOnHit = false
            this.isIce = false
            this.lightningCount = 0
            this.lightningDamage = 0

            if (this.deadEnemiesContainer && this.parent !== this.deadEnemiesContainer) {
                if (this.parent) this.parent.removeChild(this)
                this.deadEnemiesContainer.addChild(this)
            }

            this.setState(ENEMY_STATE.DIE)
        } else {
            this.isOnHit = true
            this.hitTimer = 300
            this.setState(ENEMY_STATE.HIT)
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

        this.isOnMove = getDistance(this, {x: 0, y: 0}) > this.towerOffset
        if (!this.isOnMove) {
            if (this.type === TYPES.BOMB) {
                setDamage(this.damage)
                this.isDying = true
            } else {
                this.startAttack()
            }
        }
    }

    moveWithTurns(deltaMs) {
        const pathSize = this.speed * deltaMs
        this.x += this.directionCos * pathSize
        this.y += this.directionSin * pathSize

        const distance = getDistance(this, {x: 0, y: 0})
        if (distance <= this.towerOffset) {
            this.isOnMove = false
            this.isOnTurn = false
            this.turnToTower()

            if (this.type === TYPES.BOMB) {
                setDamage(this.damage)
                this.isDying = true
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
                this.enemyArrows.addChild( new EnemyArrow(this.x, this.y, this.damage) )
            } else {
                setDamage(this.damage)
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

    die() {
        if (!this.parent) return
        tickerRemove(this)
        this.parent.removeChild(this)
        POOL.push(this)
        addGoldForKill(this.type === TYPES.BOSS ? 5 : 1)
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

        if (this.isOnHit) {
            this.hitTimer -= deltaMs
            if (this.hitTimer > 0) {
                this.setState(ENEMY_STATE.HIT)
                return
            }
            this.isOnHit = false
        }

        if (this.isOnMove) {
            this.setState(ENEMY_STATE.WALK)
            if (this.type === TYPES.FAST && this.turnCount > 0) {
                this.moveWithTurns(deltaMs)
            } else {
                this.moveForward(deltaMs)
            }
        } else {
            this.attackTower(deltaMs)
        }
    }
}

export const Enemy = new Proxy(PrototypeEnemy, {
    construct(target, args) {
        if (POOL.length > 0) {
            const reused = POOL.pop()
            if (reused.position) {
                reused.reset(...args)
                return reused
            }
        }
        return new target(...args)
    }
})