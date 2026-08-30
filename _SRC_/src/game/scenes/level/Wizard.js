import { AnimatedSprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases, sounds } from "../../../app/assets";
import { soundPlay } from "../../../app/sound";
import { drawLightning } from "../../../utils/lightning";
import { getWizardPowerStep, getWizardMaxDistance, wizardPower, 
    wizardTargetsCount, wizardShutDistance, wizardShutTimeout } from "../../state";

const LIGHTNING_FORWARD_OFFSET = 40
const LIGHTNING_SIDE_OFFSET = 8

export default class Wizard extends AnimatedSprite {
    constructor(x, y, lightnings, enemies, startShutTimeoutRate) {
        super(atlases.wizard.animations.shut)
        
        this.anchor.set(0.5)
        this.animationSpeed = 0.5
        this.loop = false
        this.position.set(x, y)

        this.lightnings = lightnings
        this.enemies = enemies

        this.shutTimeout = wizardShutTimeout * startShutTimeoutRate
        this.shutCount = 0
        this.shutSqDist = wizardShutDistance * wizardShutDistance
        this.shutPoint = {x: 0, y: 0}
        this.startPoint = {x: 0, y: 0}
        this.targetPoint = null
        this.chainTargets = []   // враги в цепи
        this.chainDamages = []   // для отладки

        tickerAdd(this)
    }

    shut() {
        this.shutTimeout = wizardShutTimeout
    
        // --- Найти первую цель (ближайшую) ---
        let nearestEnemy = null
        let nearestDist = Infinity
        const enemies = this.enemies.children
        const enemiesCount = enemies.length
    
        for (let i = 0; i < enemiesCount; i++) {
            const dx = this.x - enemies[i].x
            const dy = this.y - enemies[i].y
            const dist = dx * dx + dy * dy
            if (dist < nearestDist) {
                nearestDist = dist
                nearestEnemy = enemies[i]
            }
        }
    
        if (!nearestEnemy) return
        if (nearestDist > this.shutSqDist) return
    
        // Повернуть мага к первой цели
        this.rotation = Math.atan2(nearestEnemy.y, nearestEnemy.x)
    
        // --- Подготовить стартовую точку молнии ---
        const startDX = Math.cos(this.rotation)
        const startDY = Math.sin(this.rotation)
        this.startPoint.x = this.x + startDX * LIGHTNING_FORWARD_OFFSET - startDY * LIGHTNING_SIDE_OFFSET
        this.startPoint.y = this.y + startDY * LIGHTNING_FORWARD_OFFSET + startDX * LIGHTNING_SIDE_OFFSET
    
        // --- Построить цепочку целей ---
        this.chainTargets = [nearestEnemy]
        const usedSet = new Set([nearestEnemy])
        const maxJumpDist = getWizardMaxDistance()
        const maxJumpSq = maxJumpDist * maxJumpDist
    
        let currentTarget = nearestEnemy
        const step = getWizardPowerStep()
    
        for (let i = 1; i < wizardTargetsCount; i++) {
            let nextEnemy = null
            let nextDist = Infinity
    
            // Перебираем всех врагов, кроме уже использованных
            for (let j = 0; j < enemiesCount; j++) {
                const enemy = enemies[j]
                if (usedSet.has(enemy)) continue
    
                const dx = currentTarget.x - enemy.x
                const dy = currentTarget.y - enemy.y
                const dist = dx * dx + dy * dy
    
                if (dist < nextDist && dist <= maxJumpSq) {
                    nextDist = dist
                    nextEnemy = enemy
                }
            }
    
            if (!nextEnemy) break
    
            this.chainTargets.push(nextEnemy)
            usedSet.add(nextEnemy)
            currentTarget = nextEnemy
        }
    
        // --- Нанести урон и сохранить уроны ---
        this.chainDamages = []
        for (let i = 0; i < this.chainTargets.length; i++) {
            const damage = i === 0 
                ? wizardPower 
                : Math.max(1, wizardPower - i * step)
            this.chainDamages.push(damage)
            this.chainTargets[i].onLightning(damage)
        }
    
        // --- Отрисовать все сегменты молнии ---
        this.lightnings.clear()
        drawLightning(this.startPoint, this.chainTargets[0], this.lightnings)
    
        for (let i = 1; i < this.chainTargets.length; i++) {
            drawLightning(this.chainTargets[i - 1], this.chainTargets[i], this.lightnings)
        }
    
        this.shutCount = 6
        this.gotoAndPlay(0)
        soundPlay(sounds.se_wizard_shut)
    }

    tick(deltaMs) {
        if (this.shutCount > 0) {
            this.lightnings.clear()
            this.shutCount--
    
            if (this.shutCount > 0 && this.chainTargets.length > 0) {
                // Перерисовываем все сегменты цепи
                drawLightning(this.startPoint, this.chainTargets[0], this.lightnings)
                for (let i = 1; i < this.chainTargets.length; i++) {
                    drawLightning(this.chainTargets[i - 1], this.chainTargets[i], this.lightnings)
                }
            }
        }

        if (this.shutTimeout > 0) this.shutTimeout -= deltaMs
        else this.shut()
    }

    kill() {
        tickerRemove(this)
    }
}