import { BlurFilter, Container, Graphics, RenderTexture, Texture } from "pixi.js"
import { getAppRenderer } from "../app/application"

// helper: number (0xff0000) -> '#ff0000'
function colorToCss(color) {
    if (typeof color === "string") return color
    return "#" + color.toString(16).padStart(6, "0")
}

/**
 * Рендерит PIXI.Text (или любой DisplayObject) в RenderTexture.
 * 
 * @param {PIXI.Text} textObject - текст, который нужно превратить в текстуру
 * @returns {PIXI.RenderTexture} - готовая текстура
 */
 export function textToTexture(textObject) {
    const renderer = getAppRenderer()
    const bounds = textObject.getLocalBounds()

    const rt = RenderTexture.create({
        width: Math.ceil(bounds.width),
        height: Math.ceil(bounds.height),
    })

    const container = new Container()
    container.addChild(textObject)

    const prevX = textObject.x
    const prevY = textObject.y

    textObject.x = -bounds.x
    textObject.y = -bounds.y

    renderer.render({
        container: container,
        target: rt,
        clear: true // Опционально: очищать ли текстуру перед рендером
    })

    textObject.x = prevX
    textObject.y = prevY

    return rt
}
  
/**
 * Создает Texture прямоугольника или радиального градиента (PixiJS v8)
 * fill может быть:
 *  - number / string  → сплошной цвет
 *  - объект { type: 'radial-gradient', stops: [...], x0,y0,radius0,x1,y1,radius1 }
 */
export function getRecTexture(width, height, fill, isSetRendererResolution = false) {
    const resolution = isSetRendererResolution ? getAppRenderer()?.resolution : 1

    const canvas = document.createElement("canvas")
    canvas.width = Math.ceil(width * resolution)
    canvas.height = Math.ceil(height * resolution)
    const ctx = canvas.getContext("2d")

    if (resolution !== 1) ctx.scale(resolution, resolution)

    // --- Обработка разных типов заливки ---
    if (fill && fill.type === "radial-gradient") {
        const {
            x0 = width / 2,
            y0 = height / 2,
            radius0 = 0,
            x1 = width / 2,
            y1 = height / 2,
            radius1 = Math.max(width, height) / 2,
            stops = []
        } = fill

        const grad = ctx.createRadialGradient(x0, y0, radius0, x1, y1, radius1)
        for (const stop of stops) {
            grad.addColorStop(
                Math.max(0, Math.min(1, stop.offset)),
                colorToCss(stop.color)
            )
        }
        ctx.fillStyle = grad

    } else if (fill && fill.type === "linear-gradient") {
        // Параметры линейного градиента (стандартные по умолчанию: слева направо)
        const {
            x0 = 0,          // Начальная точка X
            y0 = 0,          // Начальная точка Y
            x1 = width,      // Конечная точка X
            y1 = 0,          // Конечная точка Y
            stops = []       // Массив {offset, color}
        } = fill

        const grad = ctx.createLinearGradient(x0, y0, x1, y1)
        for (const stop of stops) {
            grad.addColorStop(
                Math.max(0, Math.min(1, stop.offset)),
                colorToCss(stop.color)
            )
        }
        ctx.fillStyle = grad

    } else {
        // Обычный цвет или fallback
        ctx.fillStyle = colorToCss(fill || 0x000000)
    }

    // Рисуем прямоугольник с выбранной заливкой
    ctx.fillRect(0, 0, width, height)

    return Texture.from(canvas, { resolution })
}

export function getRRTexture(width, height, borderRadius, color, alpha = 1) {
    const appRenderer = getAppRenderer()

    const container = new Container()

    const RR = new Graphics()
    RR.roundRect(0, 0, width, height, borderRadius)
    RR.fill(color)
    RR.alpha = alpha
    container.addChild(RR)
  
    const resolution = appRenderer.resolution ?? 1
    const rt = RenderTexture.create({
        width: Math.ceil(width),
        height: Math.ceil(height),
        resolution,
    })
  
    appRenderer.render({
        container: container,
        target: rt
    })

    RR.destroy()
    container.destroy()
  
    return rt
}

export function getRRTextureWithShadow(
    width, height, borderRadius, color, offsetX = 0, offsetY = 0, alpha = 0.5, blur = 8
) {
    const appRenderer = getAppRenderer()

    const padding = blur * 4 + Math.max(Math.abs(offsetX), Math.abs(offsetY))
    const totalW = width + padding * 2
    const totalH = height + padding * 2

    const container = new Container()

    const shadow = new Graphics()
    shadow.roundRect(padding + offsetX, padding + offsetY, width, height, borderRadius)
    shadow.fill(0x000000)
    
    const blurFilter = new BlurFilter({ 
        strength: blur, 
        quality: 4 
    })
    shadow.filters = [blurFilter]
    shadow.alpha = alpha
    container.addChild(shadow)

    const RR = new Graphics()
    RR.roundRect(padding, padding, width, height, borderRadius)
    RR.fill(color)
    container.addChild(RR)

    const rt = RenderTexture.create({
        width: totalW,
        height: totalH,
        resolution: appRenderer.resolution
    })

    appRenderer.render({
        container: container,
        target: rt
    })

    RR.destroy()
    shadow.destroy()
    container.destroy()

    return [rt, padding]
}