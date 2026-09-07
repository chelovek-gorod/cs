import { Container, Graphics, Text } from "pixi.js"
import { styles } from "../../app/styles"
import { setCursorPointer } from "../../utils/functions"
import { setTrapsOnMap, closePopup, setEnemyFirstWave } from "../../app/events"

export default class Trapping extends Container {
    constructor(popup) {
        super()
        this.popup = popup

        // Заголовок
        this.title = new Text({
            text: 'ADD TRAPS',
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        this.isActive = false
 
        this.addChild( this.createButton(-160, 0, 'ADD', 'SET TRAPS', 'before round') )
        this.addChild( this.createButton(160, 0, 'PASS', 'START ROUND', 'without traps') )
    }

    createButton(x, y, type, title, description) {
        const btn = new Container()
        btn.position.set(x, y)

        const bg = new Graphics()
        bg.roundRect(-150, -80, 300, 160, 24)
        bg.fill(0xff00ff)
        bg.stroke({ width: 4, color: 0x660066 })
        btn.addChild(bg)

        const titleText = new Text({ text: title, style: styles.damage })
        titleText.anchor.set(0.5)
        titleText.position.set(0, -20)
        btn.addChild(titleText)

        const descriptionText = new Text({ text: description, style: styles.damage })
        descriptionText.anchor.set(0.5)
        descriptionText.position.set(0, 20)
        btn.addChild(descriptionText)

        setCursorPointer(btn)
        btn.on('pointerdown', () => this.onButtonClick(btn))

        btn.titleText = titleText
        btn.descriptionText = descriptionText
        btn.bg = bg

        btn.type = type

        return btn
    }

    setActive(isActive) {
        this.isActive = isActive
    }

    onButtonClick(btn) {
        if (!this.isActive) return

        this.isActive = false
        if(btn.type === 'ADD') setTrapsOnMap()
        else setEnemyFirstWave()

        closePopup()
    }
}