import { Sprite } from 'pixi.js'
import { getAppScreen } from '../../app/application'

export default class BackgroundImage extends Sprite {
    constructor(image, tint = null, isHorizontalMirroring = false) {
        super(image)

        this.tint = tint
        this.isHorizontalMirroring = isHorizontalMirroring

        this.bgWidth = image.width
        this.bgHeight = image.height
        this.anchor.set(0.5)
    }

    screenResize(screenData) {
        const scale_x = screenData.width / this.bgWidth
        const scale_y = screenData.height / this.bgHeight
        const scaleBg = Math.max(scale_x, scale_y)
        this.scale.set(scaleBg)
        if (this.isHorizontalMirroring) this.scale.x *= -1
    }

    setTexture(image) {
        this.texture = image
        this.bgWidth = image.width
        this.bgHeight = image.height
        this.anchor.set(0.5)
        screenResize(getAppScreen())
    }
}