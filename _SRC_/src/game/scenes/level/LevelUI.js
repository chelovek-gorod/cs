import { Container, Sprite, Text } from "pixi.js";
import { atlases } from "../../../app/assets";
import { addDragon, EventHub, events, iceClick, rageClick, reloadClick, repairTower,
    setTrapsOnMap, fogStart } from "../../../app/events";
import { styles } from "../../../app/styles";
import { berserkReadyRage, gameState } from "../../state";
import ActionIcon from "./LevelUIIcon";

export default class LevelUI extends Container {
    constructor() {
        super()

        this.isIceShineOn = false
        this.isBerserk = false

        // tower HP
        this.tower = new Container()
        this.tower.position.set(0, -50)
        this.addChild(this.tower)

        this.towerHp = new ActionIcon(
            null, null, true,
            true, true, false
        )
        this.towerHp.position.set(14, -24)
        this.tower.addChild(this.towerHp)

        this.towerHpIcon = new Sprite(atlases.ui.textures.ui_icon_hp)
        this.towerHpIcon.anchor.set(0.5)
        this.towerHpIcon.position.set(-36, -4)
        this.tower.addChild(this.towerHpIcon)

        this.towerHpText = new Text({text: '0/0', style: styles.uiIconProgress})
        this.towerHpText.anchor.set(0.5)
        this.towerHpText.position.set(14, 0)
        this.tower.addChild(this.towerHpText)

        // archer info
        this.archer = new Container()
        this.archer.position.set(0, 40)
        this.addChild(this.archer)

        this.archerInfo = new ActionIcon(
            null, null, true,
            true, true, false
        )
        this.archerInfo.position.set(14, -24)
        this.archer.addChild(this.archerInfo)

        this.archerIcon = new Sprite(atlases.ui.textures.ui_icon_arrows)
        this.archerIcon.anchor.set(0.5)
        this.archerIcon.position.set(-36, -4)
        this.archer.addChild(this.archerIcon)

        this.archerText = new Text({text: '0/0', style: styles.uiIconProgress})
        this.archerText.anchor.set(0.5)
        this.archerText.position.set(14, 0)
        this.archer.addChild(this.archerText)

        // others UI
        this.topLine = new Container()
        this.addChild(this.topLine)

        // round info
        this.roundIcon = new Sprite(atlases.ui.textures.ui_icon_round)
        this.roundIcon.anchor.set(0.5, 0.5)
        this.topLine.addChild(this.roundIcon)

        const roundText = `${gameState.round} (0/0)`
        this.roundText = new Text({text: roundText, style: styles.uiIconCounter})
        this.roundText.anchor.set(0, 0.5)
        this.topLine.addChild(this.roundText)

        // gold info
        this.goldIcon = new Sprite(atlases.ui.textures.ui_icon_gold)
        this.goldIcon.anchor.set(1, 0.5)
        this.topLine.addChild(this.goldIcon)

        this.goldText = new Text({text: gameState.gold, style: styles.uiIconCounter})
        this.goldText.anchor.set(1, 0.5)
        this.topLine.addChild(this.goldText)

        // top buttons
        this.repairBtn = new ActionIcon(
            atlases.ui.textures.ui_btn_repair,
            this.repairClick.bind(this),
            false,
            true, false, true // shine for repair if repairs exists
        )
        this.addChild(this.repairBtn)

        this.pauseBtn = new ActionIcon(
            atlases.ui.textures.ui_btn_pause,
            this.pauseClick.bind(this),
            true, false, false, false
        )
        this.addChild(this.pauseBtn)

        // left buttons
        this.dragonBtn = new ActionIcon(
            atlases.ui.textures.ui_btn_dragon,
            this.dragonClick.bind(this),
            gameState.dragonsCount > 0,
            true, true, true
        )
        this.addChild(this.dragonBtn)

        this.fogBtn = new ActionIcon(
            atlases.ui.textures.ui_btn_fog,
            this.fogClick.bind(this),
            gameState.fogCount > 0,
            true, true, true
        )
        this.addChild(this.fogBtn)

        this.trapsBtn = new ActionIcon(
            atlases.ui.textures.ui_btn_traps,
            this.trapsClick.bind(this),
            gameState.trapsCount > 0,
            true, false, false,
        )
        this.addChild(this.trapsBtn)

        // right buttons
        this.rageBtn = new ActionIcon(
            atlases.ui.textures.ui_btn_rage,
            this.rageClick.bind(this),
            gameState.berserkStartRage >= berserkReadyRage,
            false, true, true
        )
        this.addChild(this.rageBtn)

        this.iceBtn = new ActionIcon(
            atlases.ui.textures.ui_btn_ice,
            this.iceClick.bind(this),
            gameState.iceCount > 0,
            true, false, true
        )
        this.addChild(this.iceBtn)

        this.reloadBtn = new ActionIcon(
            atlases.ui.textures.ui_btn_reload,
            this.reloadClick.bind(this),
            false, false, false, false
        )
        this.addChild(this.reloadBtn)

        EventHub.on( events.updateTowerHp, this.updateTowerHp, this )
        EventHub.on( events.dragonIsEmpty, this.dragonIsEmpty, this )
        EventHub.on( events.updateDragonFuel, this.updateDragonFuel, this )
        EventHub.on( events.updateArrows, this.updateArrows, this )
        EventHub.on( events.updateArrowsReload, this.updateArrowsReload, this )
        EventHub.on( events.updateRage, this.updateRage, this )
        EventHub.on( events.updateTrapsAvailable, this.updateTrapsAvailable, this )
        EventHub.on( events.updateFogAvailable, this.updateFogAvailable, this )
    }

    screenResize(screenData, safeAreaOffsets) {
        const offset = 10
        const minY = -screenData.centerY + offset + (safeAreaOffsets.top || 0) 
        const maxY = screenData.centerY - offset - (safeAreaOffsets.bottom || 0)
        const minX = -screenData.centerX + offset + (safeAreaOffsets.left || 0) 
        const maxX = screenData.centerX - offset - (safeAreaOffsets.right || 0)

        this.topLine.position.set(0, minY + 18)

        this.roundIcon.position.set(minX + 18, 0)
        this.roundText.position.set(minX + 36, 0)
        this.goldIcon.position.set(maxX - this.goldText.width - 6, 0)
        this.goldText.position.set(maxX, 0)

        this.repairBtn.position.set(minX + 36, minY + 80)
        this.pauseBtn.position.set(maxX - 36, minY + 80)

        this.dragonBtn.position.set(minX + 36, maxY - 118)
        this.fogBtn.position.set(minX + 36, maxY - 36)
        this.trapsBtn.position.set(minX + 118, maxY - 36)

        this.rageBtn.position.set(maxX - 36, maxY - 118)
        this.iceBtn.position.set(maxX - 118, maxY - 36)
        this.reloadBtn.position.set(maxX - 36, maxY - 36)
    }

    start() {
        this.towerHp.setProgressBg(0xffffff, 1)
        this.towerHp.setProgress(1, true, 0x00ff00)
        this.towerHp.setProgressBorder(true, 0xffffff)
        this.towerHpText.text = `${gameState.towerHp}/${gameState.towerHp}`

        this.archerInfo.setProgressBg(0xffffff, 1)
        this.archerInfo.setProgress(1, true, 0xffff00)
        this.archerInfo.setProgressBorder(true, 0xffffff)
        this.archerText.text = `${gameState.arrowsCount}/${gameState.arrowsCount}`

        this.roundText.text = `${gameState.round} (0/0)`

        this.goldText.text = gameState.gold
        this.goldIcon.position.set(this.goldText.position.x - this.goldText.width - 6, 0)

        this.repairBtn.setText(`${gameState.towerRepairsCount} (+${gameState.towerRepairHp})`)
        this.repairBtn.setProgressBg(0x00ff00, 0.5)

        this.dragonBtn.setProgress(0, true, 0xff0000)
        this.dragonBtn.setProgressBg(0x000000, 1)
        this.dragonBtn.setProgressBorder(true, 0xffffff)
        this.dragonBtn.setText(gameState.dragonsCount)
        this.dragonBtn.setShine(gameState.dragonsCount > 0, 0xffff00)
        
        this.fogBtn.setProgressBg(0x000000, 1)
        this.fogBtn.setProgress(1, true, 0x00ff00)
        this.fogBtn.setText(gameState.fogCount, true)
        this.fogBtn.setProgressBorder(true, 0xffffff)
        this.fogBtn.setShine(gameState.fogCount > 0, 0x00ff00)  
        
        this.trapsBtn.setProgressBg(0xffff00, 0.5)
        this.trapsBtn.setText(gameState.trapsCount, true)

        this.rageBtn.setProgressBg(0xffffff, 1)
        this.rageBtn.setProgressBorder(true, 0x000000)
        this.updateRage(gameState.berserkStartRage)

        this.iceBtn.setText(gameState.iceCount, true)
        this.iceBtn.setProgressBg(0x00ffff, 0.5)
        this.iceBtn.setShine(false, 0x00ffff)
    }

    setWaveText(current, waves) {
        this.roundText.text = `${gameState.round} (${current}/${waves})`
    }

    setGoldText() {
        this.goldText.text = gameState.gold
        this.goldIcon.position.set(this.goldText.position.x - this.goldText.width - 6, 0)
    }

    updateTowerHp(value) {
        let color = 0x00ff00
        if (value < 31) color = 0xff0000
        else if (value < 61) color = 0xffff00
        this.towerHp.setProgress(value / gameState.towerHp, true, color)
        this.towerHpText.text = `${value}/${gameState.towerHp}`

        const canRepair = gameState.towerRepairsCount > 0 && value < gameState.towerHp
        this.repairBtn.setActive(canRepair)

        const canShine = canRepair && value + gameState.towerRepairHp <= gameState.towerHp
        this.repairBtn.setShine(canShine, 0xffff00)
    }

    updateDragonFuel(progress) {
        this.dragonBtn.setProgress(progress, true, 0xff0000)
    }

    dragonIsEmpty() {
        this.dragonBtn.setProgress(0, true, 0xff0000)
        this.dragonBtn.setText(gameState.dragonsCount)
        if (gameState.dragonsCount > 0) {
            this.dragonBtn.setActive(true)
            this.dragonBtn.setShine(true, 0xffff00)
        } else {
            this.dragonBtn.setActive(false)
        }
    }

    updateTrapsAvailable(canPlace) {
        this.trapsBtn.setActive(canPlace)
        this.trapsBtn.setText(gameState.trapsCount, true)
    }

    updateFogAvailable(canStart) {
        this.fogBtn.setActive(canStart)
        this.fogBtn.setText(gameState.fogCount, true)
        this.fogBtn.setShine(canStart, 0x00ff00)
    }

    updateArrows(value) {
        this.archerText.text = `${value}/${gameState.arrowsCount}`
    
        if (this.isBerserk && value === 0) {
            this.isBerserk = false
        }
    
        const canReload = !this.isBerserk && value > 0 && value < gameState.arrowsCount
        this.reloadBtn.setActive(canReload)
    
        this.iceBtn.setText(gameState.iceCount, true)
        this.iceBtn.setActive(!this.isBerserk && gameState.iceCount > 0)
        if (gameState.iceCount === 0) {
            this.isIceShineOn = false
            this.iceBtn.setShine(false)
        }
    }

    updateArrowsReload(value) {
        this.archerInfo.setProgress(1 - value, true, 0xffff00)
    }

    updateRage(value) {
        const scale = Math.min(1, value / berserkReadyRage)
        const canActivate = value >= berserkReadyRage
        this.rageBtn.setProgress(scale, true, 0xff0000)
        this.rageBtn.setActive(canActivate)
        this.rageBtn.setShine(canActivate, 0xff0000)
    }

    // new
    repairClick() {
        if (gameState.towerRepairsCount < 1) return

        gameState.towerRepairsCount--
        this.repairBtn.setText(`${gameState.towerRepairsCount} (+${gameState.towerRepairHp})`, true)
        this.repairBtn.setShine(false)
        this.repairBtn.setActive(false)
        repairTower()
    }

    pauseClick() {

    }

    dragonClick() {
        if (gameState.dragonsCount < 1) return

        addDragon()
        this.dragonBtn.setText(gameState.dragonsCount)
        this.dragonBtn.setActive(false)
        this.dragonBtn.setShine(false, 0xffff00)
    }

    fogClick() {
        if (gameState.fogCount < 1) return
        fogStart()
    }

    trapsClick() {
        if (gameState.trapsCount < 1) return

        setTrapsOnMap()
    }

    rageClick() {
        rageClick()
        this.isBerserk = true
        this.isIceShineOn = false
        this.iceBtn.setShine(false)
        this.iceBtn.setActive(false)
        this.reloadBtn.setActive(false)
    }

    iceClick() {
        if (this.isBerserk) return

        iceClick()
        this.isIceShineOn = !this.isIceShineOn
        this.iceBtn.setShine(this.isIceShineOn, 0x00ffff)
    }

    reloadClick() {
        reloadClick()
    }

    kill() {
        EventHub.off( events.updateTowerHp, this.updateTowerHp, this )
        EventHub.off( events.dragonIsEmpty, this.dragonIsEmpty, this )
        EventHub.off( events.updateDragonFuel, this.updateDragonFuel, this )
        EventHub.off( events.updateArrows, this.updateArrows, this )
        EventHub.off( events.updateArrowsReload, this.updateArrowsReload, this )
        EventHub.off( events.updateRage, this.updateRage, this )
        EventHub.off( events.updateTrapsAvailable, this.updateTrapsAvailable, this )
        EventHub.off( events.updateFogAvailable, this.updateFogAvailable, this )
    }
}