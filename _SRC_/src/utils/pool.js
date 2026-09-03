import { tickerRemove } from '../app/application'

// Общий массив всех созданных пулов
const allPools = []

/**
 * Регистрирует пул в глобальном списке для централизованной очистки.
 * @param {Object} pool - объект пула с методом clear()
 * @returns {Object} тот же пул
 */
function registerPool(pool) {
    allPools.push(pool)
    return pool
}

/**
 * @typedef {Object} ObjectPool
 * @property {() => Object|null} get - возвращает свободный объект или null
 * @property {(obj: Object) => void} add - регистрирует новый объект как активный
 * @property {(obj: Object) => void} put - возвращает объект в пул (делает свободным)
 * @property {() => void} clear - полностью очищает пул
 */

/**
 * Пул для обычных объектов (Sprite, Container, AnimatedSprite).
 * Объекты удаляются из родителя через parent.removeChild(obj).
 *
 * @param {number} maxFreeSize - максимальное количество свободных объектов (по умолчанию 100)
 * @returns {ObjectPool}
 */
export function createObjectPool(maxFreeSize = 100) {
    const pool = (() => {
        /** @type {Array<Object>} свободные объекты */
        const free = []
        /** @type {Set<Object>} все активные объекты */
        const active = new Set()

        function get() {
            if (free.length === 0) return null
            const obj = free.pop()
            active.add(obj)
            return obj
        }

        function add(obj) {
            active.add(obj)
        }

        function put(obj) {
            if (!active.has(obj)) return
            active.delete(obj)

            tickerRemove(obj)
            if (obj.parent) obj.parent.removeChild(obj)

            if (free.length < maxFreeSize) {
                free.push(obj)
            } else if (typeof obj.destroy === 'function') {
                tickerRemove(obj)
                if (typeof obj.kill === 'function') obj.kill()
                if (obj.parent) obj.parent.removeChild(obj)
                obj.destroy({ children: true })
            }
        }

        function clear() {
            for (const obj of active) {
                tickerRemove(obj)
                if (typeof obj.kill === 'function') obj.kill()
                if (obj.parent) obj.parent.removeChild(obj)
                if (typeof obj.destroy === 'function') obj.destroy({ children: true })
            }
            active.clear()

            for (let i = free.length - 1; i >= 0; i--) {
                const obj = free[i]
                if (typeof obj.destroy === 'function') obj.destroy({ children: true })
            }
            free.length = 0
        }

        return { get, add, put, clear }
    })()

    return registerPool(pool)
}

/**
 * @typedef {Object} ParticlePool
 * @property {() => Object|null} get - возвращает свободную частицу или null
 * @property {(obj: Object) => void} add - регистрирует новую частицу как активную
 * @property {(obj: Object) => void} put - возвращает частицу в пул
 * @property {() => void} clear - полностью очищает пул частиц
 */

/**
 * Пул для частиц (Particle), которые находятся в ParticleContainer.
 * Частицы удаляются из родителя через parent.removeParticle(particle).
 *
 * @param {number} maxFreeSize - максимальное количество свободных частиц (по умолчанию 1000)
 * @returns {ParticlePool}
 */
export function createParticlePool(maxFreeSize = 1000) {
    const pool = (() => {
        /** @type {Array<Object>} свободные частицы */
        const free = []
        /** @type {Set<Object>} все активные частицы */
        const active = new Set()

        function get() {
            if (free.length === 0) return null
            const obj = free.pop()
            active.add(obj)
            return obj
        }

        function add(obj) {
            active.add(obj)
        }

        function put(obj) {
            if (!active.has(obj)) return
            active.delete(obj)

            tickerRemove(obj)
            if (obj.parent) obj.parent.removeParticle(obj)

            if (free.length < maxFreeSize) {
                free.push(obj)
            } else if (typeof obj.destroy === 'function') {
                tickerRemove(obj)
                if (typeof obj.kill === 'function') obj.kill()
                if (obj.parent) obj.parent.removeChild(obj)
                obj.destroy({ children: true })
            }
        }

        function clear() {
            for (const obj of active) {
                tickerRemove(obj)
                if (typeof obj.kill === 'function') obj.kill()
                if (obj.parent) obj.parent.removeParticle(obj)
                if (typeof obj.destroy === 'function') obj.destroy({ children: true })
            }
            active.clear()

            for (let i = free.length - 1; i >= 0; i--) {
                const obj = free[i]
                if (typeof obj.destroy === 'function') obj.destroy({ children: true })
            }
            free.length = 0
        }

        return { get, add, put, clear }
    })()

    return registerPool(pool)
}

/**
 * Очищает все созданные пулы, вызывая у каждого метод clear().
 * Используется в SceneManager при смене сцен.
 */
export function clearAllPools() {
    for (const pool of allPools) {
        pool.clear()
    }
}