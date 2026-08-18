import { Container, Sprite, Graphics } from "pixi.js"
import { atlases } from "../../app/assets"
import { getAppScreen, tickerAdd, tickerRemove, kill } from "../../app/application"
import Overlay from "./Overlay"
import BackgroundGradient from "../BG/BackgroundGradient"
import BackgroundTiling from "../BG/BackgroundTiling"
import { EventHub, events } from "../../app/events"

// Размеры попапа
const BG_SIDE_SIZE = 780
const BG_SIDE_OFFSET = 20
const BG_BORDER_RADIUS = 56
const BG_BORDER_WIDTH = 4
const BG_BORDER_COLOR = 0xffffff
const BG_SIZE = BG_SIDE_SIZE + BG_SIDE_OFFSET * 2

// Параметры анимации масштабирования
const SCALE_TIME = 360
const SCALE_RATE = 1.2

// Состояния анимации
const POPUP_STATE = {
  CLOSED: 'CLOSED',
  OPEN_UP: 'OPEN_UP',
  OPEN_DOWN: 'OPEN_DOWN',
  ACTIVE: 'ACTIVE',
  CLOSE_UP: 'CLOSE_UP',
  CLOSE_DOWN: 'CLOSE_DOWN'
}

// ─── Дефолтный фон (константы, капс) ───
const DEFAULT_BG_COLORS = [0x2d1b3d, 0x1a1a2e, 0x16213e]   // градиент по умолчанию
const DEFAULT_BG_IMAGE = null                               // если задать текстуру – будет использована картинка
const DEFAULT_BG_TILE = null                                // если задать текстуру – будет использован тайл

// ─── Класс Popup (оболочка) ───
export default class Popup extends Container {
    constructor() {
        super()

        this.visible = false
        this.state = POPUP_STATE.CLOSED
        this.scaleNormal = 1
        this.scaleMax = SCALE_RATE
        this.scaleSpeed = 0
        this.scaleSpeedMax = 1
        this.scaleAcceleration = 1.1
        this.onCloseCallback = null

        this.overlay = new Overlay()
        this.addChild(this.overlay)

        this.box = new Container()
        this.box.scale.set(0)
        this.addChild(this.box)

        this.content = new Container()
        this.box.addChild(this.content)

        this.bg = null
        if (DEFAULT_BG_IMAGE) this.setBackgroundImage(DEFAULT_BG_IMAGE)
        else if (DEFAULT_BG_TILE) this.setBackgroundTile(DEFAULT_BG_TILE)
        else this.setBackgroundColor(DEFAULT_BG_COLORS)

        EventHub.on(events.screenResize, this.screenResize, this)
        this.screenResize(getAppScreen())
    }

    screenResize(screenData) {
        this.overlay.screenResize(screenData)
        this.position.set(screenData.centerX, screenData.centerY)
        const screenSize = screenData.isLandscape ? screenData.height : screenData.width
        this.scaleNormal = Math.min(1, screenSize / BG_SIZE)
        this.scaleMax = this.scaleNormal * SCALE_RATE
        const fullScale = (this.scaleMax - this.scaleNormal) * 2 + this.scaleNormal
        this.scaleSpeedMax = (fullScale * 2) / SCALE_TIME
        this.scaleAcceleration = (fullScale * 2) / (SCALE_TIME * SCALE_TIME)
        if (this.visible) this.box.scale.set(this.scaleNormal)
    }

    setOnCloseCallback(callback) {
        this.onCloseCallback = callback
    }

    show() {
        if (this.visible) return
        this.visible = true
        this.overlay.show()
        this.state = POPUP_STATE.OPEN_UP
        this.scaleSpeed = this.scaleSpeedMax
        tickerAdd(this)
    }

    close() {
        if (this.state !== POPUP_STATE.ACTIVE) return
        this.overlay.hide()
        this.state = POPUP_STATE.CLOSE_UP
        this.scaleSpeed = 0
        tickerAdd(this)
    }

    clear() {
        // Уничтожаем все дочерние элементы в content
        while (this.content.children.length) {
            const child = this.content.children[0]
            this.content.removeChild(child)
            kill(child)
        }
        this.visible = false
        this.state = POPUP_STATE.CLOSED
        if (this.onCloseCallback) {
            this.onCloseCallback()
        }
    }

    setBackgroundColor(colors) {
        this.removeBackground()
        const bg = new BackgroundGradient(colors)
        bg.anchor.set(0.5)
        this.box.addChildAt(bg, 0)
        this.bg = bg
        bg.screenResize({ width: BG_SIDE_SIZE, height: BG_SIDE_SIZE, isLandscape: true }) // 780
    }
    
    setBackgroundImage(texture) {
        this.removeBackground()
        const bg = new Sprite(texture)
        bg.anchor.set(0.5)
        const scale = Math.min(BG_SIDE_SIZE / texture.width, BG_SIDE_SIZE / texture.height) // 780
        bg.scale.set(scale)
        bg.position.set(0, 0)
        this.box.addChildAt(bg, 0)
        this.bg = bg
    }
    
    setBackgroundTile(texture) {
        this.removeBackground()
        const bg = new BackgroundTiling(texture)
        bg.anchor.set(0.5)
        this.box.addChildAt(bg, 0)
        this.bg = bg
        bg.screenResize({ width: BG_SIDE_SIZE, height: BG_SIDE_SIZE, isLandscape: true }) // 780
    }

    removeBackground() {
        if (this.bg) {
            this.box.removeChild(this.bg)
            kill(this.bg)
            this.bg = null
        }
    }

    tick(deltaMs) {
        const scaleStep = this.scaleSpeed * deltaMs
        const acceleration = this.scaleAcceleration * deltaMs
        this.scaleSpeed += (this.state.indexOf('OPEN') > -1) ? -acceleration : acceleration

        if (this.state === POPUP_STATE.OPEN_UP || this.state === POPUP_STATE.CLOSE_UP) {
            this.box.scale.set(Math.min(this.scaleMax, this.box.scale.x + scaleStep))
            if (this.box.scale.x !== this.scaleMax) return

            this.state = (this.state === POPUP_STATE.OPEN_UP)
                ? POPUP_STATE.OPEN_DOWN
                : POPUP_STATE.CLOSE_DOWN
        }

        if (this.state === POPUP_STATE.OPEN_DOWN) {
            this.box.scale.set(Math.max(this.scaleNormal, this.box.scale.x - scaleStep))
            if (this.box.scale.x === this.scaleNormal) {
                tickerRemove(this)
                this.state = POPUP_STATE.ACTIVE
            }
        }

        if (this.state === POPUP_STATE.CLOSE_DOWN) {
            this.box.scale.set(Math.max(0, this.box.scale.x - scaleStep))
            if (this.box.scale.x === 0) {
                tickerRemove(this)
                this.clear()
            }
        }
    }

    kill() {
        EventHub.off(events.screenResize, this.screenResize, this)

        if (this.overlay) {
            this.removeChild(this.overlay)
            this.overlay.kill()
            this.overlay.destroy({ children: true })
            this.overlay = null
        }

        if (this.box) {
            this.removeChild(this.box)
            this.box.destroy({ children: true })
            this.box = null
        }

        tickerRemove(this)
        super.destroy({ children: true })
    }
}