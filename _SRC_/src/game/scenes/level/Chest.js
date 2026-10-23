import { AnimatedSprite, Container } from "pixi.js";
import { kill, tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";
import { createEnum, getRandomPointInRing } from "../../../utils/functions";

const CHECK_CHEST_TIMEOUT = 18000
const MIN_OFFSET = 200
const MAX_OFFSET = 300

const CHEST_HIT_SQ = 60 * 60

const ALPHA_STEP = 0.003
const OPEN_DELAY = 900
const STATE = createEnum(['SHOW','OPEN','HIDE'])

const chestRewards = [5, 7, 10, 5, 7, 10, 12, 5, 7, 10, 12, 15, 5, 7, 10, 12, 15, 20, 5, 7, 10, 12, 15, 20, 25]
let chestRewardIndex = Math.floor( Math.random() * chestRewards.length )
function getChestReward() {
    return chestRewards[ ++chestRewardIndex % chestRewards.length ]
}

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

    set(minOffset, maxOffset, boundHalfW, boundHalfH) {
        const point = getRandomPointInRing(minOffset, maxOffset)
        let px = point.x
        let py = point.y
        let isInside = Math.abs(px) <= boundHalfW && Math.abs(py) <= boundHalfH

        if (!isInside) {
            const angle = Math.atan2(py, px)
            px = Math.cos(angle) * minOffset
            py = Math.sin(angle) * minOffset
            isInside = Math.abs(px) <= boundHalfW && Math.abs(py) <= boundHalfH
        }

        if (!isInside) return false

        this.position.set(px, py)
        this.openDelay = OPEN_DELAY
        this.state = STATE.SHOW
        this.textures = atlases.chest.animations.open
        this.gotoAndStop(0)
        this.alpha = 0
        tickerAdd(this)
        return true
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

        // макс. половинные габариты спрайта по всем кадрам open-анимации
        let maxW = 0
        let maxH = 0
        const frames = atlases.chest.animations.open
        for (let i = 0; i < frames.length; i++) {
            if (frames[i].width > maxW) maxW = frames[i].width
            if (frames[i].height > maxH) maxH = frames[i].height
        }
        this.chestHalfW = maxW * 0.5
        this.chestHalfH = maxH * 0.5

        this.minOffset = MIN_OFFSET
        this.maxOffset = MAX_OFFSET
        this.boundHalfW = 0
        this.boundHalfH = 0
        this.canSpawn = false   // до первого screenResize

        tickerAdd(this)
    }

    screenResize(screenData, scale) {
        this.boundHalfW = screenData.width / (2 * scale) - this.chestHalfW
        this.boundHalfH = screenData.height / (2 * scale) - this.chestHalfH
        this.canSpawn = this.boundHalfW > 0 && this.boundHalfH > 0
    }

    stopSpawning() {
        this.canSpawn = false
    }

    checkShut(x, y) {
        if (this.children.length === 0) return 0

        const dx = this.chest.x - x
        const dy = this.chest.y - y
        const sqDist = dx * dx + dy * dy
        const isOnTarget = sqDist < CHEST_HIT_SQ

        let reward = 0
        if (isOnTarget) {
            this.chest.release()
            reward = getChestReward()
        }
        return reward
    }

    tick(deltaMs) {
        this.time -= deltaMs
        if (this.time > 0) return

        this.time += CHECK_CHEST_TIMEOUT
        if (this.children.length === 0 && this.canSpawn) {
            if (this.chest.set(this.minOffset, this.maxOffset, this.boundHalfW, this.boundHalfH)) {
                this.addChild(this.chest)
            }
        }
    }

    kill() {
        tickerRemove(this)
        tickerRemove(this.chest)
        kill(this.chest)
        kill(this)
    }
}