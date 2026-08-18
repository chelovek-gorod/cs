import { Sprite } from "pixi.js"
import { atlases, sounds } from "../../app/assets"
import { removeCursorPointer, setCursorPointer } from "../../utils/functions"
import { styles } from "../../app/styles"
import { soundPlay } from "../../app/sound"
import { tickerAdd, tickerRemove } from "../../app/application"

const MIN_SCALE = 0.5
const MAX_SCALE = 0.56
const SCALE_DURATION = 1200
const SCALE_STEP = 1 / SCALE_DURATION

export default class TapIcon extends Sprite {
    constructor(icon, callback, isActive = true ) {
        super(icon)

        this.callback = callback

        this.isOnHover = false
        
        setCursorPointer(this)
        this.on('pointerdown', this.click, this)
        this.on('pointerover', this.onHover, this)
        this.on('pointerout', this.onOut, this)

        this.isActive = isActive
        this.setActive(this.isActive)

        this.scale.set(MIN_SCALE)
    }

    setActive(isActive = true) {
        this.isActive = isActive
        if (this.isActive) this.alpha = 1
        else this.alpha = 0.5
    }

    setIcon( icon ) {
        this.texture = icon
    }

    click() {
        if (!this.isActive) return

        setTimeout( () => soundPlay(sounds.se_click), 1 )
        this.callback()
    }

    onHover() {
        if (!this.isActive || this.isOnHover) return

        this.isOnHover = true
        soundPlay(sounds.se_hover)
        tickerAdd(this)
    }
    onOut() {
        if (!this.isOnHover) return

        this.isOnHover = false
        tickerAdd(this)
    }

    deactivate() {
        this.off('pointerdown', this.click, this)
        this.off('pointerover', this.onHover, this)
        this.off('pointerout', this.onOut, this)
        this.isOnHover = false
    }

    tick(deltaMs) {
        if (this.isOnHover) {
            this.scale.set( Math.min(MAX_SCALE, this.scale.x + SCALE_STEP * deltaMs) )
            if (this.scale.x === MAX_SCALE) tickerRemove(this)
        } else {
            this.scale.set( Math.max(MIN_SCALE, this.scale.x - SCALE_STEP * deltaMs) )
            if (this.scale.x === MIN_SCALE) tickerRemove(this)
        }
    }

    kill() {
        removeCursorPointer(this)
        this.deactivate()
    }
}