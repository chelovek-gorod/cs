import { Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { images, sounds } from "../../../app/assets";
import { arrowOnTarget, trailEmit } from "../../../app/events";
import { soundPlay } from "../../../app/sound";
import { moveToTarget, turnSpriteToTarget } from "../../../utils/functions";
import { createObjectPool } from "../../../utils/pool";
import { gameState } from "../../state";

const ARROW_POOL = createObjectPool(100)

const TRAIL_SPACING = 6
const ICE_TRAIL = [
    { speedMul: 0.8, tint: 0x00ffff, scale: 0.18, alphaStart: 0.6, alphaDecay: 0.004 },   // + ДОБАВЛЕНО: голубое свечение
    { speedMul: 1.2, tint: 0xffffff, scale: 0.10, alphaStart: 0.9, alphaDecay: 0.003 },   // ~ ИЗМЕНЕНО: белое ядро
]
const RAGE_TRAIL = [
    { speedMul: 0.8, tint: 0xff0000, scale: 0.18, alphaStart: 0.6, alphaDecay: 0.004 },   // ~ ИЗМЕНЕНО: оранжевое свечение
    { speedMul: 1.2, tint: 0xffff00, scale: 0.10, alphaStart: 0.9, alphaDecay: 0.003 },   // ~ ИЗМЕНЕНО: жёлтое ядро
]

export function createArrow(x, y, isRage = false, isIce = false) {
    let arrow = ARROW_POOL.get()
    if (arrow) {
        arrow.reset(x, y, isRage, isIce)
    } else {
        arrow = new Arrow(x, y, isRage, isIce)
        ARROW_POOL.add(arrow)
    }
    return arrow
}

//const SPEED_RATE = arrowSpeedRate // 0.03 - normal (1s to nearest side); 0.01 - slow(3s); 0.1 - fast(0.2s)

export const MIN_SCALE_Y = 0.4
const MAX_SCALE_Y = 0.7
// по X сжимаем для ощущения полета по пораболе
export const MIN_SCALE_X = MIN_SCALE_Y * 0.5
const MAX_SCALE_X = MAX_SCALE_Y

const START_OFFSET = 20

class Arrow extends Sprite {
    constructor(x, y, isRage, isIce) {
        super(images.archer_arrow)
        this.anchor.set(1, 0.5)
        this.reset(x, y, isRage, isIce)

        this.arrowPoint = new Sprite(images.arrow_point)
        this.arrowPoint.anchor.set(0.5)
    }
  
    reset(x, y, isRage, isIce) {
        this.position.set(0, 0)
        this.target = {x, y}

        this.isRage = isRage
        this.isIce = isIce

        this.path = 0
        this.distance = Math.hypot(x, y)
        this.speed = Math.sqrt(this.distance) * gameState.arrowFlyRate

        turnSpriteToTarget(this, {x, y}, 360)
        this.position.x += Math.cos(this.rotation) * START_OFFSET
        this.position.y += Math.sin(this.rotation) * START_OFFSET

        this.trailAccumulator = 0
        this.trailConfigs = this.isIce ? ICE_TRAIL : this.isRage ? RAGE_TRAIL : null

        if (this.trailConfigs) {
            const cos = Math.cos(this.rotation)
            const sin = Math.sin(this.rotation)
            this.backOffsetX = -cos * 12
            this.backOffsetY = -sin * 12
            this.trailVxBase = -cos * 0.08
            this.trailVyBase = -sin * 0.08
        }

        tickerAdd(this)
        soundPlay(sounds.se_arrow.rate(1.0))
    }

    emitTrail() {
        const bx = this.x + this.backOffsetX
        const by = this.y + this.backOffsetY
        const configs = this.trailConfigs
        const perpX = -Math.sin(this.rotation)
        const perpY = Math.cos(this.rotation)
        const isChaos = Math.random() < 0.10   // + ДОБАВЛЕНО
    
        for (let i = 0; i < configs.length; i++) {
            const c = configs[i]
            const spread = isChaos
                ? (Math.random() - 0.5) * 0.30   // + ДОБАВЛЕНО: хаос редко, но широко
                : (Math.random() - 0.5) * 0.04   // + ДОБАВЛЕНО: обычно узко
            trailEmit({
                x: bx, y: by,
                vx: this.trailVxBase * c.speedMul + perpX * spread,
                vy: this.trailVyBase * c.speedMul + perpY * spread,
                tint: c.tint,
                scale: c.scale,
                alphaStart: c.alphaStart,
                alphaDecay: c.alphaDecay,
            })
        }
    }

    tick(deltaMs) {
        const path = this.speed * deltaMs
        this.path = Math.min(this.distance, this.path + path)
        const progress = this.path / this.distance

        if (this.isIce || this.isRage) {
            this.trailAccumulator += path
            while (this.trailAccumulator >= TRAIL_SPACING) {
                this.trailAccumulator -= TRAIL_SPACING
                this.emitTrail()
            }
        }
        
        const scaleRate = Math.sin(progress * Math.PI)
        const scaleX = MIN_SCALE_X + (MAX_SCALE_X - MIN_SCALE_X) * scaleRate
        const scaleY = MIN_SCALE_Y + (MAX_SCALE_Y - MIN_SCALE_Y) * scaleRate
        this.scale.set(scaleX, scaleY)

        if( moveToTarget(this, this.target, this.speed * deltaMs) ) {
            arrowOnTarget({
                x: this.target.x,
                y: this.target.y,
                direction: this.rotation,
                isRage: this.isRage,
                isIce: this.isIce,
            })
            tickerRemove(this)
            this.parent.removeChild(this)
            this.arrowPoint.parent.removeChild(this.arrowPoint)
            ARROW_POOL.put(this)
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        if (this.arrowPoint.parent) this.arrowPoint.parent.removeChild(this.arrowPoint)
    }
}