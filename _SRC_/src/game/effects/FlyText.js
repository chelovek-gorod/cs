import { Text } from "pixi.js";
import { kill, tickerAdd } from "../../app/application";
import { styles } from "../../app/styles";

export default class FlyText extends Text {
    constructor(text, x, y) {
        super({text: text, style: styles.damage}) 
        this.anchor.set(0.5)

        this.position.set(x,y)

        this.lifeTime = 600
        this.alphaStep = 0.0012
        this.flySpeed = 0.18

        tickerAdd(this)
    }

    tick(deltaMs) {
        this.y -= this.flySpeed * deltaMs

        if (this.lifeTime > 0) {
            this.lifeTime -= deltaMs
        } else {
            this.alpha -= this.alphaStep * deltaMs
            if (this.alpha <= 0) kill(this)
        }
    }
}