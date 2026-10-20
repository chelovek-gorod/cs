import { Container, Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { images, sounds } from "../../../app/assets";
import { soundPlay } from "../../../app/sound";
import { moveToTarget, turnSpriteToTarget } from "../../../utils/functions";
import { createObjectPool } from "../../../utils/pool";
import { gameState } from "../../state";
import { addExplosion } from '../../../app/events'

const STONE_POOL = createObjectPool(100)

export function createStone(x, y, targetX, targetY, enemies, smoke) {
    let stone = STONE_POOL.get()
    if (stone) {
        stone.reset(x, y, targetX, targetY, enemies, smoke)
    } else {
        stone = new Stone(x, y, targetX, targetY, enemies, smoke)
        STONE_POOL.add(stone)
    }
    return stone
}

//const SPEED_RATE = arrowSpeedRate // 0.03 - normal (1s to nearest side); 0.01 - slow(3s); 0.1 - fast(0.2s)

const MIN_SCALE = 0.36
const MAX_SCALE = 1
const MID_SCALE = MAX_SCALE - MIN_SCALE
const START_OFFSET = -24

class Stone extends Container {
    constructor(x, y, targetX, targetY, enemies, smoke) {
        super()

        this.image = new Sprite(images.stone)
        this.image.anchor.set(0.5)
        this.addChild(this.image)

        this.speed = 0.24
        this.turnSpeed = 0.006

        this.reset(x, y, targetX, targetY, enemies, smoke)
    }
  
    reset(x, y, targetX, targetY, enemies, smoke) {
        this.position.set(x, y)
        this.target = {x: targetX, y: targetY}

        this.enemies = enemies
        this.smoke = smoke
        this.isSmokeFrame = false

        this.path = 0
        const dx = x - targetX
        const dy = y - targetY
        this.distance = Math.hypot(dx, dy)

        turnSpriteToTarget(this, this.target, 360)
        this.position.x += Math.cos(this.rotation) * START_OFFSET
        this.position.y += Math.sin(this.rotation) * START_OFFSET

        tickerAdd(this)
        soundPlay(sounds.se_catapult_shoot.rate(1.0))
    }

    setDamage() {
        addExplosion({
            atlasName: 'explosion_stone',
            x: this.x,
            y: this.y,
            radius: gameState.catapultRadius,
            frameDamage: 4,
            damage: gameState.catapultPower,
        })
    
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        STONE_POOL.put(this)
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

        this.isSmokeFrame = !this.isSmokeFrame
        if (this.isSmokeFrame) {
            this.smoke.spawn(this.x, this.y, {
                tint: 0x888888,
                count: 8,
                spread: 18,
                lifeMin: 800,
                lifeMax: 1600,
            })
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
    }
}