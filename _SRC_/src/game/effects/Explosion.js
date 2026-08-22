import { AnimatedSprite } from "pixi.js";
import { atlases } from "../../app/assets";


export default class Explosion extends AnimatedSprite {
    constructor(x, y) {
        super(atlases.explosion.animations.effect)

        this.position.set(x, y)
        this.anchor.set(0.5)
        this.rotation = Math.random()
        this.animationSpeed = 0.5
        this.loop = false
        this.onComplete = this.kill.bind(this)
        this.play()
    }

    kill() {
        this.parent.removeChild(this)
        this.destroy()
    }
}