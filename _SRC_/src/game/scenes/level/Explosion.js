import { AnimatedSprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";


export default class Explosion extends AnimatedSprite {
    constructor(atlasName, x, y, radius = 0, frameDamage = 0, damage = 0, enemies = null) {
        super( atlases[atlasName].animations.effect )

        this.anchor.set(0.5)
        const visualRadius = atlasName === 'explosion_stone' ? 64 : 128
        const scale = radius / visualRadius
        this.scale.set(scale)
        this.position.set(x, y)

        this.animationSpeed = 0.5
        this.loop = false

        if (damage > 0) {
            this.frameDamage = frameDamage
            this.damageRadius = radius
            this.damage = damage
            this.enemies = enemies
            this.isDamageApply = false
            tickerAdd(this)
        }

        this.onComplete = () => this.kill()
        this.play()
    }

    tick() {
        if (this.currentFrame < this.frameDamage || this.isDamageApply) return

        this.isDamageApply = true
        this.setDamage()
    }

    setDamage() {
        const radiusSq = this.damageRadius * this.damageRadius
        const ex = this.x
        const ey = this.y
        const children = this.enemies.children

        const targets = []
        for (let i = 0; i < children.length; i++) {
            const enemy = children[i]
            if (enemy.hp <= 0) continue

            const dx = enemy.x - ex
            const dy = enemy.y - ey
            if (dx * dx + dy * dy <= radiusSq) targets.push(enemy)
        }

        for (let i = 0; i < targets.length; i++) {
            targets[i].setDamage(this.damage, true)
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        this.destroy()
    }
}