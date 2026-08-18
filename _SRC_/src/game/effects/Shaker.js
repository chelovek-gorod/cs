import { Container } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../app/application";
import { EventHub, events } from "../../app/events";

const MAX_OFFSET = 20
const DECAY = 0.012 // угасание

export default class Shaker extends Container {
    constructor() {
        super()

        this.powerX = 0
        this.powerY = 0

        EventHub.on( events.shakeScreen, this.addPower, this )
    }

    // data = {powerX, powerY}
    addPower(data) {
        this.powerX = Math.min(data.powerX, MAX_OFFSET)
        this.powerY = Math.min(data.powerY, MAX_OFFSET)
        tickerAdd(this)
    }

    screenResize(screenData) {
        const safeScreenData = {
            width: screenData.width + MAX_OFFSET,
            height: screenData.height + MAX_OFFSET,
            centerX: (screenData.width + MAX_OFFSET) * 0.5,
            centerY: (screenData.height + MAX_OFFSET) * 0.5,
            isLandscape: screenData.isLandscape
        }

        for(let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i]
            if ('screenResize' in child) child.screenResize(safeScreenData)
        }
    }

    tick(delta) {
        if (this.powerX < 1.5 && this.powerY < 1.5) {
            this.x = 0
            this.y = 0

            this.powerX = 0
            this.powerY = 0

            tickerRemove(this)
            return
        }

        this.x = (Math.random() - 0.5) * this.powerX
        this.y = (Math.random() - 0.5) * this.powerY

        const decay = DECAY * delta
        this.powerX = Math.max(0, this.powerX - decay)
        this.powerY = Math.max(0, this.powerY - decay)
    }

    kill() {
        tickerRemove(this)
        EventHub.off( events.shakeScreen, this.addPower, this )
    }
}