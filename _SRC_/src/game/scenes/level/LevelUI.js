import { Container, Text } from "pixi.js";
import { styles } from "../../../app/styles";
import { gold, round } from "../../state";


export default class LevelUI extends Container {
    constructor() {
        super()

        this.roundText = new Text({text: `Round ${round}`, style: styles.loading})
        this.roundText.anchor.set(0, 0)
        this.roundText.scale.set(0.5)
        this.addChild(this.roundText)

        this.waveText = new Text({text: `Waves`, style: styles.loading})
        this.waveText.anchor.set(0.5, 0)
        this.addChild(this.waveText)
        this.waveText.scale.set(0.5)

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

    setWaveText(current, waves) {
        this.waveText.text = `Waves ${current}/${waves}`
    }

    setGoldText() {
        this.goldText.text = `Gold ${gold}`
    }
}