import { AnimatedSprite, Container } from "pixi.js";
import { kill, tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";
import { createEnum, getRandomPointInRing } from "../../../utils/functions";

const CHECK_CHEST_TIMEOUT = 12000
const MIN_OFFSET = 200
const MAX_OFFSET = 300

const CHEST_HIT_SQ = 60 * 60

const ALPHA_STEP = 0.003
const OPEN_DELAY = 1200
const STATE = createEnum(['SHOW','OPEN','HIDE'])

class Chest extends AnimatedSprite {
    constructor() {
        super(atlases.chest.animations.open)
        this.anchor.set(0.5)
        this.alpha = 0
        this.loop = false
        this.animationSpeed = 0.5

        this.openDelay = OPEN_DELAY
        this.state = STATE.SHOW
    }

    set(minOffset, maxOffset) {
        const point = getRandomPointInRing(minOffset, maxOffset)
        this.position.set(point.x, point.y)
        this.openDelay = OPEN_DELAY
        this.state = STATE.SHOW
        this.textures = atlases.chest.animations.open
        this.gotoAndStop(0)
        this.alpha = 0
        tickerAdd(this)

        console.log('chest added', point.x, point.y)
    }

    release() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
    }

    awaitClose() {
        this.state = STATE.OPEN
        tickerAdd(this)
    }

    awaitHide() {
        this.state = STATE.HIDE
        tickerAdd(this)
    }

    tick(deltaMs) {
        const alphaStep = ALPHA_STEP * deltaMs
        switch(this.state) {
            case STATE.SHOW:
                this.alpha += alphaStep
                if (this.alpha >= 1) {
                    tickerRemove(this)
                    this.alpha = 1
                    this.play()
                    this.onComplete = this.awaitClose.bind(this)
                }
                break
            case STATE.OPEN:
                this.openDelay -= deltaMs
                if (this.openDelay <= 0) {
                    tickerRemove(this)
                    this.textures = atlases.chest.animations.close
                    this.gotoAndPlay(0)
                    this.onComplete = this.awaitHide.bind(this)
                }
                break
            case STATE.HIDE:
                this.alpha -= alphaStep
                if (this.alpha <= 0) this.release()
                break
        }
    }
}

export default class ChestsContainer extends Container {
    constructor() {
        super()

        this.time = CHECK_CHEST_TIMEOUT * 0.5 + Math.floor(Math.random() * CHECK_CHEST_TIMEOUT * 0.5)
        this.chest = new Chest()

        this.minOffset = MIN_OFFSET
        this.maxOffset = MAX_OFFSET

        tickerAdd(this)
    }

    checkShut(x, y) {
        if (this.children.length === 0) return false

        const dx = this.chest.x - x
        const dy = this.chest.y - y
        const sqDist = dx * dx + dy * dy
        const isOnTarget = sqDist < CHEST_HIT_SQ

        if (isOnTarget) this.chest.release()
        return isOnTarget
    }

    tick(deltaMs) {
        this.time -= deltaMs
        if (this.time > 0) return

        this.time += CHECK_CHEST_TIMEOUT
        if (this.children.length === 0) {
            this.chest.set(this.minOffset, this.maxOffset)
            this.addChild(this.chest)
        }
    }

    kill() {
        tickerRemove(this)
        tickerRemove(this.chest)
        kill(this.chest)
        kill(this)
    }
}