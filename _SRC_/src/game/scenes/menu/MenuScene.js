import { Container, Graphics, Text } from 'pixi.js'
import { images, music } from '../../../app/assets'
import { EventHub, events, startScene } from '../../../app/events'
import { getLanguage } from '../../localization'
import { gameplayRunSDK, gameplayStopSDK } from '../../storage'
import { removeCursorPointer, setCursorPointer } from '../../../utils/functions'
import { getSafeAreaOffsets } from '../../../app/application'
import { setMusicList } from '../../../app/sound'
import { SCENE_NAME } from '../SceneManager'
import { styles } from '../../../app/styles'
import MenuUI from './MenuUI'
import BuildingsContainer from './BuildingsContainer'
import BackgroundTiling from '../../BG/BackgroundTiling'
import { gameState, ROUND_TYPE, setLevelType } from '../../state'

export default class MenuScene extends Container {
    constructor() {
        super()

        gameplayRunSDK()

        this.currentLanguage = getLanguage()
        EventHub.on(events.updateLanguage, this.updateLanguage, this)

        this.bg = new BackgroundTiling(images.grass_bg)
        this.addChild(this.bg)

        this.buildings = new BuildingsContainer()
        this.addChild(this.buildings)

        // start buttons
        if (gameState.round % 10 === 0) {
            this.startButton0 = this.createButton('+' + gameState.levelRewardBoss, '0xff0077', this.start0)
            this.addChild(this.startButton0)
        } else {
            this.startButton1 = this.createButton('+' + gameState.levelRewardEasy, '0x00ff00', this.start1)
            this.startButton2 = this.createButton('+' + gameState.levelRewardNorm, '0x777777', this.start2)
            this.startButton3 = this.createButton('+' + gameState.levelRewardHard, '0xff0000', this.start3)
            this.addChild(this.startButton1, this.startButton2, this.startButton3)
        }
        
        this.flyTexts = new Container()
        this.addChild(this.flyTexts)

        this.ui = new MenuUI()
        this.addChild(this.ui)

        EventHub.on(events.pauseGameplay, this.pauseGameplay, this)

        setMusicList([music.bgm_menu])
    }

    screenResize(screenData) {
        const safeAreaOffsets = getSafeAreaOffsets()
        this.position.set(screenData.centerX, screenData.centerY)
        this.bg.screenResize(screenData)
        this.ui.screenResize(screenData, safeAreaOffsets)

        this.buildings.screenResize(screenData)

        const startButtonY = screenData.centerY - 40 - safeAreaOffsets.bottom
        const startButtonX = screenData.centerX - 50 - safeAreaOffsets.right
        if (gameState.round % 10 === 0) {
            this.startButton0.position.set(startButtonX, startButtonY)
        } else {
            this.startButton1.position.set(startButtonX - 200, startButtonY)
            this.startButton2.position.set(startButtonX - 100, startButtonY)
            this.startButton3.position.set(startButtonX, startButtonY)
        }
    }

    pauseGameplay() {

    }
    resumeGameplay() {
        if (this?.isPausePressed) this.isPausePressed = false
    }

    createButton(text, bgColor, callback) {
        const button = new Container()
        const btnBg = new Graphics()
        btnBg.roundRect(-40, -30, 80, 60, 18)
        btnBg.fill(bgColor)
        btnBg.stroke({width: 3, color: 0x000000})
        button.addChild(btnBg)
        const btnText = new Text({text: text, style: styles.loading})
        btnText.anchor.set(0.5)
        btnText.scale.set(0.7)
        button.addChild(btnText)
        button.position.set(0, 0)
        setCursorPointer(button)
        button.on('pointerup', callback, this)
        return button
    }

    start0() {
        setLevelType(ROUND_TYPE.BOSS)
        startScene(SCENE_NAME.Level)
    }
    start1() {
        setLevelType(ROUND_TYPE.EASY)
        startScene(SCENE_NAME.Level)
    }
    start2() {
        setLevelType(ROUND_TYPE.NORM)
        startScene(SCENE_NAME.Level)
    }
    start3() {
        setLevelType(ROUND_TYPE.HARD)
        startScene(SCENE_NAME.Level)
    }

    updateLanguage(lang) {
        this.currentLanguage = lang
    }

    kill() {
        this.bg.destroy()

        if (gameState.round % 10 === 0) {
            removeCursorPointer(this.startButton0)
            this.startButton0.off('pointerup', this.start0, this)
            this.removeChild(this.startButton0) 
            this.startButton0.destroy({ children: true })
            this.startButton0 = null
        } else {
            removeCursorPointer(this.startButton1)
            removeCursorPointer(this.startButton2)
            removeCursorPointer(this.startButton3)
            this.startButton1.off('pointerup', this.start1, this)
            this.startButton2.off('pointerup', this.start2, this)
            this.startButton3.off('pointerup', this.start3, this)
            this.removeChild(this.startButton1) 
            this.removeChild(this.startButton2)
            this.removeChild(this.startButton3)
            this.startButton1.destroy({ children: true })
            this.startButton2.destroy({ children: true })
            this.startButton3.destroy({ children: true })
            this.startButton1 = null
            this.startButton2 = null
            this.startButton3 = null
        }

        if (this.flyTexts) {
            this.flyTexts.destroy({ children: true })
            this.flyTexts = null
        }

        if (this.ui) {
            this.ui.kill()
            this.ui.destroy({ children: true })
            this.ui = null
        }

        gameplayStopSDK()

        if (this.handlerKeyboard) {
            EventHub.off(events.resumeGameplay, this.resumeGameplay, this)
            document.removeEventListener('keydown', this.handlerKeyboard)
            this.handlerKeyboard = null
        }

        EventHub.off(events.updateLanguage, this.updateLanguage, this)
        EventHub.off(events.pauseGameplay, this.pauseGameplay, this)
    }
}