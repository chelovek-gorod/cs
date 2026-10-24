import { AnimatedSprite, Container } from "pixi.js"
import { tickerAdd, tickerRemove } from "../../../app/application"
import { atlases } from "../../../app/assets"
import { createEnum } from "../../../utils/functions"
import { createObjectPool } from "../../../utils/pool"

const VOODOO_FX_POOL = createObjectPool(30)

const TAU = Math.PI * 2
const STATE = createEnum(['GROW', 'FADE'])

// визуал
const FX_TINT = 0xaa66ff
const FX_LAYERS = 2
const FX_BLEND = 'add'

// тайминги
const FX_GROW_TIME = 1200
const FX_FADE_TIME = 400

// alpha
const FX_ALPHA_MAX = 0.5

// scale
const FX_SCALE_START = 0.25
const FX_SCALE_END = 2.0

// вращение (рад/мс) — по слоям, знак = направление
const FX_ROTATE_SPEEDS = [0.002, -0.003]

// скорость анимации дыма по слоям
const FX_ANIM_SPEEDS = [0.3, 0.4]

export function createVoodooFX(x, y) {
    let fx = VOODOO_FX_POOL.get()
    if (fx) {
        fx.reset(x, y)
    } else {
        fx = new VoodooFX(x, y)
        VOODOO_FX_POOL.add(fx)
    }
    return fx
}

class VoodooFX extends Container {
    constructor(x, y) {
        super()

        this.layers = []
        for (let i = 0; i < FX_LAYERS; i++) {
            const layer = new AnimatedSprite(atlases.smoke.animations.effect)
            layer.anchor.set(0.5)
            layer.animationSpeed = FX_ANIM_SPEEDS[i]
            layer.loop = true
            layer.tint = FX_TINT
            layer.blendMode = FX_BLEND
            this.addChild(layer)
            this.layers.push(layer)
        }

        this.reset(x, y)
    }

    reset(x, y) {
        this.position.set(x, y)
        this.state = STATE.GROW
        this.time = 0

        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i]
            layer.alpha = 0
            layer.scale.set(FX_SCALE_START)
            layer.rotation = Math.random() * TAU
            layer.gotoAndPlay(0)
        }

        tickerAdd(this)
    }

    tick(deltaMs) {
        this.time += deltaMs

        if (this.state === STATE.GROW) {
            const progress = Math.min(1, this.time / FX_GROW_TIME)
            const alpha = FX_ALPHA_MAX * progress
            const scale = FX_SCALE_START + (FX_SCALE_END - FX_SCALE_START) * progress

            for (let i = 0; i < this.layers.length; i++) {
                const layer = this.layers[i]
                layer.alpha = alpha
                layer.scale.set(scale)
                layer.rotation += FX_ROTATE_SPEEDS[i] * deltaMs
            }

            if (progress >= 1) {
                this.state = STATE.FADE
                this.time = 0
            }
            return
        }

        // FADE — только alpha, scale не трогаем
        const progress = Math.min(1, this.time / FX_FADE_TIME)
        const alpha = FX_ALPHA_MAX * (1 - progress)

        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i]
            layer.alpha = alpha
            layer.rotation += FX_ROTATE_SPEEDS[i] * deltaMs
        }

        if (progress >= 1) this.release()
    }

    release() {
        VOODOO_FX_POOL.put(this)
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
    }
}