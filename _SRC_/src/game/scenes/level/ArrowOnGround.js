import { Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases, images } from "../../../app/assets";
import { MIN_SCALE_X, MIN_SCALE_Y } from "./Arrow";

const POOL = []

const ALPHA_SPEED = 0.0003

class PrototypeArrowOnGround extends Sprite {
    constructor(x, y, direction) {
        super(images.archer_arrow)
        this.anchor.set(1, 0.5)
        this.scale.set(MIN_SCALE_X, MIN_SCALE_Y)
        this.reset(x, y, direction)
    }
  
    reset(x, y, direction) {
        this.position.set(x, y)
        this.rotation = direction
        this.alpha = 1

        tickerAdd(this)
    }

    tick(deltaMs) {
        this.alpha -= ALPHA_SPEED * deltaMs

        if( this.alpha <= 0 ) {
            tickerRemove(this)
            this.parent.removeChild(this)
            POOL.push(this)
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        POOL.push(this)
        POOL.length = 0
    }
}

// Экспортируем прокси, который перехватывает вызов 'new'
export const ArrowOnGround = new Proxy(PrototypeArrowOnGround, {
    construct(target, args) {
        if (POOL.length > 0) {
            const reused = POOL.pop()
            if (reused.position) {
                reused.reset(...args)
                return reused
            }
            // если объект уничтожен, создаём новый
        }
        return new target(...args)
    }
})