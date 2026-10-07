import { Container, Graphics, Sprite } from 'pixi.js'
import { atlases } from '../../../app/assets'
import { removeCursorPointer, setCursorPointer } from '../../../utils/functions'
import { showPopup } from '../../../app/events'
import { POPUP_TYPE } from '../../popup/popupTypes'

const CONTAINER_SIZE = 700

export default class BuildingsContainer extends Container {
    constructor() {
        super()

        this.mine = new Sprite(atlases.buildings.textures.mine)
        this.mine.anchor.set(0.5)
        this.mine.position.set(-120, -180)
        this.mineButton = new Graphics()
        this.mineButton.circle(-120, -160, 100)
        this.mineButton.fill(0xffffff)
        this.mineButton.alpha = 0.5
        setCursorPointer(this.mineButton)
        this.mineButton.on("pointerup", this.clickMine, this)
        this.addChild(this.mine, this.mineButton)

        this.dragon = new Sprite(atlases.buildings.textures.dragon)
        this.dragon.anchor.set(0.5)
        this.dragon.position.set(120, -180)
        this.dragonButton = new Graphics()
        this.dragonButton.circle(120, -150, 100)
        this.dragonButton.fill(0xffffff)
        this.dragonButton.alpha = 0.5
        setCursorPointer(this.dragonButton)
        this.dragonButton.on("pointerup", this.clickDragon, this)
        this.addChild(this.dragon, this.dragonButton)

        this.magic = new Sprite(atlases.buildings.textures.magic)
        this.magic.anchor.set(0.5)
        this.magic.position.set(-240, 0)
        this.magicButton = new Graphics()
        this.magicButton.circle(-240, 10, 100)
        this.magicButton.fill(0xffffff)
        this.magicButton.alpha = 0.5
        setCursorPointer(this.magicButton)
        this.magicButton.on("pointerup", this.clickMagic, this)
        this.addChild(this.magic, this.magicButton)

        this.tower = new Sprite(atlases.buildings.textures.tower)
        this.tower.anchor.set(0.5)
        this.tower.position.set(0, 20)
        this.towerButton = new Graphics()
        this.towerButton.circle(0, 40, 100)
        this.towerButton.fill(0xffffff)
        this.towerButton.alpha = 0.5
        setCursorPointer(this.towerButton)
        this.towerButton.on("pointerup", this.clickTower, this)
        this.addChild(this.tower, this.towerButton)

        this.catapult = new Sprite(atlases.buildings.textures.catapult)
        this.catapult.anchor.set(0.5)
        this.catapult.position.set(220, 0)
        this.catapultButton = new Graphics()
        this.catapultButton.circle(220, 40, 80)
        this.catapultButton.fill(0xffffff)
        this.catapultButton.alpha = 0.5
        setCursorPointer(this.catapultButton)
        this.catapultButton.on("pointerup", this.clickCatapult, this)
        this.addChild(this.catapult, this.catapultButton)

        this.ice = new Sprite(atlases.buildings.textures.ice)
        this.ice.anchor.set(0.5)
        this.ice.position.set(-120, 180)
        this.iceButton = new Graphics()
        this.iceButton.circle(-130, 200, 100)
        this.iceButton.fill(0xffffff)
        this.iceButton.alpha = 0.5
        setCursorPointer(this.iceButton)
        this.iceButton.on("pointerup", this.clickIce, this)
        this.addChild(this.ice, this.iceButton)

        this.fire = new Sprite(atlases.buildings.textures.fire)
        this.fire.anchor.set(0.5)
        this.fire.position.set(120, 180)
        this.fireButton = new Graphics()
        this.fireButton.circle(120, 220, 80)
        this.fireButton.fill(0xffffff)
        this.fireButton.alpha = 0.5
        setCursorPointer(this.fireButton)
        this.fireButton.on("pointerup", this.clickFire, this)
        this.addChild(this.fire, this.fireButton)
    }

    screenResize(screenData) {
        const scale = Math.min(1, Math.min(screenData.width, screenData.height) / CONTAINER_SIZE)
        this.scale.set(scale)
    }

    kill() {
        removeCursorPointer(this.mine)
        this.mine.off("pointerup", this.clickMine, this)
        this.mine.destroy()
        this.mine = null

        removeCursorPointer(this.dragon)
        this.dragon.off("pointerup", this.clickDragon, this)
        this.dragon.destroy()
        this.dragon = null

        removeCursorPointer(this.magic)
        this.magic.off("pointerup", this.clickMagic, this)
        this.magic.destroy()
        this.magic = null

        removeCursorPointer(this.tower)
        this.tower.off("pointerup", this.clickTower, this)
        this.tower.destroy()
        this.tower = null

        removeCursorPointer(this.catapult)
        this.catapult.off("pointerup", this.clickCatapult, this)
        this.catapult.destroy()
        this.catapult = null

        removeCursorPointer(this.ice)
        this.ice.off("pointerup", this.clickIce, this)
        this.ice.destroy()
        this.ice = null

        removeCursorPointer(this.fire)
        this.fire.off("pointerup", this.clickFire, this)
        this.fire.destroy()
        this.fire = null

        this.destroy({children: true})
    }

    clickMine() {
        showPopup(POPUP_TYPE.BUILD_MINE)
    }

    clickDragon() {
        showPopup(POPUP_TYPE.BUILD_DRAGON)
    }

    clickMagic() {
        showPopup(POPUP_TYPE.BUILD_MAGIC)
    }

    clickTower() {
        showPopup(POPUP_TYPE.BUILD_TOWER)
    }

    clickCatapult() {
        showPopup(POPUP_TYPE.BUILD_CATAPULT)
    }

    clickIce() {
        showPopup(POPUP_TYPE.BUILD_ICE)
    }

    clickFire() {
        showPopup(POPUP_TYPE.BUILD_FIRE)
    }
}