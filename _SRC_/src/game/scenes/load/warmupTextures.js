import { Container, Sprite } from 'pixi.js'
import { getAppRenderer } from '../../../app/application'
import { assets } from '../../../app/assets'

/**
 * Принудительно загружает все текстуры в видеопамять (GPU) и компилирует шейдеры.
 * Вызывать ПОСЛЕ завершения loadAssets, чтобы избежать микро-фризов при первом спавне.
 */
export function warmupAllTextures() {
    const renderer = getAppRenderer()
    if (!renderer) return

    const tempContainer = new Container()

    // 1. Прогреваем обычные изображения
    for (const key in assets.images) {
        const tex = assets.images[key]
        // Проверяем, что это уже загруженная текстура, а не строка пути
        if (tex && typeof tex !== 'string' && tex.source) {
            const sprite = new Sprite({ texture: tex, x: -9999, y: -9999 })
            tempContainer.addChild(sprite)
        }
    }

    // 2. Прогреваем все кадры из атласов (Spritesheet)
    for (const key in assets.atlases) {
        const spritesheet = assets.atlases[key]
        // В PixiJS загруженный атлас имеет свойство .textures (словарь текстур)
        if (spritesheet && spritesheet.textures) {
            for (const texKey in spritesheet.textures) {
                const tex = spritesheet.textures[texKey]
                if (tex && tex.source) {
                    const sprite = new Sprite({ texture: tex, x: -9999, y: -9999 })
                    tempContainer.addChild(sprite)
                }
            }
        }
    }

    // 3. Форсируем отрисовку. Это заставляет GPU загрузить все текстуры и скомпилировать шейдеры
    renderer.render(tempContainer)

    // 4. Мгновенно уничтожаем временный контейнер (он больше не нужен)
    tempContainer.destroy({ children: true })
    
    console.log('✅ Все текстуры прогреты и готовы к отрисовке без фризов')
}