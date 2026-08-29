import { Container, Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { images } from "../../../app/assets";
import { addGoldForKill, setDamage } from "../../../app/events";
import { createEnum, getDistance } from "../../../utils/functions";

const POOL = []

export const TYPES = createEnum(['NORMAL', 'FAST', 'BOMB', 'TANK', 'BOSS'])

const ALPHA_STEP = 0.001

const TOWER_OFFSET = 96

const ENEMY = {
    [TYPES.NORMAL] : {
        hp: 50,
        speed: 0.03,
        damage: 3,
        scale: 1,
        towerOffset: TOWER_OFFSET + 28,
        bodyCollider: 28,
        headCollider: 10,
        tint: 0x0000ff
    },
    [TYPES.FAST] : {
        hp: 25,
        speed: 0.05,
        damage: 2,
        scale: 0.8,
        towerOffset: TOWER_OFFSET + 23,
        bodyCollider: 23,
        headCollider: 8,
        tint: 0x00ffff
    },
    [TYPES.TANK] : {
        hp: 150,
        speed: 0.02,
        damage: 5,
        scale: 2,
        towerOffset: TOWER_OFFSET + 56,
        bodyCollider: 56,
        headCollider: 20,
        tint: 0xffff00
    },
    [TYPES.BOMB] : {
        hp: 40,
        speed: 0.04,
        damage: 10,
        scale: 1.2,
        towerOffset: TOWER_OFFSET + 34,
        bodyCollider: 34,
        headCollider: 12,
        tint: 0xff0000
    },
    [TYPES.BOSS] : {
        hp: 500,
        speed: 0.015,
        damage: 10,
        scale: 3,
        towerOffset: TOWER_OFFSET + 84,
        bodyCollider: 84,
        headCollider: 30,
        tint: 0xff00ff
    },
}

const FAST_TURN_DISTANCE = 240       // минимальное расстояние до башни для возможности поворота
const FAST_TURN_ANGLE = 60 * (Math.PI / 180)
const FAST_TURN_COUNT = 3            // максимум поворотов за жизнь
const FAST_TURN_MIN_TIME = 900       // мин. время движения в новом направлении, мс
const FAST_TURN_MAX_TIME = 1800      // макс. время движения в новом направлении, мс

class PrototypeEnemy extends Container {
    constructor(x, y, type) {
        super()

        this.image = new Sprite(images.enemy)
        this.image.anchor.set(0.5)
        this.addChild(this.image)

        this.hpBar = new Container()
        this.addChild(this.hpBar)
        this.hpBg = new Sprite(images.hp_bar_bg)
        this.hpBg.position.set(-28, -64 * ENEMY[type].scale)
        this.hpBar.addChild(this.hpBg)
        this.hpLine = new Sprite(images.hp_bar_line)
        this.hpLine.position.set(-25, -64 * ENEMY[type].scale + 2)
        this.hpBar.addChild(this.hpLine)

        this.reset(x, y, type)
    }
  
    reset(x, y, type) {
        this.type = type
        this.position.set(x, y)
        this.alpha = 0

        this.isOnMove = true
        this.maxHp = ENEMY[type].hp
        this.hp = this.maxHp
        this.speed = ENEMY[type].speed
        this.damage = ENEMY[type].damage
        this.image.tint = ENEMY[type].tint
        this.image.scale.set( ENEMY[type].scale )
        this.lightningCount = 0
        this.lightningDamage = 0
        this.bodySqCollider = ENEMY[type].bodyCollider * ENEMY[type].bodyCollider
        this.headSqCollider = ENEMY[type].headCollider * ENEMY[type].headCollider
        this.towerOffset = ENEMY[type].towerOffset

        this.hpLine.tint = 0x00ff00
        this.hpLine.scale.x = 1
        this.hpBg.position.set(-28, -64 * ENEMY[type].scale)
        this.hpLine.position.set(-25, -64 * ENEMY[type].scale + 2)

        this.attackTimeout = 1000

        this.turnToTower()

        this.isOnTurn = false
        if (type === TYPES.FAST) {
            this.turnCount = FAST_TURN_COUNT
            this.turnTimer = FAST_TURN_MIN_TIME + Math.random() * (FAST_TURN_MAX_TIME - FAST_TURN_MIN_TIME)
        } else {
            this.turnCount = 0
            this.turnTimer = 0
        }

        tickerAdd(this)
    }

    onLightning(power) {
        this.image.tint = 0x000000
        this.lightningCount = 6
        this.lightningDamage += power
    }

    setDamage(power) {
        if (this.hp === 0) return

        this.hp = Math.max(0, this.hp - power)

        this.hpLine.scale.x = this.hp / this.maxHp
        if (this.hpLine.scale.x > 0.4) this.hpLine.tint = 0x00ff00
        else if (this.hpLine.scale.x > 0.25) this.hpLine.tint = 0xffff00
        else if (this.hpLine.scale.x > 0.12) this.hpLine.tint = 0xff7700
        else this.hpLine.tint = 0xff0000

        if (this.hp === 0) requestAnimationFrame( this.die.bind(this) )
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
            setDamage(this.damage)
            if (this.type === TYPES.BOMB) this.die()
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

            setDamage(this.damage)
            if (this.type === TYPES.BOMB) this.die()
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

    attackTower(deltaMs) {
        this.attackTimeout -= deltaMs
        if (this.attackTimeout <= 0) {
            this.attackTimeout += 1000
            setDamage(this.damage)
        }
    }

    die() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        POOL.push(this)
        addGoldForKill( this.type === TYPES.BOSS ? 5 : 1 )
    }

    tick(deltaMs) {
        if (this.alpha < 1) this.alpha += ALPHA_STEP * deltaMs

        if (this.lightningCount > 0) {
            this.lightningCount--
            if (this.lightningCount % 2 === 0) this.image.tint = ENEMY[this.type].tint
            else this.image.tint = 0x000000

            if (this.lightningCount === 0) {
                this.setDamage(this.lightningDamage)
                this.lightningDamage = 0
            }
            return
        }

        if (this.isOnMove) {
            if (this.type === TYPES.FAST && this.turnCount > 0) this.moveWithTurns(deltaMs)
            else this.moveForward(deltaMs)
        } else {
            this.attackTower(deltaMs)
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        POOL.push(this)
    }
}

// Экспортируем прокси, который перехватывает вызов 'new'
export const Enemy = new Proxy(PrototypeEnemy, {
    construct(target, args) {
        if (POOL.length > 0) {
            const reused = POOL.pop()
            reused.reset(...args)
            return reused
        }

        return new target(...args)
    }
})