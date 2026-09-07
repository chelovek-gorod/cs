import { AnimatedSprite, Graphics } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";

const DRAGON_TOWER_OFFSET = 180
const DRAGON_FLY_SPEED = 0.0006
const DRAGON_HEAD_OFFSET = 100
const DRAGON_AIM_ANGLE_OFFSET = 0.36
const DRAGON_ICE_COUNT = 12
export const dragonIceTime = 1200
const dragonShootTimeout = 2400
const dragonShootDuration = 900
export const dragonShootDistance = 120
export const dragonShootRadius = 32
const DRAGON_ATTACK_AREA_ANGLE_OFFSET = -0.2 // подгони под визуал струи

export default class Dragon extends AnimatedSprite {
    constructor(enemies, emitIce) {
        super(atlases.dragon.animations.fly)

        this.anchor.set(0.5)
        this.position.set(0, -DRAGON_TOWER_OFFSET)
        this.rotation = 0

        this.animationSpeed = 0.5
        this.play()

        this.enemies = enemies
        this.emitIce = emitIce

        this.isOnAttack = false
        this.timer = dragonShootTimeout

        this.debugGraphics = new Graphics()
        this.addChild(this.debugGraphics)

        tickerAdd(this)
    }

    updateDebugCircle(targetX, targetY) {
        const dx = targetX - this.x
        const dy = targetY - this.y

        // Поворачиваем вектор на -this.rotation для перевода в локальные координаты дракона
        const cos = Math.cos(this.rotation)
        const sin = Math.sin(this.rotation)
        const localX = dx * cos + dy * sin
        const localY = -dx * sin + dy * cos

        this.debugGraphics.clear()
        this.debugGraphics.circle(localX, localY, dragonShootRadius)
        this.debugGraphics.stroke({ width: 2, color: 0xff0000 })
    }

    attack() {
        const baseDirX = Math.cos(this.rotation)
        const baseDirY = Math.sin(this.rotation)

        const headX = this.x + baseDirX * DRAGON_HEAD_OFFSET
        const headY = this.y + baseDirY * DRAGON_HEAD_OFFSET

        const baseAngle = Math.atan2(baseDirY, baseDirX)

        // Частицы
        const aimAngle = baseAngle + DRAGON_AIM_ANGLE_OFFSET
        const dirX = Math.cos(aimAngle)
        const dirY = Math.sin(aimAngle)

        // Точка атаки
        const attackAngle = baseAngle + DRAGON_ATTACK_AREA_ANGLE_OFFSET
        const attackDirX = Math.cos(attackAngle)
        const attackDirY = Math.sin(attackAngle)

        this.emitIce(headX, headY, dirX, dirY, DRAGON_ICE_COUNT)

        const targetX = headX + attackDirX * dragonShootDistance
        const targetY = headY + attackDirY * dragonShootDistance
    
        // Проверяем врагов в круге
        const radius = dragonShootRadius
        const radiusSq = radius * radius
    
        for (let i = 0; i < this.enemies.children.length; i++) {
            const enemy = this.enemies.children[i]
            if (enemy.hp <= 0) continue
    
            const dx = enemy.x - targetX
            const dy = enemy.y - targetY
            const distSq = dx * dx + dy * dy
    
            if (distSq <= radiusSq) {
                enemy.onIce(dragonIceTime)
            }
        }
    
        // Отрисовка отладки
        this.updateDebugCircle(targetX, targetY)
    }

    tick(deltaMs) {
        this.rotation += DRAGON_FLY_SPEED * deltaMs
    
        this.position.set(
            Math.sin(this.rotation) * DRAGON_TOWER_OFFSET,
            -Math.cos(this.rotation) * DRAGON_TOWER_OFFSET
        )

        if (this.isOnAttack) this.attack()

        this.timer -= deltaMs
        if (this.timer > 0) return

        this.isOnAttack = !this.isOnAttack
        this.timer = this.isOnAttack ? dragonShootDuration :dragonShootTimeout

        if (!this.isOnAttack) this.debugGraphics.clear()
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        this.destroy()
    }
}