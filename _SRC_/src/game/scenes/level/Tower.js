import { Container, Sprite, Text } from "pixi.js";
import { images } from "../../../app/assets";
import { EventHub, events } from "../../../app/events";
import { styles } from "../../../app/styles";
import { catapultsCount, towerHP, wizardsCount } from "../../state";
import Archer from "./Archer";
import Catapult from "./Catapult";
import Wizard from "./Wizard";

const WIZARD_POINTS = [ {x: -66, y: 0}, {x: 66, y: 0}, {x: 0, y: -66}, {x: 0, y: 66} ]
const CATAPULT_POINTS = [ {x: 46, y: 46}, {x: -46, y: -46}, {x: -46, y: 46}, {x: 46, y: -46} ]

export default class Tower extends Container {
    constructor(
        arrowPoints, arrowsOnGround, arrowsContainer,
        catapultStones, lightnings, enemies, particles
    ) {
        super()

        this.towerLayer1 = new Container()
        this.towerLayer1Image = new Sprite(images.tower_layer_1)
        this.towerLayer1Image.anchor.set(0.5)
        this.towerLayer1.addChild(this.towerLayer1Image)
        this.addChild(this.towerLayer1)

        for(let i = 0; i < catapultsCount; i++) {
            // startShutTimeoutRate
            const str = 0.25 * (i + 1)
            const x = CATAPULT_POINTS[i].x
            const y = CATAPULT_POINTS[i].y
            this.towerLayer1.addChild(
                new Catapult(x, y, catapultStones, enemies, str, particles)
            )
        }

        this.towerLayer2 = new Container()
        this.towerLayer2Image = new Sprite(images.tower_layer_2)
        this.towerLayer2Image.anchor.set(0.5)
        this.towerLayer2.addChild(this.towerLayer2Image)
        this.addChild(this.towerLayer2)

        for(let i = 0; i < wizardsCount; i++) {
            // startShutTimeoutRate
            const str = 0.25 * (i + 1)
            this.towerLayer2.addChild(
                new Wizard(WIZARD_POINTS[i].x, WIZARD_POINTS[i].y, lightnings, enemies, str)
            )
        }

        this.towerLayer3 = new Container()
        this.towerLayer3Image = new Sprite(images.tower_layer_3)
        this.towerLayer3Image.anchor.set(0.5)
        this.towerLayer3.addChild(this.towerLayer3Image)
        this.addChild(this.towerLayer3)
 
        this.towerLayer3.addChild(
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