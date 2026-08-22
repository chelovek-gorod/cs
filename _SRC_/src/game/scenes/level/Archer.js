import { AnimatedSprite, Container, Sprite, Text } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { atlases, images } from "../../../app/assets";
import { EventHub, events } from "../../../app/events";
import { styles } from "../../../app/styles";
import { arrowReloadTimeout, arrows, arrowShutTimeout } from "../../state";
import { Arrow } from "./Arrow";


export default class Archer extends Container {
    constructor(arrowPoints, arrowsOnGround, arrowsContainer) {
        super()

        this.archer = new AnimatedSprite(atlases.archer.animations.shut)
        this.archer.anchor.set(0.5)
        this.archer.animationSpeed = 0.5
        this.archer.loop = false
        this.addChild(this.archer)

        this.arrowsOnGround = arrowsOnGround
        this.arrowPoints = arrowPoints
        this.arrowsContainer = arrowsContainer

        this.arrows = arrows
        this.shutTimeout = 0
        this.shutPointX = 0
        this.shutPointY = 0
        this.reloadTimeout = 0
        this.targetPoint = null
        this.isPointerDown = false
        this.isReadyToShut = true

        this.arrowsLabel = new Container()
        this.arrowsLabel.position.set(0, 40)
        this.addChild(this.arrowsLabel)

        this.arrowsLabelBg = new Sprite(images.icon_bow_bg)
        this.arrowsLabelBg.anchor.set(0.5)
        this.arrowsLabel.addChild(this.arrowsLabelBg)

        this.arrowsLabelLine = new Sprite(images.icon_bow_line)
        this.arrowsLabelLine.anchor.set(0, 0.5)
        this.arrowsLabelLine.position.set(-25, 0)
        this.arrowsLabel.addChild(this.arrowsLabelLine)

        this.arrowsLabelIcon = new Sprite(images.icon_bow)
        this.arrowsLabelIcon.anchor.set(0.5)
        this.arrowsLabel.addChild(this.arrowsLabelIcon)

        this.arrowsLabelText = new Text({text: 'x' + arrows, style: styles.arrowsCount})
        this.arrowsLabelText.position.set(-2, -10)
        this.arrowsLabel.addChild(this.arrowsLabelText)

        EventHub.on(events.setShutPoint, this.getShutPoint, this)

        tickerAdd(this)
    }

    shut() {
        this.archer.gotoAndPlay(0)

        const arrow = new Arrow(this.shutPointX, this.shutPointY, this.arrowsOnGround)
        this.arrowsContainer.addChild(arrow)

        arrow.arrowPoint.position.set(this.shutPointX, this.shutPointY)
        this.arrowPoints.addChild(arrow.arrowPoint)

        this.isReadyToShut = false
        this.arrows--
        this.arrowsLabelText.text = 'x' + this.arrows
        if (this.arrows > 0) this.shutTimeout += arrowShutTimeout
        else this.reloadTimeout += arrowReloadTimeout
    }

    getShutPoint(data) { // {x: data.x, y: data.y, type: 'up'}
        this.shutPointX = data.x
        this.shutPointY = data.y
        this.archer.rotation = Math.atan2(data.y, data.x)

        if (data.type === 'down') {
            this.isPointerDown = true
            if (this.isReadyToShut) this.shut()
        } else if (data.type === 'up') {
            this.isPointerDown = false
        }
    }

    tick(deltaMs) {
        if (this.isReadyToShut && this.isPointerDown) return this.shut()

        else if (this.shutTimeout > 0) {
            this.shutTimeout -= deltaMs
    
            if (this.shutTimeout <= 0) {
                this.isReadyToShut = true
                if (this.isPointerDown) return this.shut()
            }
        }
        
        else if (this.reloadTimeout > 0) {
            this.reloadTimeout -= deltaMs

            this.arrowsLabelLine.scale.x = Math.min(1, 1 - this.reloadTimeout / arrowReloadTimeout)
    
            if (this.reloadTimeout <= 0) {
                this.arrows = arrows
                this.isReadyToShut = true
                this.arrowsLabelText.text = 'x' + this.arrows
                if (this.isPointerDown) this.shut()
            }
        }
    }

    kill() {
        EventHub.off(events.setShutPoint, this.getShutPoint, this)
        tickerRemove(this)
    }
}