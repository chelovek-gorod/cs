import { Container } from 'pixi.js'
import { images, music } from '../../../app/assets'
import { EventHub, events, setShutPoint } from '../../../app/events'
import { getLanguage } from '../../localization'
import { gameplayRunSDK, gameplayStopSDK } from '../../storage'
import BackgroundTiling from '../../BG/BackgroundTiling'
import { removeCursorPointer, setCursorPointer } from '../../../utils/functions'
import GameContainer from './GameContainer'
import LevelUI from './LevelUI'
import { getSafeAreaOffsets } from '../../../app/application'
import { addGold } from '../../state'
import { setMusicList } from '../../../app/sound'


const musics = [ music.bgm_1, music.bgm_2, music.bgm_3, music.bgm_4, music.bgm_5, music.bgm_6, music.bgm_7 ]
let currentMusicIndex = Math.floor( Math.random() * musics.length )
function getMusic() {
    const music = musics[currentMusicIndex]
    currentMusicIndex++
    if (currentMusicIndex === musics.length) currentMusicIndex = 0
    return music
}

export default class LevelScene extends Container {
    constructor() {
        super()

        gameplayRunSDK()

        this.currentLanguage = getLanguage()
        EventHub.on( events.updateLanguage, this.updateLanguage, this )

        this.bg = new BackgroundTiling(images.round_bg)
        setCursorPointer(this.bg)
        this.bg.on('pointerdown', this.getPointerDown, this)
        this.bg.on('pointermove', this.getPointerMove, this)
        this.bg.on('pointerup', this.getPointerUp, this)
        this.addChild(this.bg)

        this.gameContainer = new GameContainer()
        this.addChild(this.gameContainer)

        this.enemies = new Container()
        
        this.addChild(this.enemies)

        this.flyTexts = new Container()
        this.addChild(this.flyTexts)

        this.ui = new LevelUI()
        this.addChild(this.ui)

        EventHub.on( events.pauseGameplay, this.pauseGameplay, this )
        EventHub.on( events.addGoldForKill, this.addGoldForKill, this )

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
        
        setMusicList( getMusic() )
    }

    screenResize(screenData) {
        const safeAreaOffsets = getSafeAreaOffsets()

        // set scene container in center of screen
        this.position.set( screenData.centerX, screenData.centerY )

        this.gameContainer.screenResize(screenData, safeAreaOffsets)

        const bgScale = this.gameContainer.scale.x
        const bgScreenData = {
            width: screenData.width / bgScale,
            height: screenData.height / bgScale,
        }
        this.bg.scale.set(bgScale)
        this.bg.screenResize(bgScreenData)

        this.ui.screenResize(screenData, safeAreaOffsets)
    }

    pauseGameplay() {
        //this.popup.show( POPUP_TYPE.PAUSE )
    }
    resumeGameplay() {
        if (this?.isPausePressed) this.isPausePressed = false
    }

    getPointerDown(data) {
        const localPos = this.bg.toLocal(data.global)
        setShutPoint({x: localPos.x, y: localPos.y, type: 'down'})
    }
    getPointerMove(data) {
        const localPos = this.bg.toLocal(data.global)
        setShutPoint({x: localPos.x, y: localPos.y, type: 'move'})
    }
    getPointerUp(data) {
        const localPos = this.bg.toLocal(data.global)
        setShutPoint({x: localPos.x, y: localPos.y, type: 'up'})
    }

    addGoldForKill(value) {
        addGold(value)
        this.ui.setGoldText()
    }

    updateLanguage(lang) {
        this.currentLanguage = lang
    }

    kill() {
        removeCursorPointer(this.bg)
        this.bg.off('pointerdown', this.getPointerDown, this)
        this.bg.off('pointermove', this.getPointerMove, this)
        this.bg.off('pointerup', this.getPointerUp, this)
        this.bg.destroy()

        this.gameContainer.kill()

        gameplayStopSDK()

        if (this.handlerKeyboard) {
            EventHub.off( events.resumeGameplay, this.resumeGameplay, this )
            document.removeEventListener('keydown', this.handlerKeyboard)
            this.handlerKeyboard = null
        }

        EventHub.off( events.updateLanguage, this.updateLanguage, this )
        EventHub.off( events.pauseGameplay, this.pauseGameplay, this )
        EventHub.off( events.addGoldForKill, this.addGoldForKill, this )
    }
}