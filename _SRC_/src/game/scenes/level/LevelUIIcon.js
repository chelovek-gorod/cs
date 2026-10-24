import { Container, Sprite, Text } from "pixi.js"
import { tickerAdd, tickerRemove } from "../../../app/application"
import { atlases, sounds } from "../../../app/assets"
import { removeCursorPointer, setCursorPointer } from "../../../utils/functions"
import { styles } from "../../../app/styles"
import { soundPlay } from "../../../app/sound"

const ALPHA_DISABLED = 0.7

// Максимальное смещение от центра иконки
const SHINE_COUNT = 5
const SHINE_RADIUS_MAX = 36
const SHINE_SCALE_MIN = 0
const SHINE_SCALE_MAX = 0.9
const SHINE_TIME = 900
const SHINE_SCALE_STEP = (SHINE_SCALE_MAX - SHINE_SCALE_MIN) / SHINE_TIME
const SHINE_ALPHA_STEP = 1 / SHINE_TIME

export default class ActionIcon extends Container {
    constructor(
            iconTexture, clickCallback, isActive = true,
            isText = false, isProgress = false, isShining = false
        ) {
        super()

        this.isActive = isActive
        this.alpha = this.isActive ? 1 : ALPHA_DISABLED

        if (iconTexture) {
            this.icon = new Sprite(iconTexture)
            this.icon.anchor.set(0.5)
            this.addChild(this.icon)
        }

        if (isText || isProgress) {
            this.progressBg = new Sprite(atlases.ui.textures.ui_btn_progress_bg)
            this.progressBg.anchor.set(0.5)
            this.progressBg.visible = false
            this.addChild(this.progressBg)
        }

        if (isProgress) {
            this.progressLine = new Sprite(atlases.ui.textures.ui_btn_progress_line)
            this.progressLine.anchor.set(0, 0.5)
            this.progressLine.position.set(-30, 23)
            this.progressLine.visible = false
            this.addChild(this.progressLine)

            this.progressBorder = new Sprite(atlases.ui.textures.ui_btn_progress_border)
            this.progressBorder.anchor.set(0.5)
            this.progressBorder.visible = false
            this.addChild(this.progressBorder)
        }
        
        if (isText) {
            this.text = new Text({ text: '', style: styles.uiIconProgress})
            this.text.anchor.set(0.5)
            this.text.position.set(0, 23)
            this.text.visible = false
            this.addChild(this.text)
        }

        if (isShining) {
            this.shines = new Container()
            this.shines.blendMode = 'add'
            this.shines.visible = false
            this.addChild(this.shines)
            for (let i = 0; i < SHINE_COUNT; i++) {
                const shine = new Sprite(atlases.ui.textures.particle_star)
                shine.anchor.set(0.5)
            
                const p = i / SHINE_COUNT
            
                if (p < 0.5) {
                    shine.scale.set(p * 2 * SHINE_SCALE_MAX)
                    shine.alpha = p * 2
                    shine.isShineUp = true
                } else {
                    const k = 1 - (p - 0.5) * 2
                    shine.scale.set(k * SHINE_SCALE_MAX)
                    shine.alpha = k
                    shine.isShineUp = false
                }
            
                this.shines.addChild(shine)
                this.jumpShine(shine)
            }
        }
        
        if (clickCallback) {
            this.clickCallback = clickCallback
            setCursorPointer(this)
            this.on('pointerdown', this.click, this)
        }
        
    }

    setActive(isActive) {
        this.isActive = isActive
        this.alpha = this.isActive ? 1 : ALPHA_DISABLED
    }

    setText(text, isVisible = true) {
        if (!this.text) return

        if (text !== null) this.text.text = text
        this.text.visible = isVisible
    }

    setProgressBg(tint, alpha = 1) {
        if (!this.progressBg) return

        if (tint) this.progressBg.tint = tint
        if (alpha) {
            this.progressBg.alpha = alpha
            this.progressBg.visible = true
        } else {
            this.progressBg.visible = false
        }
    }

    setProgress(scale = 1, isVisible = true, tint = null) {
        if (!this.progressLine) return

        if (tint) this.progressLine.tint = tint
        if (scale !== null) this.progressLine.scale.set(scale, 1)
        this.progressLine.visible = isVisible
    }

    setProgressBorder(isVisible = true, tint = null) {
        if (tint) this.progressBorder.tint = tint
        this.progressBorder.visible = isVisible
    }

    setShine(isOn = false, tint = null) {
        if (!this.shines) return

        this.shines.visible = isOn
        if (tint) {
            for(let i = this.shines.children.length - 1; i >= 0; i--) {
                this.shines.children[i].tint = tint
            }
        }

        if (isOn) tickerAdd(this)
        else tickerRemove(this)
    }

    click() {
        if (!this.isActive || !this.clickCallback) return

        this.clickCallback()
    }

    jumpShine(shine) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * SHINE_RADIUS_MAX

        shine.x = Math.cos(angle) * radius
        shine.y = Math.sin(angle) * radius
    }

    tick(deltaMs) {
        for(let i = this.shines.children.length - 1; i >= 0; i--) {
            const shine = this.shines.children[i]

            if (shine.isShineUp) {
                const scale = Math.min(SHINE_SCALE_MAX, shine.scale.x + SHINE_SCALE_STEP * deltaMs)
                shine.scale.set(scale)
                shine.alpha += SHINE_ALPHA_STEP * deltaMs
                if (scale === SHINE_SCALE_MAX) shine.isShineUp = false
            } else {
                const scale = Math.max(SHINE_SCALE_MIN, shine.scale.x - SHINE_SCALE_STEP * deltaMs)
                shine.scale.set(scale)
                shine.alpha -= SHINE_ALPHA_STEP * deltaMs
                if (scale === SHINE_SCALE_MIN) {
                    shine.isShineUp = true
                    this.jumpShine(shine)
                }
            }
        }
    }

    kill() {
        if (this.clickCallback) {
            this.off('pointerdown', this.click, this)
            removeCursorPointer(this)
            this.clickCallback = null
        }

        if (this.shines) {
            tickerRemove(this)
            while (this.shines.children.length > 0) {
                this.shines.children[0].destroy()
            }
        }
        
        this.destroy({children: true})
    }
}