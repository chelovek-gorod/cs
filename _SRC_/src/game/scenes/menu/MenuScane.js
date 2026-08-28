import { Container, Graphics, Text } from 'pixi.js'
import { images, music } from '../../../app/assets'
import { EventHub, events, startScene } from '../../../app/events'
import { getLanguage } from '../../localization'
import { gameplayRunSDK, gameplayStopSDK } from '../../storage'
import BackgroundTiling from '../../BG/BackgroundTiling'
import { removeCursorPointer, setCursorPointer } from '../../../utils/functions'
import { getSafeAreaOffsets } from '../../../app/application'
import { addCatapultCount, addGold, addWizardsCount, catapultsCount, getCatapultPrice, getWizardPrice, gold, round, wizardsCount } from '../../state'
import { setMusicList } from '../../../app/sound'
import { SCENE_NAME } from '../SceneManager'
import { styles } from '../../../app/styles'
import MenuUI from './MenuUI'

export default class MenuScene extends Container {
    constructor() {
        super()

        gameplayRunSDK()

        this.currentLanguage = getLanguage()
        EventHub.on( events.updateLanguage, this.updateLanguage, this )

        this.bg = new BackgroundTiling(images.round_bg)
        this.addChild(this.bg)

        this.menuContainer = new Container()
        this.addChild(this.menuContainer)

        this.wizardPrice = getWizardPrice()
        this.btnAddWizard = this.setButton(
            '+WIZARD', -90, -200, this.wizardPrice,
            'add on tower', this.wizardPrice > gold || wizardsCount === 4
            ? null : this.addWizard
        )
        this.catapultPrice = getCatapultPrice()
        this.btnAddCatapult = this.setButton(
            '+CATAPULT', 90, -200, this.catapultPrice,
            'add on tower', this.catapultPrice > gold || catapultsCount === 4
            ? null : this.addCatapult
        )
        this.btnStartNextRound = this.setButton(
            'START', 0, 200, round,
            'ROUND', this.startNextRound
        )

        setTimeout(()=>console.log(this.btnStartNextRound), 3000)

        this.flyTexts = new Container()
        this.addChild(this.flyTexts)

        this.ui = new MenuUI()
        this.addChild(this.ui)

        EventHub.on( events.pauseGameplay, this.pauseGameplay, this )

        /*
        if ( getDeviceType().indexOf('desktop') > -1 ) {
            this.isPausePressed = false
            this.handlerKeyboard = (e) => {
                if (e.code === 'Escape' && !this.isPausePressed) {
                    this.isPausePressed = true
                    pauseGameplay()
                }
                if (e.code === 'Space') this.getFlyClick()
            }
            document.addEventListener('keydown', this.handlerKeyboard)

            EventHub.on( events.resumeGameplay, this.resumeGameplay, this )
        }
        */
        
        setMusicList( [music.bgm_menu] )
    }

    screenResize(screenData) {
        const safeAreaOffsets = getSafeAreaOffsets()

        // set scene container in center of screen
        this.position.set( screenData.centerX, screenData.centerY )

        this.bg.screenResize(screenData)

        this.ui.screenResize(screenData, safeAreaOffsets)
    }

    pauseGameplay() {
        //this.popup.show( POPUP_TYPE.PAUSE )
    }
    resumeGameplay() {
        if (this?.isPausePressed) this.isPausePressed = false
    }

    setButton(label, x, y, price, description, action) {
        const btn = new Container()
        btn.position.set(x, y)
        this.menuContainer.addChild(btn)

        const btnBg = new Graphics()
        btn.addChild(btnBg)
        btnBg.roundRect(-80, -40, 160, 80, 16)
        btnBg.fill(0x6600ff)
        btnBg.stroke({width: 3, color: 0x000000})

        const labelText = new Text({ text: label, style: styles.damage })
        labelText.anchor.set(0.5)
        labelText.position.set(0, -25)
        btn.addChild(labelText)

        const descriptionText = new Text({ text: description, style: styles.damage })
        descriptionText.anchor.set(0.5)
        descriptionText.position.set(0, 0)
        btn.addChild(descriptionText)

        const priceText = new Text({ text: price, style: styles.damage })
        priceText.anchor.set(0.5)
        descriptionText.position.set(0, 25)
        btn.addChild(priceText)

        if (action) {
            setCursorPointer(btn)
            btn.on('pointerup', action, this)
        } else {
            btn.alpha = 0.6
        }
        
        return btn
    }
    clearButton(button, action) {
        while(button.children.length > 0) {
            const child = button.children[0]
            button.removeChild(child)
            child.destroy()
        }
        if (button.alpha > 0.6) {
            removeCursorPointer(button)
            button.off('pointerup', action, this)
        }
    }

    addWizard() {
        if (wizardsCount === 4 || gold < this.wizardPrice) return

        this.btnAddWizard.alpha = 0.6
        removeCursorPointer(this.btnAddWizard)
        this.btnAddWizard.off('pointerup', this.addWizard, this)

        addWizardsCount()
        addGold(-this.wizardPrice)
        this.ui.setGoldText()
    }

    addCatapult() {
        if (catapultsCount === 4 || gold < this.catapultPrice) return

        this.btnAddCatapult.alpha = 0.6
        removeCursorPointer(this.btnAddCatapult)
        this.btnAddCatapult.off('pointerup', this.addCatapult, this)

        addCatapultCount()
        addGold(-this.catapultPrice)
        this.ui.setGoldText()
    }

    startNextRound() {
        this.clearButton(this.btnAddWizard, this.addWizard)
        this.clearButton(this.btnAddCatapult, this.addCatapult)
        this.clearButton(this.btnStartNextRound, this.startNextRound)

        startScene(SCENE_NAME.Level)
        this.kill()
    }

    updateLanguage(lang) {
        this.currentLanguage = lang
    }

    kill() {
        this.bg.destroy()

        gameplayStopSDK()

        if (this.handlerKeyboard) {
            EventHub.off( events.resumeGameplay, this.resumeGameplay, this )
            document.removeEventListener('keydown', this.handlerKeyboard)
            this.handlerKeyboard = null
        }

        EventHub.off( events.updateLanguage, this.updateLanguage, this )
        EventHub.off( events.pauseGameplay, this.pauseGameplay, this )
    }
}