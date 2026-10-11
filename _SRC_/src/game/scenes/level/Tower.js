import { Container, Sprite, Text } from "pixi.js";
import { images } from "../../../app/assets";
import { EventHub, events } from "../../../app/events";
import { styles } from "../../../app/styles";
import { gameState } from "../../state";
import Archer from "./Archer";
import Catapult from "./Catapult";
import Wizard from "./Wizard";

const WIZARD_POINTS = [ {x: -60, y: 0}, {x: 30, y: -48}, {x: 30, y: 48} ]
const CATAPULT_POINTS = [ {x: 60, y: 0}, {x: -30, y: -48}, {x: -30, y: 48} ]
const TOWER_STONES_OFFSET = 96

//const WIZARD_POINTS = [ {x: -66, y: 0}, {x: 66, y: 0}, {x: 0, y: -66}, {x: 0, y: 66} ]
//const CATAPULT_POINTS = [ {x: 36, y: 36}, {x: -36, y: -36}, {x: -36, y: 36}, {x: 36, y: -36} ]

export default class Tower extends Container {
    constructor(arrowPoints, arrowsContainer, smoke, catapultStones, lightnings, enemies, towerStones) {
        super()

        this.isAlive = true

        this.towerStones = towerStones

        this.image = new Sprite(images.tower)
        this.image.anchor.set(0.5)
        this.addChild(this.image)

        for(let i = 0; i < gameState.catapultsCount; i++) {
            // startShootTimeoutRate
            const str = 0.25 * (i + 1)
            const x = CATAPULT_POINTS[i].x
            const y = CATAPULT_POINTS[i].y
            this.addChild(
                new Catapult(x, y, smoke, catapultStones, enemies, str)
            )
        }

        for(let i = 0; i < gameState.wizardsCount; i++) {
            // startShootTimeoutRate
            const str = 0.25 * (i + 1)
            this.addChild(
                new Wizard(WIZARD_POINTS[i].x, WIZARD_POINTS[i].y, lightnings, smoke, enemies, str)
            )
        }
 
        this.addChild(
            new Archer(arrowPoints, arrowsContainer, enemies)
        )

        this.hp = gameState.towerHp
        this.hpText = new Text({text: this.hp, style: styles.loading})
        this.hpText.position.set(0, -80)
        this.addChild(this.hpText)

        EventHub.on(events.setDamage, this.getDamage, this)
    }

    // data = {value:this.damage, x: this.x, y: this.y}
    getDamage(data) {
        if (!this.isAlive) return

        this.hp = Math.max(0, this.hp - data.value)
        this.hpText.text = this.hp

        const angle = Math.atan2(data.y - this.y, data.x - this.x)
        const spawnX = this.x + Math.cos(angle) * TOWER_STONES_OFFSET
        const spawnY = this.y + Math.sin(angle) * TOWER_STONES_OFFSET
        this.towerStones.spawn(spawnX, spawnY, angle, data.value)

        if (this.hp === 0) {
            this.isAlive = false
            this.parent.handleRoundLose()
        }
    }

    kill() {
        EventHub.off(events.setDamage, this.getDamage, this)
    }
}