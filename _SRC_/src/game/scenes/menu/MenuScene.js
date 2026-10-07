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

        // start button
        this.startButton = new Container()
        const btnBg = new Graphics()
        btnBg.roundRect(-40, -30, 80, 60, 18)
        btnBg.fill(0x00ff00)
        btnBg.stroke({width: 3, color: 0x000000})
        this.startButton.addChild(btnBg)
        const btnText = new Text({text: '>', style: styles.loading})
        btnText.anchor.set(0.5)
        this.startButton.addChild(btnText)
        this.startButton.position.set(0, 0)
        setCursorPointer(this.startButton)
        this.startButton.on('pointerup', this.startNextRound, this)
        this.addChild(this.startButton)

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

        const startButtonX = screenData.centerX - 50 - safeAreaOffsets.right
        const startButtonY = screenData.centerY - 40 - safeAreaOffsets.bottom
        this.startButton.position.set(startButtonX, startButtonY)
    }

    pauseGameplay() {

    }
    resumeGameplay() {
        if (this?.isPausePressed) this.isPausePressed = false
    }

    startNextRound() {
        startScene(SCENE_NAME.Level)
    }

    updateLanguage(lang) {
        this.currentLanguage = lang
    }

    kill() {
        this.bg.destroy()

        removeCursorPointer(this.startButton)
        this.startButton.off('pointerup', this.startNextRound, this)
        this.removeChild(this.startButton)
        this.startButton.destroy({ children: true })
        this.startButton = null

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