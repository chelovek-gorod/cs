import { Container, Graphics, Sprite } from 'pixi.js'
import { atlases } from '../../../app/assets'
import { removeCursorPointer, setCursorPointer } from '../../../utils/functions'
import { showPopup } from '../../../app/events'
import { POPUP_TYPE } from '../../popup/popupTypes'

const CONTAINER_SIZE = 700

export default class BuildingsContainer extends Container {
    constructor() {
        super()

        this.tower = new Sprite(atlases.buildings.textures.build_tower)
        this.tower.anchor.set(0.5)
        this.tower.position.set(0, -20)
        this.towerButton = this.createCollider(this.tower, 0, 0, this.clickTower.bind(this))
        this.addChild(this.tower, this.towerButton)
        
        this.trap = new Sprite(atlases.buildings.textures.build_trap)
        this.trap.anchor.set(0.5)
        this.trap.position.set(-180, -220)
        this.trapButton = this.createCollider(this.trap, 0, 0, this.clickTrap.bind(this))
        this.addChild(this.trap, this.trapButton)

        this.fog = new Sprite(atlases.buildings.textures.build_fog)
        this.fog.anchor.set(0.5)
        this.fog.position.set(10, -260)
        this.fogButton = this.createCollider(this.fog, 0, 0, this.clickFog.bind(this))
        this.addChild(this.fog, this.fogButton)

        this.ice = new Sprite(atlases.buildings.textures.build_ice)
        this.ice.anchor.set(0.5)
        this.ice.position.set(200, -210)
        this.iceButton = this.createCollider(this.ice, 0, 0, this.clickIce.bind(this))
        this.addChild(this.ice, this.iceButton)

        this.wizard = new Sprite(atlases.buildings.textures.build_wizard)
        this.wizard.anchor.set(0.5)
        this.wizard.position.set(-260, 0)
        this.wizardButton = this.createCollider(this.wizard, 0, 0, this.clickWizard.bind(this))
        this.addChild(this.wizard, this.wizardButton)

        this.catapult = new Sprite(atlases.buildings.textures.build_catapult)
        this.catapult.anchor.set(0.5)
        this.catapult.position.set(260, 0)
        this.catapultButton = this.createCollider(this.catapult, 0, 0, this.clickCatapult.bind(this))
        this.addChild(this.catapult, this.catapultButton)

        this.mine = new Sprite(atlases.buildings.textures.build_mine)
        this.mine.anchor.set(0.5)
        this.mine.position.set(-130, 170)
        this.mineButton = this.createCollider(this.mine, 0, 0, this.clickMine.bind(this))
        this.addChild(this.mine, this.mineButton)

        this.dragon = new Sprite(atlases.buildings.textures.build_dragon)
        this.dragon.anchor.set(0.5)
        this.dragon.position.set(130, 170)
        this.dragonButton = this.createCollider(this.dragon, 0, 0, this.clickDragon.bind(this))
        this.addChild(this.dragon, this.dragonButton)
    }

    createCollider(target, offsetX, offsetY, clickCallback) {
        const button = new Graphics()
        button.circle(target.x + offsetX, target.y + offsetY + 25, 90)
        button.fill(0xffffff)
        button.alpha = 0.01
        setCursorPointer(button)
        button.on("pointerup", clickCallback, this)
        this.addChild(button)
        return button
    }

    screenResize(screenData) {
        const scale = Math.min(1, Math.min(screenData.width, screenData.height) / CONTAINER_SIZE)
        this.scale.set(scale)
    }

    kill() {
        removeCursorPointer(this.towerButton)
        this.towerButton.off("pointerup", this.clickTower.bind(this), this)
        this.removeChild(this.towerButton)
        this.towerButton.destroy()
        this.towerButton = null

        removeCursorPointer(this.trapButton)
        this.trapButton.off("pointerup", this.clickTrap.bind(this), this)
        this.removeChild(this.trapButton)
        this.trapButton.destroy()
        this.trapButton = null

        removeCursorPointer(this.fogButton)
        this.fogButton.off("pointerup", this.clickFog.bind(this), this)
        this.removeChild(this.fogButton)
        this.fogButton.destroy()
        this.fogButton = null

        removeCursorPointer(this.iceButton)
        this.iceButton.off("pointerup", this.clickIce.bind(this), this)
        this.removeChild(this.iceButton)
        this.iceButton.destroy()
        this.iceButton = null

        removeCursorPointer(this.wizardButton)
        this.wizardButton.off("pointerup", this.clickWizard.bind(this), this)
        this.removeChild(this.wizardButton)
        this.wizardButton.destroy()
        this.wizardButton = null

        removeCursorPointer(this.catapultButton)
        this.catapultButton.off("pointerup", this.clickCatapult.bind(this), this)
        this.removeChild(this.catapultButton)
        this.catapultButton.destroy()
        this.catapultButton = null

        removeCursorPointer(this.mineButton)
        this.mineButton.off("pointerup", this.clickMine.bind(this), this)
        this.removeChild(this.mineButton)
        this.mineButton.destroy()
        this.mineButton = null

        removeCursorPointer(this.dragonButton)
        this.dragonButton.off("pointerup", this.clickDragon.bind(this), this)
        this.removeChild(this.dragonButton)
        this.dragonButton.destroy()
        this.dragonButton = null

        this.destroy({children: true})
    }

    clickTower() {
        showPopup(POPUP_TYPE.BUILD_TOWER)
    }

    clickTrap() {
        showPopup(POPUP_TYPE.BUILD_TRAP)
    }

    clickFog() {
        showPopup(POPUP_TYPE.BUILD_FOG)
    }

    clickIce() {
        showPopup(POPUP_TYPE.BUILD_ICE)
    }

    clickWizard() {
        showPopup(POPUP_TYPE.BUILD_WIZARD)
    }

    clickCatapult() {
        showPopup(POPUP_TYPE.BUILD_CATAPULT)
    }

    clickMine() {
        showPopup(POPUP_TYPE.BUILD_MINE)
    }

    clickDragon() {
        showPopup(POPUP_TYPE.BUILD_DRAGON)
    }
}