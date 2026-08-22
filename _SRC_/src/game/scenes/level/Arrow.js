import { Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases, images } from "../../../app/assets";
import { arrowOnTarget } from "../../../app/events";
import { moveToTarget, turnSpriteToTarget } from "../../../utils/functions";
import { arrowSpeedRate } from "../../state";

const POOL = []

//const SPEED_RATE = arrowSpeedRate // 0.03 - normal (1s to nearest side); 0.01 - slow(3s); 0.1 - fast(0.2s)

export const MIN_SCALE_Y = 0.5
const MAX_SCALE_Y = 0.8
// по X сжимаем для ощущения полета по пораболе
export const MIN_SCALE_X = MIN_SCALE_Y * 0.5
const MAX_SCALE_X = MAX_SCALE_Y

const START_OFFSET = 20

class PrototypeArrow extends Sprite {
    constructor(x, y) {
        super(images.archer_arrow)
        this.anchor.set(1, 0.5)
        this.reset(x, y)

        this.arrowPoint = new Sprite(images.arrow_point)
        this.arrowPoint.anchor.set(0.5)
    }
  
    reset(x, y) {
        this.position.set(0, 0)
        this.target = {x, y}

        this.path = 0
        this.distance = Math.hypot(x, y)
        this.speed = Math.sqrt(this.distance) * arrowSpeedRate

        turnSpriteToTarget(this, {x, y}, 360)
        this.position.x += Math.cos(this.rotation) * START_OFFSET
        this.position.y += Math.sin(this.rotation) * START_OFFSET

        tickerAdd(this)
    }

    tick(deltaMs) {
        const path = this.speed * deltaMs
        this.path = Math.min(this.distance, this.path + path)
        const progress = this.path / this.distance

        const scaleRate = Math.sin(progress * Math.PI)
        const scaleX = MIN_SCALE_X + (MAX_SCALE_X - MIN_SCALE_X) * scaleRate
        const scaleY = MIN_SCALE_Y + (MAX_SCALE_Y - MIN_SCALE_Y) * scaleRate
        this.scale.set(scaleX, scaleY)

        if( moveToTarget(this, this.target, this.speed * deltaMs) ) {
            arrowOnTarget({x: this.target.x, y: this.target.y, direction: this.rotation})
            tickerRemove(this)
            this.parent.removeChild(this)
            this.arrowPoint.parent.removeChild(this.arrowPoint)
            POOL.push(this)
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        if (this.arrowPoint.parent) this.arrowPoint.parent.removeChild(this.arrowPoint)
        POOL.push(this)
        POOL.length = 0
    }
}

// Экспортируем прокси, который перехватывает вызов 'new'
export const Arrow = new Proxy(PrototypeArrow, {
    construct(target, args) {
        if (POOL.length > 0) {
            const reused = POOL.pop()
            reused.reset(...args)
            return reused
        }

        return new target(...args)
    }
})