import { Container, Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases, images, sounds } from "../../../app/assets";
import { soundPlay } from "../../../app/sound";
import { moveToTarget, turnSpriteToTarget } from "../../../utils/functions";
import Explosion from "../../effects/Explosion";
import { catapultDamageRadius, catapultPower } from "../../state";

const POOL = []

//const SPEED_RATE = arrowSpeedRate // 0.03 - normal (1s to nearest side); 0.01 - slow(3s); 0.1 - fast(0.2s)

const MIN_SCALE = 0.36
const MAX_SCALE = 1
const MID_SCALE = MAX_SCALE - MIN_SCALE
const START_OFFSET = -24

class PrototypeStone extends Container {
    constructor(x, y, targetX, targetY, particles, enemies) {
        super()

        this.image = new Sprite(images.stone)
        this.image.anchor.set(0.5)
        this.addChild(this.image)

        this.particles = particles
        this.enemies = enemies

        this.speed = 0.24
        this.turnSpeed = 0.006

        this.reset(x, y, targetX, targetY)
    }
  
    reset(x, y, targetX, targetY) {
        this.position.set(x, y)
        this.target = {x: targetX, y: targetY}

        this.path = 0
        const dx = x - targetX
        const dy = y - targetY
        this.distance = Math.hypot(dx, dy)

        turnSpriteToTarget(this, this.target, 360)
        this.position.x += Math.cos(this.rotation) * START_OFFSET
        this.position.y += Math.sin(this.rotation) * START_OFFSET

        tickerAdd(this)
        soundPlay(sounds.se_catapult_shut)
    }

    setDamage() {
        this.parent.addChild( new Explosion(this.x, this.y, catapultDamageRadius) )
        
        const enemies = this.enemies.children
        const enemiesCount = enemies.length
        const dmgSqRadius = catapultDamageRadius * catapultDamageRadius
        
        for (let i = 0; i < enemiesCount; i++) {
            const enemy = enemies[i]
            const dx = enemy.x - this.x
            const dy = enemy.y - this.y
            const sqDist = dx * dx + dy * dy
            const inRadius = dmgSqRadius + enemy.bodySqCollider > sqDist

            if (inRadius && enemy.hp > 0) enemy.setDamage(catapultPower)
        }

        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        POOL.push(this)
    }

    tick(deltaMs) {
        this.image.rotation += this.turnSpeed * deltaMs

        const path = this.speed * deltaMs
        this.path = Math.min(this.distance, this.path + path)
        const progress = this.path / this.distance

        const scaleRate = Math.sin(progress * Math.PI)
        const scale = MIN_SCALE + MID_SCALE * scaleRate
        this.scale.set(scale)

        if( moveToTarget(this, this.target, this.speed * deltaMs) ) {
            this.setDamage()
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        POOL.push(this)
    }
}

// Экспортируем прокси, который перехватывает вызов 'new'
export const Stone = new Proxy(PrototypeStone, {
    construct(target, args) {
        if (POOL.length > 0) {
            const reused = POOL.pop()
            reused.reset(...args)
            return reused
        }

        return new target(...args)
    }
})