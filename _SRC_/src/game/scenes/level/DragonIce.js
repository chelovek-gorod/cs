import { Particle, ParticleContainer, Container } from 'pixi.js'
import { tickerAdd, tickerRemove } from '../../../app/application'
import { images } from '../../../app/assets'
import { createParticlePool } from '../../../utils/pool'

// Параметры ледяного дыхания (можно подстроить)
const ICE_CONFIG = {
    PARTICLE_SCALE_BIG: 0.5,
    PARTICLE_SCALE_SMALL: 0.2,
    COLORS: [0xffffff, 0xdddddd, 0x00ffff],   // белый, светло-серый, голубой
    ALPHA_START: 0.9,
    ALPHA_DECAY: 0.0012,                     // медленное угасание
    SPEED: 0.24,                             // выше скорость
    SPEED_VARIANCE: 0.12,
    SPREAD_ANGLE: 0.12,                      // уже конус (~7°)
    SPAWN_RADIUS: 6,                         // небольшой разброс в точке рождения
    MAX_PARTICLES: 500,
}

export default class DragonIce extends Container {
    constructor() {
        super()

        // Слой частиц
        this.particleContainer = new ParticleContainer({
            dynamicProperties: {
                position: true,
                alpha: true,
            },
        })
        this.addChild(this.particleContainer)

        // Пул частиц
        this.particlePool = createParticlePool(ICE_CONFIG.MAX_PARTICLES)

        // Активные частицы
        this.activeParticles = []
        this.isTickerAdded = false
    }

    /**
     * Создаёт ледяные частицы, летящие вперёд от дракона.
     * @param {number} x - стартовая позиция X
     * @param {number} y - стартовая позиция Y
     * @param {number} dirX - единичный вектор направления (X)
     * @param {number} dirY - единичный вектор направления (Y)
     * @param {number} count - количество частиц за вызов
     */
    emit(x, y, dirX, dirY, count) {
        const bigCount = Math.ceil(count / 3)        // больших в 2 раза меньше
        const smallCount = count - bigCount
        const colors = ICE_CONFIG.COLORS
    
        const emitOne = (scale) => {
            let particle = this.particlePool.get()
            if (!particle) {
                particle = new Particle({
                    texture: images.particle,
                    x: 0, y: 0,
                    anchorX: 0.5, anchorY: 0.5,
                    scaleX: scale,
                    scaleY: scale,
                    rotation: 0,
                    alpha: 1,
                })
                particle.data = {}
                this.particlePool.add(particle)
            }
    
            // цвет
            particle.tint = colors[Math.floor(Math.random() * colors.length)]
            particle.scaleX = scale
            particle.scaleY = scale
    
            // случайное смещение в радиусе
            const angleOffset = Math.random() * Math.PI * 2
            const dist = Math.random() * ICE_CONFIG.SPAWN_RADIUS
            const startX = x + Math.cos(angleOffset) * dist
            const startY = y + Math.sin(angleOffset) * dist
    
            // направление с разбросом
            const baseAngle = Math.atan2(dirY, dirX)
            const spread = (Math.random() - 0.5) * 2 * ICE_CONFIG.SPREAD_ANGLE
            const finalAngle = baseAngle + spread
            const speed = ICE_CONFIG.SPEED + Math.random() * ICE_CONFIG.SPEED_VARIANCE
    
            particle.x = startX
            particle.y = startY
            particle.alpha = ICE_CONFIG.ALPHA_START
            particle.data.vx = Math.cos(finalAngle) * speed
            particle.data.vy = Math.sin(finalAngle) * speed
    
            this.particleContainer.addParticle(particle)
            this.activeParticles.push(particle)
        }
    
        for (let i = 0; i < bigCount; i++) emitOne(ICE_CONFIG.PARTICLE_SCALE_BIG)
        for (let i = 0; i < smallCount; i++) emitOne(ICE_CONFIG.PARTICLE_SCALE_SMALL)
    
        if (!this.isTickerAdded) {
            tickerAdd(this)
            this.isTickerAdded = true
        }
    }

    tick(deltaMs) {
        const particles = this.activeParticles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i]

            // Движение
            p.x += p.data.vx * deltaMs
            p.y += p.data.vy * deltaMs

            // Угасание
            p.alpha = Math.max(0, p.alpha - ICE_CONFIG.ALPHA_DECAY * deltaMs)

            // Удаление, если частица исчезла или вышла за границы (можно добавить границы)
            if (p.alpha <= 0) {
                this.particleContainer.removeParticle(p)
                this.particlePool.put(p)
                particles.splice(i, 1)
            }
        }

        if (particles.length === 0 && this.isTickerAdded) {
            tickerRemove(this)
            this.isTickerAdded = false
        }
    }

    kill() {
        tickerRemove(this)

        // Возвращаем все активные частицы в пул
        for (const p of this.activeParticles) {
            if (p.parent) p.parent.removeParticle(p)
            this.particlePool.put(p)
        }
        this.activeParticles.length = 0

        // Удаляем particleContainer из родителя, если он есть
        if (this.particleContainer.parent) {
            this.particleContainer.parent.removeChild(this.particleContainer)
        }
        this.particleContainer.destroy({ children: true })

        // Уничтожаем сам DragonIce
        if (this.parent) this.parent.removeChild(this)
        super.destroy({ children: true })
    }
}