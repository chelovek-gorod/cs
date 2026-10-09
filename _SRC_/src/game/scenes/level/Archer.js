import { AnimatedSprite, Container, Graphics, Sprite, Text } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases, images } from "../../../app/assets";
import { EventHub, events } from "../../../app/events";
import { styles } from "../../../app/styles";
import { gameState } from "../../state";
import { createArrow } from "./Arrow";

const RAGE_MAX = 120
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

        this.rage = 0
        this.isBerserk = false
        this.berserkShoots = 0

        this.arrowsLabel = new Container()
        this.arrowsLabel.position.set(0, 30)
        this.addChild(this.arrowsLabel)

        this.arrowsLabelBg = new Graphics()
        this.arrowsLabelBg.roundRect(-25, -10, 50, 20, 6)
        this.arrowsLabelBg.fill(0xffffff)
        this.arrowsLabelBg.alpha = 0.5
        this.arrowsLabel.addChild(this.arrowsLabelBg)

        /*
        this.arrowsLabelBg = new Sprite(images.icon_bow_bg)
        this.arrowsLabelBg.anchor.set(0.5)
        this.arrowsLabel.addChild(this.arrowsLabelBg)

        this.arrowsLabelLine = new Sprite(images.icon_bow_line)
        this.arrowsLabelLine.anchor.set(0, 0.5)
        this.arrowsLabelLine.position.set(-25, 0)
        this.arrowsLabel.addChild(this.arrowsLabelLine)
        */

        this.arrowsLabelIcon = new Sprite(images.icon_bow)
        this.arrowsLabelIcon.anchor.set(0.5)
        this.arrowsLabel.addChild(this.arrowsLabelIcon)

        this.arrowsLabelText = new Text({text: 'x' + this.arrows, style: styles.arrowsCount})
        this.arrowsLabelText.position.set(-2, -10)
        this.arrowsLabel.addChild(this.arrowsLabelText)

        EventHub.on(events.setShootPoint, this.getShootPoint, this)
        EventHub.on(events.addRage, this.addRage, this)

        tickerAdd(this)
    }

    addRage(amount) {
        if (this.isBerserk) return

        this.rage += amount
        if (this.rage >= RAGE_MAX) {
            this.isBerserk = true
            this.rage = 0
            this.berserkShoots = gameState.berserkShoots
            this.isPointerDown = false
            this.archer.tint = BERSERK_BG_TINT
        }
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

    shoot() {
        this.archer.gotoAndPlay(0)
    
        const arrow = createArrow(this.shootPointX, this.shootPointY, this.isBerserk)
        this.arrowsContainer.addChild(arrow)
    
        arrow.arrowPoint.position.set(this.shootPointX, this.shootPointY)
        this.arrowPoints.addChild(arrow.arrowPoint)
    
        this.isReadyToShoot = false
    
        if (this.isBerserk) {
            this.berserkShoots--
            if (this.berserkShoots <= 0) {
                this.isBerserk = false
                this.berserkShoots = 0
                this.archer.tint = null
            }
            this.shootTimeout += gameState.arrowShootTimeout * BERSERK_SHOOT_RATE
        } else {
            this.arrows--
            this.arrowsLabelText.text = 'x' + this.arrows
            if (this.arrows > 0) this.shootTimeout += gameState.arrowShootTimeout
            else this.reloadTimeout += gameState.arrowReloadTimeout
        }
    }

    getShootPoint(data) { // {x: data.x, y: data.y, type: 'up'}
        if (this.isBerserk) return

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

            const size = 50 * Math.min(1, 1 - this.reloadTimeout / gameState.arrowReloadTimeout)
            this.arrowsLabelBg.clear()
            this.arrowsLabelBg.roundRect(-25, -10, size, 20, 6)
            this.arrowsLabelBg.fill(0xffffff)
            this.arrowsLabelBg.alpha = 0.5
    
            if (this.reloadTimeout <= 0) {
                this.arrows = gameState.arrowsCount
                this.isReadyToShoot = true
                this.arrowsLabelText.text = 'x' + this.arrows
                if (this.isPointerDown) this.shoot()
            }
        }
    }

    tickBerserk(deltaMs) {
        if (this.shootTimeout > 0) {
            this.shootTimeout -= deltaMs
            if (this.shootTimeout <= 0) this.isReadyToShoot = true
        } else {
            const target = this.getNearestEnemy()
            if (!target) return
            
            this.shootPointX = target.x
            this.shootPointY = target.y
            this.archer.rotation = Math.atan2(target.y, target.x)
            this.shoot()
        }
    }

    kill() {
        EventHub.off(events.setShootPoint, this.getShootPoint, this)
        EventHub.off(events.addRage, this.addRage, this)
        tickerRemove(this)
    }
}