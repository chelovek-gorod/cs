import { Graphics } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../app/application";

const maxAlpha = 0.75
const showTime = 300
const alphaSpeed = maxAlpha / showTime

export default class Overlay extends Graphics {
    constructor( clickCallback = null ) {
        super()

        this.alpha = 0
        this.isShown = false

        this.eventMode = 'static'
        this.clickCallback = clickCallback
        this.on('pointerdown', this.getClick, this)
    }

    screenResize(screenData) {
        this.clear()
        this.rect(-screenData.centerX, -screenData.centerY, screenData.width, screenData.height)
        this.fill(0x000000)
    }

    getClick() {
        if (this.isShown && this.clickCallback) this.clickCallback()
    }

    show() {
        this.isShown = true
        tickerAdd(this)
    }

    hide() {
        this.isShown = false
        tickerAdd(this)
    }

    tick(deltaMS) {
        const alphaStep = alphaSpeed * deltaMS

        if (this.isShown) {
            this.alpha = Math.min(maxAlpha, this.alpha + alphaStep)
            if (this.alpha === maxAlpha) tickerRemove(this)
        } else {
            this.alpha = Math.max(0, this.alpha - alphaStep)
            if (this.alpha === 0) tickerRemove(this)
        }
    }

    kill() {
        this.off('pointerdown', this.getClick, this)
    }
}