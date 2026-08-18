import { Container, Text, Sprite } from "pixi.js"
import { atlases, sounds } from "../../app/assets"
import { removeCursorPointer, setCursorPointer } from "../../utils/functions"
import { styles } from "../../app/styles"
import { soundPlay } from "../../app/sound"
import { tickerAdd, tickerRemove } from "../../app/application"
import { TEXT_BUTTON } from "../localText"
import { getLanguage } from "../localization"
import { EventHub, events } from "../../app/events"

const ALPHA_DURATION = 120
const ALPHA_STEP = 1 / ALPHA_DURATION

export default class Button extends Container {
    constructor(icon = null, textKey = null, callback = null, isActive = true ) {
        super()

        this.callback = callback
        this.isText = !!textKey
        
        if (this.isText) {
            this.textKey = textKey
            EventHub.on( events.updateLanguage, this.updateLanguage, this )
        }
        

        this.backImage = new Sprite(
            atlases.ui.textures.button
            //atlases.ui.textures[ icon ? 'button_icon' : 'button' ]
        )
        this.backImage.anchor.set(0.5)
        this.frontImage = new Sprite(
            atlases.ui.textures.button_hover
            //atlases.ui.textures[ icon ? 'button_icon_hover' : 'button_hover' ]
        )
        this.frontImage.anchor.set(0.5)
        this.frontImage.alpha = 0
        this.isOnHover = false

        this.value = icon
            ? new Sprite(icon)
            : new Text({ text: TEXT_BUTTON[ textKey ][ getLanguage() ], style: styles.button })
        this.value.anchor.set(0.5, icon ? 0.52 : 0.6)
        
        this.addChild(this.backImage, this.frontImage, this.value)

        setCursorPointer(this.backImage)
        this.backImage.on('pointerdown', this.click, this)
        this.backImage.on('pointerover', this.onHover, this)
        this.backImage.on('pointerout', this.onOut, this)

        this.isActive = isActive
        this.setActive(this.isActive)
    }

    setTextKey( textKey ) {
        if (!this.isText) return
        
        this.textKey = textKey
        this.updateLanguage( getLanguage() )
    }

    setIcon(icon) {
        if (this.isText) return

        this.value.texture = icon
    }

    setCallback(callback) {
        this.callback = callback
    }

    setActive(isActive = true) {
        this.isActive = isActive
        if (this.isActive) {
            this.alpha = 1
        } else {
            this.alpha = 0.5
            if (this.isText) this.value.style = styles.button
        }
    }

    click(event) {
        if (!this.isActive) return

        event.stopPropagation()
        
        soundPlay(sounds.se_click)
        this.callback()
    }

    onHover() {
        if (!this.isActive || this.isOnHover) return

        this.isOnHover = true
        if (this.isText) this.value.style = styles.buttonHover
        else this.value.blendMode = 'add'
        soundPlay(sounds.se_hover)
        tickerAdd(this)
    }
    onOut() {
        if (!this.isOnHover) return

        this.isOnHover = false
        if (this.isText) this.value.style = styles.button
        else this.value.blendMode = 'normal'
        tickerAdd(this)
    }

    deactivate() {
        this.backImage.off('pointerdown', this.click, this)
        this.backImage.off('pointerover', this.onHover, this)
        this.backImage.off('pointerout', this.onOut, this)
        if (this.isText) this.value = styles.button
        else this.value.blendMode = 'normal'
    }

    tick(delta) {
        if (this.isOnHover) {
            this.frontImage.alpha = Math.min(1, this.frontImage.alpha + ALPHA_STEP * delta)
            if (this.frontImage.alpha === 1) tickerRemove(this)
        } else {
            this.frontImage.alpha = Math.max(0, this.frontImage.alpha - ALPHA_STEP * delta)
            if (this.frontImage.alpha === 0) tickerRemove(this)
        }
    }

    updateLanguage(lang) {
       this.value.text = TEXT_BUTTON[ this.textKey ][ lang ]
    }

    kill() {
        if (this.isText) EventHub.off( events.updateLanguage, this.updateLanguage, this )
        removeCursorPointer(this.backImage)
        this.deactivate()
    }
}