import { Container, Graphics, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { removeCursorPointer, setCursorPointer } from "../../utils/functions"

export default class PopupButton extends Container {
    constructor(title, subtitle, description, clickAction, checkAvailable, x, y) {
        super()

        this.position.set(x, y)
        
        this.checkAvailable = checkAvailable
        this.isAvailable = checkAvailable()
        this.clickAction = clickAction

        this.alpha = this.isAvailable ? 1 : 0.5

        this.bg = new Graphics()
        this.addChild(this.bg)
        this.bg.roundRect(-100, -40, 200, 80, 16)
        this.bg.fill(0x6600ff)
        this.bg.stroke({ width: 3, color: 0x000000 })

        this.title = new Text({ text: title, style: styles.damage })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -25)
        this.addChild(this.title)

        this.subtitle = new Text({ text: subtitle, style: styles.damage })
        this.subtitle.anchor.set(0.5)
        this.subtitle.position.set(0, 0)
        this.subtitle.scale.set(0.8)
        this.addChild(this.subtitle)

        this.description = new Text({ text: description, style: styles.damage })
        this.description.anchor.set(0.5)
        this.description.position.set(0, 25)
        this.addChild(this.description)

        setCursorPointer(this)
        this.on('pointerup', this.getClick, this)
    }

    updateAvailable() {
        const isAvailable = this.checkAvailable()
        this.setActive(isAvailable)
    }

    setActive(isAvailable) {
        if (this.isAvailable === isAvailable) return

        this.isAvailable = isAvailable
        this.alpha = isAvailable ? 1 : 0.5
    }

    setSubtitle(text) {
        this.subtitle.text = text
    }
    setDescription(text) {
        this.description.text = text
    }

    getClick() {
        if (!this.isAvailable) return

        this.clickAction()
    }

    kill() {
        this.checkAvailable = null
        this.parent.removeChild(this)
        removeCursorPointer(this)
        this.off('pointerup', this.getClick, this)
        this.destroy({children: true})
    }
}