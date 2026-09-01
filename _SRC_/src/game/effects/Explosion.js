import { AnimatedSprite, Graphics } from "pixi.js";
import { atlases } from "../../app/assets";


export default class Explosion extends AnimatedSprite {
    constructor(x, y, atlasName, radius) {
        super(atlases[atlasName].animations.effect)

        const visualRadius = atlasName === 'explosion_stone' ? 64 : 128
        const scale = radius / visualRadius
        this.scale.set(scale)

        this.position.set(x, y)
        this.anchor.set(0.5)
        this.rotation = Math.random()
        this.animationSpeed = 0.5
        this.loop = false
        this.onComplete = this.kill.bind(this)
        this.play()

        this.damageCircle = new Graphics()
        this.damageCircle.circle(0, 0, visualRadius)
        this.damageCircle.stroke({ width: 2, color: 0xff0000 })
        this.addChild(this.damageCircle)
    }

    kill() {
        this.parent.removeChild(this)
        this.destroy({children: true})
    }
}