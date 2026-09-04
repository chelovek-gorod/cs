import { Container, Graphics, Text } from 'pixi.js'
import { images, music } from '../../../app/assets'
import { EventHub, events, showPopup, startScene } from '../../../app/events'
import { getLanguage } from '../../localization'
import { gameplayRunSDK, gameplayStopSDK } from '../../storage'
import BackgroundImage from '../../BG/BackgroundImage'
import { removeCursorPointer, setCursorPointer } from '../../../utils/functions'
import { getSafeAreaOffsets } from '../../../app/application'
import { addCatapultCount, addGold, addLevel, addWizardsCount, adGoldBonus, catapultsCount, catapultsCountMax, getCatapultPrice, getWizardPrice, gold, level, levelStartPrice, round, wizardsCount, wizardsCountMax } from '../../state'
import { setMusicList } from '../../../app/sound'
import { SCENE_NAME } from '../SceneManager'
import { styles } from '../../../app/styles'
import MenuUI from './MenuUI'
import { POPUP_TYPE } from '../../popup/popupTypes'

class MenuButton extends Container {
    constructor(title, subtitle, description, clickAction, isAvailable, x, y) {
        super()

        this.position.set(x, y)
        this.alpha = isAvailable ? 1 : 0.5
        this.isAvailable = isAvailable
        this.clickAction = clickAction

        this.bg = new Graphics()
        this.addChild(this.bg)
        this.bg.roundRect(-80, -40, 160, 80, 16)
        this.bg.fill(0x6600ff)
        this.bg.stroke({ width: 3, color: 0x000000 })

        this.title = new Text({ text: title, style: styles.damage })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -25)
        this.addChild(this.title)

        this.subtitle = new Text({ text: subtitle, style: styles.damage })
        this.subtitle.anchor.set(0.5)
        this.subtitle.position.set(0, 0)
        this.addChild(this.subtitle)

        this.description = new Text({ text: description, style: styles.damage })
        this.description.anchor.set(0.5)
        this.description.position.set(0, 25)
        this.addChild(this.description)

        setCursorPointer(this)
        this.on('pointerup', this.getClick, this)
    }

    setActive(isAvailable) {
        if (this.isAvailable === isAvailable) return

        this.isAvailable = isAvailable
        this.alpha = isAvailable ? 1 : 0.5
    }

    getClick() {
        if (!this.isAvailable) return

        this.clickAction()
    }

    kill() {
        this.parent.removeChild(this)
        removeCursorPointer(this)
        this.off('pointerup', this.getClick, this)
        this.destroy({children: true})
    }
}

export default class MenuScene extends Container {
    constructor() {
        super()

        gameplayRunSDK()

        this.currentLanguage = getLanguage()
        EventHub.on(events.updateLanguage, this.updateLanguage, this)

        this.bg = new BackgroundImage(images.menu_bg)
        this.addChild(this.bg)

        this.buttonsContainer = new Container()
        this.addChild(this.buttonsContainer)

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
        // Вычисляем цены
        this.wizardPrice = getWizardPrice()
        this.catapultPrice = getCatapultPrice()
        this.levelPrice = (level + 1) * levelStartPrice

        // Кнопка мага
        // title, subtitle, description, clickAction, isAvailable, x, y
        this.btnAddWizard = new MenuButton(
            '+WIZARD', this.wizardPrice, 'add on tower',
            this.addWizard.bind(this), (this.wizardPrice <= gold && wizardsCount < 4),
            -90, -200
        )

        // Кнопка катапульты
        // title, subtitle, description, clickAction = null, isAvailable = true, x, y
        this.btnAddCatapult = new MenuButton(
            '+CATAPULT', this.catapultPrice, 'add on tower',
            this.addCatapult.bind(this), (this.catapultPrice <= gold && catapultsCount < 4),
            90, -200
        )

        // Кнопка уровня
        // title, subtitle, description, clickAction = null, isAvailable = true, x, y
        this.btnAddLevel = new MenuButton(
            '+LEVEL', this.levelPrice, 'upgrade',
            this.addLevel.bind(this), (this.levelPrice <= gold),
            -90, -100
        )

        // Кнопка золота
        // title, subtitle, description, clickAction = null, isAvailable = true, x, y
        this.btnAddGold = new MenuButton(
            '+ GOLD', adGoldBonus, 'for AD',
            this.addGold.bind(this), true,
            90, -100
        )

        // Кнопка старта
        // title, subtitle, description, clickAction = null, isAvailable = true, x, y
        this.btnStartNextRound = new MenuButton(
            'START', round, 'ROUND',
            this.startNextRound.bind(this), true,
            0, 200
        )

        this.buttonsContainer.addChild(
            this.btnAddWizard, this.btnAddCatapult,
            this.btnAddLevel, this.btnAddGold,
            this.btnStartNextRound
        )
    }

    refreshButtons() {
        // Вычисляем цены
        this.wizardPrice = getWizardPrice()
        this.catapultPrice = getCatapultPrice()
        this.levelPrice = (level + 1) * levelStartPrice

        this.btnAddWizard.setActive(this.wizardPrice <= gold && wizardsCount < 4)
        this.btnAddCatapult.setActive(this.catapultPrice <= gold && catapultsCount < 4)
        this.btnAddLevel.setActive(this.levelPrice <= gold)

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
        startScene(SCENE_NAME.Level)
    }

    updateLanguage(lang) {
        this.currentLanguage = lang
    }

    kill() {
        this.bg.destroy()

        for(let i = this.buttonsContainer.children.length - 1; i >= 0; i--) {
            const btn = this.buttonsContainer.children[i]
            btn.kill()
            btn.destroy({ children: true })
        }

        if (this.flyTexts) {
            this.flyTexts.destroy({ children: true })
            this.flyTexts = null
        }

        if (this.ui) {
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