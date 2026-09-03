import { Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { images, sounds } from "../../../app/assets";
import { setDamage } from "../../../app/events";
import { soundPlay } from "../../../app/sound";
import { moveToTarget, turnSpriteToTarget } from "../../../utils/functions";
import { createObjectPool } from "../../../utils/pool";

const ENEMY_ARROW_POOL = createObjectPool(100)

export function createEnemyArrow(x, y, power) {
    let arrow = ENEMY_ARROW_POOL.get()
    if (arrow) {
        arrow.reset(x, y, power)
    } else {
        arrow = new EnemyArrow(x, y, power)
        ENEMY_ARROW_POOL.add(arrow)
    }
    return arrow
}

const FORWARD_OFFSET = 48
const SIDE_OFFSET = 4

class EnemyArrow extends Sprite {
    constructor(x, y, power) {
        super(images.enemy_arrow)
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
        this.position.x = this.x + startDX * FORWARD_OFFSET - startDY * SIDE_OFFSET
        this.position.y = this.y + startDY * FORWARD_OFFSET + startDX * SIDE_OFFSET

        tickerAdd(this)
        soundPlay(sounds.se_arrow)
    }

    tick(deltaMs) {
        if( moveToTarget(this, this.target, this.speed * deltaMs) ) {
            tickerRemove(this)
            this.parent.removeChild(this)
            ENEMY_ARROW_POOL.put(this)
            setDamage(this.power)
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
    }
}