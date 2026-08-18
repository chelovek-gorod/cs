import { Sprite, Container } from "pixi.js"
import { atlases, sounds } from "../../app/assets"
import { createEnum, removeCursorPointer, setCursorPointer } from "../../utils/functions"
import { soundPlay } from "../../app/sound"
import { tickerAdd, tickerRemove } from "../../app/application"
import { renderPlayer } from "./renderPlayer"
import { isSaveAdAvailable, isSaveCoinsAvailable } from "../state"

export const FLASH_TYPE = createEnum([
    'RESULTS', 'SKIN', 'BUY_SAVE', 'WHEEL', 'SHOP', 'AD_SAVE'
])

const SCALE_UP_RATE = 1.06
const SCALE_DURATION = 120
const SCALE_STEP = (SCALE_UP_RATE - 1) / SCALE_DURATION
const MAX_X = 900

export default class FlashButton extends Container {
    constructor(type, callback, flashRateX = 0.5) {
        super()

        const icon =
            type === FLASH_TYPE.RESULTS ? atlases.ui.textures.ui_results :
            type === FLASH_TYPE.SKIN ? renderPlayer() :
            type === FLASH_TYPE.BUY_SAVE ? atlases.ui.textures.ui_buy_save :
            type === FLASH_TYPE.WHEEL ? atlases.ui.textures.ui_spin_for_ad :
            type === FLASH_TYPE.SHOP ? atlases.ui.textures.ui_skin_shop :
            atlases.ui.textures.ui_save_for_ad

        this.icon = new Sprite(icon)
        this.icon.anchor.set(0.5)
        this.addChild(this.icon)

        this.flash = new Sprite(atlases.ui.textures.flash_line)
        this.flash.anchor.set(0.5)
        this.flashSpeed = 0.6
        this.flash.position.set( (MAX_X * 2) * flashRateX - MAX_X, 0 )
        this.addChild(this.flash)

        const mask = new Sprite(icon)
        mask.anchor.set(0.5)
        this.addChild(mask)

        this.flash.mask = mask

        this.callback = callback

        this.isOnHover = false
        
        setCursorPointer(this)
        this.on('pointerdown', this.click, this)
        this.on('pointerover', this.onHover, this)
        this.on('pointerout', this.onOut, this)

        this.scaleMin = 1
        this.scaleMax = SCALE_UP_RATE

        if (type === FLASH_TYPE.BUY_SAVE && !isSaveCoinsAvailable) this.deactivate()
        else if (type === FLASH_TYPE.AD_SAVE && !isSaveAdAvailable) this.deactivate()
        else tickerAdd(this)
    }

    setStartScale(scale) {
        this.scaleMin = scale
        this.scaleMax = scale * SCALE_UP_RATE
        this.scale.set(scale)
    }

    updateTexture() {
        this.icon.texture = renderPlayer()
    }

    deactivate() {
        tickerRemove(this)
        this.scale.set(this.scaleMin)
        this.icon.tint = 0x999999
        this.flash.mask = []
        this.removeChild(this.flash)
        this.flash.destroy()
        this.flash = null
    }

    click() {
        setTimeout( () => soundPlay(sounds.se_click), 1 )
        this.callback()
    }

    onHover() {
        if (this.alpha < 1 || this.isOnHover) return

        this.isOnHover = true
        soundPlay(sounds.se_hover)
    }
    onOut() {
        if (this.alpha < 1 || !this.isOnHover) return

        this.isOnHover = false
    }

    tick(deltaMs) {
        if (!this.flash) return tickerRemove(this)

        this.flash.x += this.flashSpeed * deltaMs
        if (this.flash.x >= MAX_X) this.flash.x -= MAX_X * 2


        if (this.isOnHover) {
            this.scale.set( Math.min(this.scaleMax, this.scale.x + SCALE_STEP * deltaMs) )
        } else {
            this.scale.set( Math.max(this.scaleMin, this.scale.x - SCALE_STEP * deltaMs) )
        }
    }

    kill() {
        tickerRemove(this)
        removeCursorPointer(this)
        this.off('pointerdown', this.click, this)
        this.off('pointerover', this.onHover, this)
        this.off('pointerout', this.onOut, this)
        this.isOnHover = false
    }
}