import { AnimatedSprite, Container, Graphics, Sprite, Text } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases, images } from "../../../app/assets";
import { EventHub, events, updateArrows, updateArrowsReload, updateRage } from "../../../app/events";
import { styles } from "../../../app/styles";
import { berserkReadyRage, gameState } from "../../state";
import { createArrow } from "./Arrow";

const BERSERK_BG_TINT = 0xff4400
const BERSERK_SHOOT_RATE = 0.667
const BERSERK_MAX_DISTANCE = 360
const BERSERK_MAX_DIST_SQ  = BERSERK_MAX_DISTANCE * BERSERK_MAX_DISTANCE

export default class Archer extends Container {
    constructor(arrowPoints, arrowsContainer, enemiesContainer) {
        super()

        this.archer = new AnimatedSprite(atlases.archer.animations.shoot)
        this.archer.anchor.set(0.5)
        this.archer.animationSpeed = 0.5
        this.archer.loop = false
        this.addChild(this.archer)

        this.arrowPoints = arrowPoints
        this.arrowsContainer = arrowsContainer
        this.enemiesContainer = enemiesContainer

        this.arrows = gameState.arrowsCount
        this.shootTimeout = 0
        this.shootPointX = 0
        this.shootPointY = 0
        this.reloadTimeout = 0
        this.targetPoint = null
        this.isPointerDown = false
        this.isReadyToShoot = true

        this.rage = gameState.berserkStartRage
        this.isBerserk = false
        this.berserkClickPoint = null
        requestAnimationFrame( () => updateRage(this.rage) )

        this.isIceActive = false

        EventHub.on(events.setShootPoint, this.getShootPoint, this)
        EventHub.on(events.addRage, this.addRage, this)
        EventHub.on(events.rageClick, this.triggerBerserk, this)
        EventHub.on(events.iceClick, this.toggleIce, this)
        EventHub.on(events.reloadClick, this.triggerReload, this)

        tickerAdd(this)
    }

    toggleIce() {
        if (gameState.iceCount <= 0 || this.isBerserk) return
        this.isIceActive = !this.isIceActive
    }

    addRage(amount) {
        if (this.isBerserk) return
        if (this.rage >= berserkReadyRage) return
    
        this.rage += amount
        updateRage(this.rage)
    }

    triggerBerserk() {
        if (this.isBerserk) return
        if (this.rage < berserkReadyRage) return
    
        this.isIceActive = false

        this.rage -= berserkReadyRage
        updateRage(0)
        this.isBerserk = true
        this.berserkClickPoint = null
        this.archer.tint = BERSERK_BG_TINT
    
        // Мгновенная перезарядка в полный колчан
        this.reloadTimeout = 0
        this.shootTimeout = 0
        this.isReadyToShoot = true
        this.arrows = gameState.arrowsCount
        updateArrows(this.arrows)
    }

    getNearestEnemy() {
        const enemies = this.enemiesContainer.children
        let nearest = null
        let nearestSqDist = Infinity
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i]
            const sq = e.x * e.x + e.y * e.y  // расстояние от башни (0,0)
            if (sq > BERSERK_MAX_DIST_SQ) continue
            if (sq < nearestSqDist) {
                nearestSqDist = sq
                nearest = e
            }
        }
        return nearest
    }

    triggerReload() {
        if (this.isBerserk || this.reloadTimeout > 0 || this.arrows === 0) return
    
        this.arrows = 0
        this.shootTimeout = 0
        this.isReadyToShoot = false
        this.reloadTimeout = gameState.arrowReloadTimeout
    
        updateArrows(0)
    }

    shoot() {
        if (this.arrows <= 0) return
    
        this.archer.gotoAndPlay(0)
    
        let isIceShot = false
        if (this.isIceActive && gameState.iceCount > 0) {
            isIceShot = true
            gameState.iceCount--
            if (gameState.iceCount === 0) this.isIceActive = false
        }
    
        const arrow = createArrow(this.shootPointX, this.shootPointY, this.isBerserk, isIceShot)
        this.arrowsContainer.addChild(arrow)
        arrow.arrowPoint.position.set(this.shootPointX, this.shootPointY)
        this.arrowPoints.addChild(arrow.arrowPoint)
    
        this.isReadyToShoot = false
        this.arrows--
        updateArrows(this.arrows)
    
        if (this.isBerserk) {
            if (this.arrows > 0) {
                this.shootTimeout += gameState.arrowShootTimeout * BERSERK_SHOOT_RATE
            } else {
                this.isBerserk = false
                this.archer.tint = null
                this.shootTimeout = 0
                this.reloadTimeout = gameState.arrowReloadTimeout
                updateRage(this.rage)
            }
        } else {
            if (this.arrows > 0) this.shootTimeout += gameState.arrowShootTimeout
            else this.reloadTimeout += gameState.arrowReloadTimeout
        }
    }

    getShootPoint(data) { // {x: data.x, y: data.y, type: 'up'}
        if (this.isBerserk) {
            if (data.type === 'down') this.berserkClickPoint = {x: data.x, y: data.y}
            return
        }

        this.shootPointX = data.x
        this.shootPointY = data.y
        this.archer.rotation = Math.atan2(data.y, data.x)

        if (data.type === 'down') {
            this.isPointerDown = true
            if (this.isReadyToShoot) this.shoot()
        } else if (data.type === 'up') {
            this.isPointerDown = false
        }
    }

    tick(deltaMs) {
        if (this.isBerserk) return this.tickBerserk(deltaMs)
        if (this.isReadyToShoot && this.isPointerDown) return this.shoot()

        else if (this.shootTimeout > 0) {
            this.shootTimeout -= deltaMs
    
            if (this.shootTimeout <= 0) {
                this.isReadyToShoot = true
                if (this.isPointerDown) return this.shoot()
            }
        }
        
        else if (this.reloadTimeout > 0) {
            this.reloadTimeout -= deltaMs
            const reloadRate = Math.max(0, this.reloadTimeout / gameState.arrowReloadTimeout)
            updateArrowsReload(reloadRate)

            if (this.reloadTimeout <= 0) {
                this.arrows = gameState.arrowsCount
                this.isReadyToShoot = true
                updateArrows(this.arrows)
                if (this.isPointerDown) this.shoot()
            }
        }
    }

    tickBerserk(deltaMs) {
        if (this.shootTimeout > 0) {
            this.shootTimeout -= deltaMs
            if (this.shootTimeout <= 0) this.isReadyToShoot = true
            return
        }
    
        if (!this.isReadyToShoot) return
    
        if (this.berserkClickPoint) {
            this.shootPointX = this.berserkClickPoint.x
            this.shootPointY = this.berserkClickPoint.y
            this.berserkClickPoint = null
        } else {
            const target = this.getNearestEnemy()
            if (!target) return
            this.shootPointX = target.x
            this.shootPointY = target.y
        }
    
        this.archer.rotation = Math.atan2(this.shootPointY, this.shootPointX)
        this.shoot()
    }

    kill() {
        EventHub.off(events.setShootPoint, this.getShootPoint, this)
        EventHub.off(events.addRage, this.addRage, this)
        EventHub.off(events.rageClick, this.triggerBerserk, this)
        EventHub.off(events.iceClick, this.toggleIce, this)
        EventHub.off(events.reloadClick, this.triggerReload, this)
        tickerRemove(this)
    }
}