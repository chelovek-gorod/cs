import { AnimatedSprite, Container, Graphics, Sprite, Text } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases, images } from "../../../app/assets";
import { EventHub, events } from "../../../app/events";
import { styles } from "../../../app/styles";
import { arrowReloadTimeout, arrows, arrowShootTimeout } from "../../state";
import { createArrow } from "./Arrow";


export default class Archer extends Container {
    constructor(arrowPoints, arrowsOnGround, arrowsContainer) {
        super()

        this.archer = new AnimatedSprite(atlases.archer.animations.shoot)
        this.archer.anchor.set(0.5)
        this.archer.animationSpeed = 0.5
        this.archer.loop = false
        this.addChild(this.archer)

        this.arrowsOnGround = arrowsOnGround
        this.arrowPoints = arrowPoints
        this.arrowsContainer = arrowsContainer

        this.arrows = arrows
        this.shootTimeout = 0
        this.shootPointX = 0
        this.shootPointY = 0
        this.reloadTimeout = 0
        this.targetPoint = null
        this.isPointerDown = false
        this.isReadyToShoot = true

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

        this.arrowsLabelText = new Text({text: 'x' + arrows, style: styles.arrowsCount})
        this.arrowsLabelText.position.set(-2, -10)
        this.arrowsLabel.addChild(this.arrowsLabelText)

        EventHub.on(events.setShootPoint, this.getShootPoint, this)

        tickerAdd(this)
    }

    shoot() {
        this.archer.gotoAndPlay(0)

        const arrow = createArrow(this.shootPointX, this.shootPointY, this.arrowsOnGround)
        this.arrowsContainer.addChild(arrow)

        arrow.arrowPoint.position.set(this.shootPointX, this.shootPointY)
        this.arrowPoints.addChild(arrow.arrowPoint)

        this.isReadyToShoot = false
        this.arrows--
        this.arrowsLabelText.text = 'x' + this.arrows
        if (this.arrows > 0) this.shootTimeout += arrowShootTimeout
        else this.reloadTimeout += arrowReloadTimeout
    }

    getShootPoint(data) { // {x: data.x, y: data.y, type: 'up'}
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

            //this.arrowsLabelLine.scale.x = Math.min(1, 1 - this.reloadTimeout / arrowReloadTimeout)
            const size = 50 * Math.min(1, 1 - this.reloadTimeout / arrowReloadTimeout)
            this.arrowsLabelBg.clear()
            this.arrowsLabelBg.roundRect(-25, -10, size, 20, 6)
            this.arrowsLabelBg.fill(0xffffff)
            this.arrowsLabelBg.alpha = 0.5
    
            if (this.reloadTimeout <= 0) {
                this.arrows = arrows
                this.isReadyToShoot = true
                this.arrowsLabelText.text = 'x' + this.arrows
                if (this.isPointerDown) this.shoot()
            }
        }
    }

    kill() {
        EventHub.off(events.setShootPoint, this.getShootPoint, this)
        tickerRemove(this)
    }
}