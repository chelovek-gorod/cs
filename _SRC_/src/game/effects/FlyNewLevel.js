import { Sprite, Container, Text } from "pixi.js";
import { kill, tickerAdd } from "../../app/application";
import { atlases } from "../../app/assets";
import { styles } from "../../app/styles";
import { addCoins } from "../state";

export default class FlyNewLevel extends Container {
    constructor() {
        super()

        this.cup = new Sprite(atlases.ui.textures.cup)
        this.cup.scale.set(-1, 1)
        this.cup.anchor.set(0.5, 1)
        this.addChild(this.cup)

        this.coin = new Sprite(atlases.ui.textures.coin)
        this.coin.scale.set(0.4)
        this.coin.anchor.set(0, 0)
        this.addChild(this.coin)

        this.coinText = new Text({text: '+' + (addCoins - 1), style: styles.coins})
        this.coinText.scale.set(1.2)
        this.coinText.anchor.set(1, 0)
        this.addChild(this.coinText)

        this.position.set(0, 350)

        this.lifeTime = 900
        this.alphaStep = 0.0003
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