import { Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { images, sounds } from "../../../app/assets";
import { setDamage } from "../../../app/events";
import { soundPlay } from "../../../app/sound";
import { moveToTarget, turnSpriteToTarget } from "../../../utils/functions";
import { createObjectPool } from "../../../utils/pool";

const ENEMY_STONE_POOL = createObjectPool(100)

export function createEnemyStone(x, y, power) {
    let stone = ENEMY_STONE_POOL.get()
    if (stone) {
        stone.reset(x, y, power)
    } else {
        stone = new EnemyStone(x, y, power)
        ENEMY_STONE_POOL.add(stone)
    }
    return stone
}

const FORWARD_OFFSET = 48

class EnemyStone extends Sprite {
    constructor(x, y, power) {
        super(images.enemy_stone)
        this.anchor.set(1, 0.5)
        this.reset(x, y, power)
    }
  
    reset(x, y, power) {
        this.position.set(x, y)
        this.target = {x: 0, y: 0}
        this.power = power

        this.distance = Math.hypot(x, y)
        this.speed = Math.sqrt(this.distance) * 0.05

        turnSpriteToTarget(this, this.target, 360)
        const startDX = Math.cos(this.rotation)
        const startDY = Math.sin(this.rotation)
        this.position.x = this.x + startDX * FORWARD_OFFSET
        this.position.y = this.y + startDY * FORWARD_OFFSET

        tickerAdd(this)
        soundPlay(sounds.se_catapult_shoot.rate(1.3))
    }

    tick(deltaMs) {
        if( moveToTarget(this, this.target, this.speed * deltaMs) ) {
            tickerRemove(this)
            this.parent.removeChild(this)
            ENEMY_STONE_POOL.put(this)
            setDamage(this.power)
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
    }
}