const russianFormatter = new Intl.NumberFormat('ru-RU')
export function formatNumber(number) {
    return russianFormatter.format(number);
}

/**
 * @template {string} T
 * @param {T[]} keys
 * @returns {{[K in T]: K}}
 */
export function createEnum(keys) {
    return /** @type {any} */ (Object.fromEntries(
        keys.map(key => [key, key])
    ));
}

/**
 * Уменьшает яркость цвета.
 * @param {number} color - цвет в формате 0xRRGGBB (например, 0xFF8040)
 * @param {number} factor - степень затемнения от 0.0 (без изменений) до 1.0 (полностью чёрный)
 * @returns {number} затемнённый цвет в том же формате
 */
export function getDarkColor(color, range) {
    // Ограничиваем factor диапазоном [0, 1]
    const f = Math.min(1, Math.max(0, range))
    
    // Извлекаем компоненты R, G, B
    const r = (color >> 16) & 0xFF
    const g = (color >> 8) & 0xFF
    const b = color & 0xFF
    
    // Применяем затемнение: умножаем на (1 - f)
    const newR = Math.round(r * (1 - f))
    const newG = Math.round(g * (1 - f))
    const newB = Math.round(b * (1 - f))
    
    // Собираем обратно в 0xRRGGBB
    return (newR << 16) | (newG << 8) | newB
}

export function getRandom(min, max) {
    return min + Math.random() * (max - min);
}

export function shuffleArray( array ) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
    return array
}

export function setCursorPointer(target) {
    target.eventMode = 'static'
    target.on('pointerover', () => document.body.style.cursor = 'pointer')
    target.on('pointerout', () => document.body.style.cursor = 'auto')
}
export function removeCursorPointer(target) {
    target.eventMode = 'none'
    target.off('pointerover', () => document.body.style.cursor = 'pointer')
    target.off('pointerout', () => document.body.style.cursor = 'auto')
}

export function getLinesIntersectionPoint(x1, y1, x2, y2, x3, y3, x4, y4) {
    const dx1 = x2 - x1
    const dy1 = y2 - y1
    const dx2 = x4 - x3
    const dy2 = y4 - y3

    const denom = dy2 * dx1 - dx2 * dy1

    if (denom === 0) return null // параллельные линии

    const dx3 = x1 - x3
    const dy3 = y1 - y3

    const ua = (dx2 * dy3 - dy2 * dx3) / denom
    const ub = (dx1 * dy3 - dy1 * dx3) / denom

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return { x: x1 + ua * dx1, y: y1 + ua * dy1 }
    }

    return null // пересечений нет
}

export function getDistance(sprite, target) {
    let dx = target.x - sprite.x
    let dy = target.y - sprite.y
    return Math.sqrt(dx * dx + dy * dy)
}

export function getDistanceSquare(sprite, target) {
    let dx = target.x - sprite.x
    let dy = target.y - sprite.y
    return dx * dx + dy * dy
}

export function moveSprite(sprite, pathSize) {
    sprite.x += Math.cos(sprite.rotation) * pathSize
    sprite.y += Math.sin(sprite.rotation) * pathSize
}

const _2PI = Math.PI * 2
export function turnSpriteToTarget(sprite, target, turnAngle) {
    let pointDirection = Math.atan2(target.y - sprite.y, target.x - sprite.x)
    let deflection = (pointDirection - sprite.rotation) % _2PI
    if (!deflection) return true

    if (deflection < -Math.PI) deflection += _2PI
    if (deflection >  Math.PI) deflection -= _2PI

    if (Math.abs(deflection) <= turnAngle) sprite.rotation = pointDirection
    else sprite.rotation += (deflection <  0) ? -turnAngle : turnAngle
    return false
}

export function moveToTarget( sprite, target, pathSize ) {
    const distance = getDistance(sprite, target)

    if (distance <= pathSize) {
        sprite.x = target.x
        sprite.y = target.y

        return true
    }

    const moveRate = pathSize / distance
    sprite.x += moveRate * (target.x - sprite.x)
    sprite.y += moveRate * (target.y - sprite.y)

    return false
}