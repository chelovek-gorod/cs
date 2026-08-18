import { Sprite, Texture } from "pixi.js"
import { getAppScreen } from "../../app/application"
import { getRecTexture } from "../../utils/textureGenerator"

export default class BackgroundGradient extends Sprite {
    constructor(colors) {
        super()
        this.colors = colors
        this.anchor.set(0.5)
    }

    screenResize(screenData) {
        // перед заменой текстуры — уничтожаем старую (если она была создана здесь)
        if (this.texture) {
            this.texture.destroy(true)
            this.texture = Texture.EMPTY
        }

        this.fill = this.getFillFromColors(screenData.width, screenData.height, this.colors)
        this.texture = getRecTexture(
            Math.ceil(screenData.width), Math.ceil(screenData.height), this.fill
        )
        // позиционирование/размер, т.к. мы центральный спрайт:
        this.width = screenData.width
        this.height = screenData.height
        this.anchor.set(0.5)
    }

    setColors(colors) {
        this.colors = colors
        this.screenResize(getAppScreen())
    }

    getFillFromColors(width, height, colors) {
        const centerX = width / 2
        const centerY = height / 2
        const maxRadius = Math.max(width, height) / 2

        return {
            type: 'radial-gradient',
            stops: colors.map((color, index) => ({
                offset: index / (colors.length - 1),
                color: color
            })),
            x0: centerX,
            y0: centerY,
            radius0: 0,
            x1: centerX,
            y1: centerY,
            radius1: maxRadius
        }
    }

    kill() {
        if (this.texture) this.texture.destroy(true)
    }
}