import { Container, Sprite, Text } from "pixi.js";
import { images } from "../../../app/assets";
import { EventHub, events } from "../../../app/events";
import { styles } from "../../../app/styles";
import { catapultsCount, towerHP, wizardsCount } from "../../state";
import Archer from "./Archer";
import Catapult from "./Catapult";
import Wizard from "./Wizard";

const WIZARD_POINTS = [ {x: -66, y: 0}, {x: 66, y: 0}, {x: 0, y: -66}, {x: 0, y: 66} ]
const CATAPULT_POINTS = [ {x: 36, y: 36}, {x: -36, y: -36}, {x: -36, y: 36}, {x: 36, y: -36} ]

export default class Tower extends Container {
    constructor(
        arrowPoints, arrowsOnGround, arrowsContainer,
        catapultStones, lightnings, enemies, particles
    ) {
        super()

        this.image = new Sprite(images.tower)
        this.image.anchor.set(0.5)
        this.addChild(this.image)

        for(let i = 0; i < catapultsCount; i++) {
            // startShutTimeoutRate
            const str = 0.25 * (i + 1)
            const x = CATAPULT_POINTS[i].x
            const y = CATAPULT_POINTS[i].y
            this.addChild(
                new Catapult(x, y, catapultStones, enemies, str, particles)
            )
        }

        for(let i = 0; i < wizardsCount; i++) {
            // startShutTimeoutRate
            const str = 0.25 * (i + 1)
            this.addChild(
                new Wizard(WIZARD_POINTS[i].x, WIZARD_POINTS[i].y, lightnings, enemies, str)
            )
        }
 
        this.addChild(
            new Archer(arrowPoints, arrowsOnGround, arrowsContainer)
        )

        this.hp = towerHP
        this.hpText = new Text({text: this.hp, style: styles.loading})
        this.hpText.position.set(0, -80)
        this.addChild(this.hpText)

        EventHub.on(events.setDamage, this.getDamage, this)
    }

    getDamage(value) {
        this.hp -= value
        this.hpText.text = this.hp
    }

    kill() {
        EventHub.off(events.setDamage, this.getDamage, this)
    }
}