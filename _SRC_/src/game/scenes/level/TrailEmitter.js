import { Particle, ParticleContainer, Container } from "pixi.js"
import { tickerAdd, tickerRemove } from "../../../app/application"
import { images } from "../../../app/assets"

const MAX_PARTICLES = 500
const SPEED_DECAY = 0.99997

export default class TrailEmitter extends Container {
    constructor() {
        super()

        this.pc = new ParticleContainer({
            dynamicProperties: { position: true, alpha: true, color: true },
        })
        this.pc.blendMode = "add"
        this.addChild(this.pc)

        this.pool = []
        this.active = []
        this.isTickerAdded = false

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = new Particle({
                texture: images.particle,
                x: 0, y: 0,
                anchorX: 0.5, anchorY: 0.5,
                scaleX: 1, scaleY: 1,
                rotation: 0,
                alpha: 1,
            })
            p.data = {}
            this.pool.push(p)
        }
    }

    spawn(x, y, vx, vy, tint, scale, alphaStart, alphaDecay) {
        let p = this.pool.pop()
        if (!p) {
            p = new Particle({
                texture: images.particle,
                x: 0, y: 0,
                anchorX: 0.5, anchorY: 0.5,
                scaleX: 1, scaleY: 1,
                rotation: 0,
                alpha: 1,
            })
            p.data = {}
        }

        p.x = x
        p.y = y
        p.scaleX = scale
        p.scaleY = scale
        p.alpha = alphaStart
        p.tint = tint

        p.data.vx = vx
        p.data.vy = vy
        p.data.alphaDecay = alphaDecay

        this.pc.addParticle(p)
        this.active.push(p)

        if (!this.isTickerAdded) {
            tickerAdd(this)
            this.isTickerAdded = true
        }
    }

    tick(deltaMs) {
        const decay = Math.pow(SPEED_DECAY, deltaMs)
        const particles = this.active

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i]
            const d = p.data

            p.x += d.vx * deltaMs
            p.y += d.vy * deltaMs
            d.vx *= decay
            d.vy *= decay

            p.alpha -= d.alphaDecay * deltaMs

            if (p.alpha <= 0) {
                this.pc.removeParticle(p)
                this.pool.push(p)
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
        for (const p of this.active) {
            this.pc.removeParticle(p)
            this.pool.push(p)
        }
        this.active.length = 0
        if (this.parent) this.parent.removeChild(this)
        super.destroy({ children: true })
    }
}