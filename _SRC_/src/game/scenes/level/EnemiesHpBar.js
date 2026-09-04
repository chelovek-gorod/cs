import { Container, Sprite } from "pixi.js";
import { images } from "../../../app/assets";
import { createObjectPool } from "../../../utils/pool";

const HP_BARS_POOL = createObjectPool(100)

export function createHpBar(x, y, maxHp) {
    let hpBar = HP_BARS_POOL.get()
    if (hpBar) {
        hpBar.reset(x, y, maxHp)
    } else {
        hpBar = new HpBar(x, y, maxHp)
        HP_BARS_POOL.add(hpBar)
    }
    return hpBar
}

class HpBar extends Container {
    constructor(x, y) {
        super()

        this.hpBg = new Sprite(images.hp_bar_bg)
        this.hpBg.position.set(-28, -64)
        this.addChild(this.hpBg)
        this.hpLine = new Sprite(images.hp_bar_line)
        this.hpLine.position.set(-25, -62)
        this.addChild(this.hpLine)

        this.reset(x, y)
    }
  
    reset(x, y) {
        this.position.set(x, y)
        this.hpLine.tint = 0x00ff00
        this.hpLine.scale.x = 1
    }

    setLineScale(scale) {
        this.hpLine.scale.x = scale
        if (scale > 0.4) this.hpLine.tint = 0x00ff00
        else if (scale > 0.25) this.hpLine.tint = 0xffff00
        else if (scale > 0.12) this.hpLine.tint = 0xff7700
        else this.hpLine.tint = 0xff0000
    }

    release() {
        if (this.parent) this.parent.removeChild(this)
        HP_BARS_POOL.put(this)
    }
}