import { Container, Text } from "pixi.js";
import { styles } from "../../../app/styles";
import { gold, round } from "../../state";

export default class MenuUI extends Container {
    constructor() {
        super()

        this.roundText = new Text({text: `Round ${round - 1} CLEARED`, style: styles.loading})
        this.roundText.anchor.set(0, 0)
        this.roundText.scale.set(0.5)
        this.addChild(this.roundText)

        this.goldText = new Text({text: `Gold ${gold}`, style: styles.loading})
        this.goldText.anchor.set(1, 0)
        this.goldText.scale.set(0.5)
        this.addChild(this.goldText)
    }

    screenResize(screenData, safeAreaOffsets) {
        const topOffset = 10
        const safeTop = safeAreaOffsets.top || 0
        const pointY = -screenData.centerY + safeTop + topOffset
        this.position.set(0, pointY)

        this.roundText.position.x = (safeAreaOffsets.left || 0) - screenData.centerX + 10
        this.goldText.position.x = (safeAreaOffsets.right || 0) + screenData.centerX - 10
    }

    setGoldText() {
        this.goldText.text = `Gold ${gold}`
    }
}