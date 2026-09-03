import { Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases, images } from "../../../app/assets";
import { createObjectPool } from "../../../utils/pool";
import { MIN_SCALE_X, MIN_SCALE_Y } from "./Arrow";

const ARROW_ON_GROUND_POOL = createObjectPool(100)

export function createArrowOnGround(x, y, direction) {
    let arrowOnGround = ARROW_ON_GROUND_POOL.get()
    if (arrowOnGround) {
        arrowOnGround.reset(x, y, direction)
    } else {
        arrowOnGround = new ArrowOnGround(x, y, direction)
        ARROW_ON_GROUND_POOL.add(arrowOnGround)
    }
    return arrowOnGround
}

const ALPHA_SPEED = 0.0003

class ArrowOnGround extends Sprite {
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
            ARROW_ON_GROUND_POOL.put(this)
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
    }
}