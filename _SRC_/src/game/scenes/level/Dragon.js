import { AnimatedSprite, Graphics } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";
import { addDragon } from "../../state";

const TOWER_OFFSET = 160
const FLY_SPEED = 0.0005
const FLY_AWAY_SPEED = 0.09
const FLY_AWAY_ALPHA_STEP = 0.0001
const HEAD_OFFSET = 50  // вынос головы вперед от центра
const AIM_ANGLE_OFFSET = 0.32 // угол смещение прицела ближе к оси вращения дракона
const SPARKS_COUNT = 5
const FUEL = 120
const DAMAGE = 5
const FIRE_DURATION = 600 // длительность залпа
const DAMAGE_TIMEOUT = 120 // длительность залпа
const SHOOT_DISTANCE = 60
const SHOOT_RADIUS = 36
const SCAN_TIMEOUT = 120 // задержка до следующей проверки врагов в зоне AIM
const SCAN_RADIUS = 36  // радиус зоны сканирования (меньше основной)
const SCAN_OFFSET_X = 18
const SCAN_OFFSET_Y = -18
const ATTACK_AREA_ANGLE_OFFSET = -0.2 // подгони под визуал струи
const PARTICLE_FLY_TIME = 90 // время полета частиц от рта до зоны атаки

export default class Dragon extends AnimatedSprite {
    constructor(enemies, emitFire) {
        super(atlases.dragon.animations.fly)

        this.anchor.set(0.5)
        this.position.set(0, -TOWER_OFFSET)
        this.rotation = 0

        this.animationSpeed = 0.5
        this.play()

        this.enemies = enemies
        this.emitFire = emitFire

        this.isOnTarget = false
        this.isOnAttack = false
        this.fuel = FUEL
        this.scanTimeout = SCAN_TIMEOUT
        this.damageTimeout = DAMAGE_TIMEOUT
        this.fireTimeout = 0
        this.particleTimeout = 0
        this.isParticleFrame = false

        this.scanLocalPoint = {x: HEAD_OFFSET + SHOOT_DISTANCE + SCAN_OFFSET_X, y: SCAN_OFFSET_Y}
        this.attackLocalPoint = {
            x: HEAD_OFFSET + SHOOT_DISTANCE * Math.cos(ATTACK_AREA_ANGLE_OFFSET),
            y: SHOOT_DISTANCE * Math.sin(ATTACK_AREA_ANGLE_OFFSET)
        }
        // this.attackLocalPoint = {x: HEAD_OFFSET + SHOOT_DISTANCE, y: 0 }
        this.headLocalPoint = {x: HEAD_OFFSET, y: 0}

        this.circles = new Graphics()
        this.addChild(this.circles)
        this.updateCircles()

        tickerAdd(this)
    }

    updateCircles(isOnAttack = false) {
        return
        this.circles.clear()

        // Жёлтый круг — зона атаки
        const attackCircleX = HEAD_OFFSET + SHOOT_DISTANCE
        const attackCircleY = 0
        this.circles.circle(attackCircleX, attackCircleY, SHOOT_RADIUS)
        this.circles.stroke({ width: 2, color: isOnAttack ? 0xff0000 : 0xffff00 })
        
        // Красный круг — зона сканирования (смещён вперёд от жёлтого)
        const scanCircleX = attackCircleX + SCAN_OFFSET_X
        const scanCircleY = SCAN_OFFSET_Y
        this.circles.circle(scanCircleX, scanCircleY, SCAN_RADIUS)
        this.circles.stroke({ width: 2, color: 0xff0000 })
    }

    scanEnemies() {
        this.scanTimeout = SCAN_TIMEOUT

        const localScan = this.parent.toLocal(this.scanLocalPoint, this)
        const radiusSq = SCAN_RADIUS * SCAN_RADIUS
    
        for (let i = 0; i < this.enemies.children.length; i++) {
            const enemy = this.enemies.children[i]
            if (enemy.hp <= 0) continue
    
            const dx = enemy.x - localScan.x
            const dy = enemy.y - localScan.y
            if (dx * dx + dy * dy <= radiusSq) {
                // ВРАГ ОБНАРУЖЕН

                // проверяем, не запущена ли атака
                if (!this.isOnAttack && !this.isOnTarget) {
                    this.isOnTarget = true
                    this.particleTimeout = PARTICLE_FLY_TIME
                }
                
                this.fireTimeout = FIRE_DURATION
            }
        }
    }

    addFire() {
        this.isParticleFrame = !this.isParticleFrame
        if (!this.isParticleFrame) return

        const headGlobal = this.parent.toLocal(this.headLocalPoint, this)
        const dirX = Math.cos(this.rotation + AIM_ANGLE_OFFSET)
        const dirY = Math.sin(this.rotation + AIM_ANGLE_OFFSET)

        this.emitFire(headGlobal.x, headGlobal.y, dirX, dirY, SPARKS_COUNT)
    }

    addDamage() {
        const localAttack = this.parent.toLocal(this.attackLocalPoint, this)
        const radiusSq = SHOOT_RADIUS * SHOOT_RADIUS
    
        for (let i = 0; i < this.enemies.children.length; i++) {
            const enemy = this.enemies.children[i]
            if (enemy.hp <= 0) continue
    
            const dx = enemy.x - localAttack.x
            const dy = enemy.y - localAttack.y
            if (dx * dx + dy * dy <= radiusSq) {
                enemy.setDamage(DAMAGE)
            }
        }

        this.fuel--
        if (this.fuel <= 0) addDragon(-1)
    }

    tick(deltaMs) {
        if (this.fuel <= 0) {
            // Летим по прямой, сохраняя текущее направление
            const speed = FLY_AWAY_SPEED * deltaMs
            this.position.x += Math.cos(this.rotation) * speed
            this.position.y += Math.sin(this.rotation) * speed
        
            // Постепенное исчезновение
            this.alpha -= FLY_AWAY_ALPHA_STEP * deltaMs
            if (this.alpha <= 0) this.kill()
            
            return
        }

        // полет
        this.rotation += FLY_SPEED * deltaMs
        this.position.set(
            Math.sin(this.rotation) * TOWER_OFFSET,
            -Math.cos(this.rotation) * TOWER_OFFSET
        )

        // скан
        this.scanTimeout -= deltaMs
        if (this.scanTimeout <= 0) this.scanEnemies()

        // выпуск частиц огня
        if (this.fireTimeout > 0) {
            this.fireTimeout -= deltaMs
            if (this.fireTimeout <= 0) {
                this.isOnAttack = false
                this.updateCircles(false)
            }
            else this.addFire()
        }

        // начало атаки
        if (this.isOnTarget) {
            this.particleTimeout -= deltaMs
            if (this.particleTimeout <= 0) {
                this.isOnTarget = false
                this.isOnAttack = true
                this.updateCircles(true)
            }
        }

        // атака
        if (this.isOnAttack) {
            this.damageTimeout -= deltaMs
            if (this.damageTimeout <= 0) this.addDamage()
        }
    }

    kill() {
        tickerRemove(this)
        if (this.parent) this.parent.removeChild(this)
        this.destroy()
    }
}