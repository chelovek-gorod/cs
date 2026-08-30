import { Container, Graphics, Text } from 'pixi.js'
import { images, music } from '../../../app/assets'
import { EventHub, events, showPopup, startScene } from '../../../app/events'
import { getLanguage } from '../../localization'
import { gameplayRunSDK, gameplayStopSDK } from '../../storage'
import BackgroundTiling from '../../BG/BackgroundTiling'
import { removeCursorPointer, setCursorPointer } from '../../../utils/functions'
import { getSafeAreaOffsets } from '../../../app/application'
import { addCatapultCount, addGold, addLevel, addWizardsCount, adGoldBonus, catapultsCount, catapultsCountMax, getCatapultPrice, getWizardPrice, gold, level, levelStartPrice, round, wizardsCount, wizardsCountMax } from '../../state'
import { setMusicList } from '../../../app/sound'
import { SCENE_NAME } from '../SceneManager'
import { styles } from '../../../app/styles'
import MenuUI from './MenuUI'
import { POPUP_TYPE } from '../../popup/popupTypes'

export default class MenuScene extends Container {
    constructor() {
        super()

        gameplayRunSDK()

        this.currentLanguage = getLanguage()
        EventHub.on(events.updateLanguage, this.updateLanguage, this)

        this.bg = new BackgroundTiling(images.round_bg)
        this.addChild(this.bg)

        this.menuContainer = new Container()
        this.addChild(this.menuContainer)

        // Создаём кнопки
        this.createButtons()

        this.flyTexts = new Container()
        this.addChild(this.flyTexts)

        this.ui = new MenuUI()
        this.addChild(this.ui)

        EventHub.on(events.pauseGameplay, this.pauseGameplay, this)

        setMusicList([music.bgm_menu])
    }

    createButtons() {
        // Удаляем старые кнопки, если есть
        if (this.btnAddWizard) {
            this.clearButton(this.btnAddWizard, this.addWizard)
            this.menuContainer.removeChild(this.btnAddWizard)
            this.btnAddWizard.destroy({ children: true })
        }
        if (this.btnAddCatapult) {
            this.clearButton(this.btnAddCatapult, this.addCatapult)
            this.menuContainer.removeChild(this.btnAddCatapult)
            this.btnAddCatapult.destroy({ children: true })
        }
        if (this.btnAddLevel) {
            this.clearButton(this.btnAddLevel, this.addLevel)
            this.menuContainer.removeChild(this.btnAddLevel)
            this.btnAddLevel.destroy({ children: true })
        }
        if (this.btnAddGold) {
            this.clearButton(this.btnAddGold, this.addGold)
            this.menuContainer.removeChild(this.btnAddGold)
            this.btnAddGold.destroy({ children: true })
        }
        if (this.btnStartNextRound) {
            this.clearButton(this.btnStartNextRound, this.startNextRound)
            this.menuContainer.removeChild(this.btnStartNextRound)
            this.btnStartNextRound.destroy({ children: true })
        }

        // Вычисляем цены
        this.wizardPrice = getWizardPrice()
        this.catapultPrice = getCatapultPrice()
        this.levelPrice = (level + 1) * levelStartPrice

        // Кнопка мага
        this.btnAddWizard = this.setButton(
            '+WIZARD', -90, -200, this.wizardPrice,
            'add on tower',
            (this.wizardPrice > gold || wizardsCount === 4) ? null : this.addWizard
        )

        // Кнопка катапульты
        this.btnAddCatapult = this.setButton(
            '+CATAPULT', 90, -200, this.catapultPrice,
            'add on tower',
            (this.catapultPrice > gold || catapultsCount === 4) ? null : this.addCatapult
        )

        // Кнопка уровня
        this.btnAddLevel = this.setButton(
            '+LEVEL', -90, -100, this.levelPrice,
            'upgrade',
            (this.levelPrice > gold) ? null : this.addLevel
        )

        // Кнопка золота
        this.btnAddGold = this.setButton(
            '+ GOLD', 90, -100, adGoldBonus,
            'for AD',
            this.addGold
        )

        // Кнопка старта
        this.btnStartNextRound = this.setButton(
            'START', 0, 200, round,
            'ROUND', this.startNextRound
        )
    }

    refreshButtons() {
        this.createButtons()
        this.ui.setGoldText()
    }

    screenResize(screenData) {
        const safeAreaOffsets = getSafeAreaOffsets()
        this.position.set(screenData.centerX, screenData.centerY)
        this.bg.screenResize(screenData)
        this.ui.screenResize(screenData, safeAreaOffsets)
    }

    pauseGameplay() {

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
        btnBg.stroke({ width: 3, color: 0x000000 })

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
        priceText.position.set(0, 25)
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
        if (!button) return
        while (button.children.length > 0) {
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
        if (wizardsCount === wizardsCountMax || gold < this.wizardPrice) return

        addWizardsCount()
        addGold(-this.wizardPrice)
        this.refreshButtons()
    }

    addCatapult() {
        if (catapultsCount === catapultsCountMax || gold < this.catapultPrice) return

        addCatapultCount()
        addGold(-this.catapultPrice)
        this.refreshButtons()
    }

    addLevel() {
        if (gold < this.levelPrice) return

        addGold(-this.levelPrice)
        showPopup(POPUP_TYPE.UPGRADE)
        this.refreshButtons()
    }

    addGold() {
        addGold(adGoldBonus)
        this.refreshButtons()
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
            EventHub.off(events.resumeGameplay, this.resumeGameplay, this)
            document.removeEventListener('keydown', this.handlerKeyboard)
            this.handlerKeyboard = null
        }

        EventHub.off(events.updateLanguage, this.updateLanguage, this)
        EventHub.off(events.pauseGameplay, this.pauseGameplay, this)
    }
}