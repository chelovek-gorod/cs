import { Particle, ParticleContainer, Container } from 'pixi.js'
import { tickerAdd, tickerRemove } from '../../../app/application'
import { images } from '../../../app/assets'
import { createParticlePool } from '../../../utils/pool'

// Параметры ледяного дыхания (можно подстроить)
const PARTICLE_SCALE_BIG = 0.5
const PARTICLE_SCALE_SMALL = 0.2
const COLORS = [0xff0000, 0xffff00, 0xff6600, 0xffff00, 0xffcc00, 0xdddddd]
const LIFE_MIN = 600   // мс
const LIFE_MAX = 900  // мс
const LIFE_CURVE = 3.6 // Коэффициент скругления. 1 = острый треугольник, 2-3 = плавная капля, 4+ = резкий "хвост" по центру
const ALPHA_START = 0.7
const ALPHA_DECAY = 0.0036                    // медленное угасание
const SPEED = 0.18                            // выше скорость
const SPEED_VARIANCE = 0.06
const SPAWN_RADIUS = 3                        // небольшой разброс в точке рождения
const MAX_PARTICLES = 500


export default class DragonFire extends Container {
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
        this.particlePool = createParticlePool(MAX_PARTICLES)

        // Активные частицы
        this.activeParticles = []
        this.isTickerAdded = false

        this.particlePool.fill(() => {
            const p = new Particle({
                texture: images.particle, x: 0, y: 0,
                anchorX: 0.5, anchorY: 0.5,
                scaleX: PARTICLE_SCALE_BIG, scaleY: PARTICLE_SCALE_BIG,
                rotation: 0, alpha: 0
            })
            p.data = {}
            return p
        }, MAX_PARTICLES)
    }

    /**
     * Создаёт ледяные частицы, летящие вперёд от дракона.
     * @param {number} x - стартовая позиция X
     * @param {number} y - стартовая позиция Y
     * @param {number} dirX - единичный вектор направления (X)
     * @param {number} dirY - единичный вектор направления (Y)
     * @param {number} count - количество частиц за вызов
     */
    // Добавили параметр spread = 0.6 (значение по умолчанию, если вдруг не передадут)
    emit(x, y, dirX, dirY, count, spread = 0.6) {
        const bigCount = Math.ceil(count / 3)
        const smallCount = count - bigCount
        const colors = COLORS
    
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
    
            particle.tint = colors[Math.floor(Math.random() * colors.length)]
            particle.scaleX = scale
            particle.scaleY = scale
    
            const angleOffset = Math.random() * Math.PI * 2
            const dist = Math.random() * SPAWN_RADIUS
            const startX = x + Math.cos(angleOffset) * dist
            const startY = y + Math.sin(angleOffset) * dist
    
            const baseAngle = Math.atan2(dirY, dirX)
            const angleSpread = (Math.random() - 0.5) * 2 * spread
            const finalAngle = baseAngle + angleSpread
            const speed = SPEED + Math.random() * SPEED_VARIANCE

            // Вычисляем, насколько частица близка к краю разброса (0 = центр, 1 = самый край)
            const distFromCenter = Math.abs(angleSpread) / spread
            
            // Применяем кривую: чем ближе к центру, тем дольше живет частица (скругление кончика)
            const lifeFactor = 1 - Math.pow(distFromCenter, LIFE_CURVE)

            particle.x = startX
            particle.y = startY
            particle.alpha = ALPHA_START
            particle.data.vx = Math.cos(finalAngle) * speed
            particle.data.vy = Math.sin(finalAngle) * speed
            
            // Новая формула жизни: базовая + бонус за близость к центру
            particle.data.life = LIFE_MIN + (LIFE_MAX - LIFE_MIN) * lifeFactor
    
            this.particleContainer.addParticle(particle)
            this.activeParticles.push(particle)
        }
    
        for (let i = 0; i < bigCount; i++) emitOne(PARTICLE_SCALE_BIG)
        for (let i = 0; i < smallCount; i++) emitOne(PARTICLE_SCALE_SMALL)
    
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
            if (p.data.life > 0) p.data.life -= deltaMs
            else p.alpha = Math.max(0, p.alpha - ALPHA_DECAY * deltaMs)

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

        // 1. Возвращаем все активные частицы в пул
        for (const p of this.activeParticles) {
            // removeParticle не нужен, если мы сейчас уничтожим весь контейнер,
            // но для чистоты пула оставляем:
            this.particlePool.put(p) 
        }
        this.activeParticles.length = 0

        // 2. Просто удаляем себя из родителя. 
        // super.destroy({ children: true }) сам разберется со всеми вложенными объектами!
        if (this.parent) {
            this.parent.removeChild(this)
        }
        
        // 3. Финальное уничтожение себя и всего, что внутри (включая particleContainer)
        super.destroy({ children: true })
    }
}