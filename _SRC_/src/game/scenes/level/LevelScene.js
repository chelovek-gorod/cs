import { Container } from 'pixi.js'
import { music } from '../../../app/assets'
import { EventHub, events, setShutPoint } from '../../../app/events'
import { getLanguage } from '../../localization'
import { gameplayRunSDK, gameplayStopSDK } from '../../storage'
import BackgroundGradient from '../../BG/BackgroundGradient'
import { removeCursorPointer, setCursorPointer } from '../../../utils/functions'
import GameContainer from './GameContainer'


const musics = [ music.bgm_1, music.bgm_2, music.bgm_3, music.bgm_4 ]
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

        this.bg = new BackgroundGradient([0x00aa00,0x009900])
        setCursorPointer(this.bg)
        this.bg.on('pointerdown', this.getPointerDown, this)
        this.bg.on('pointermove', this.getPointerMove, this)
        this.bg.on('pointerup', this.getPointerUp, this)
        this.addChild(this.bg)

        this.gameContainer = new GameContainer()
        this.addChild(this.gameContainer)
        this.UIContainer = null


        this.enemies = new Container()
        
        this.addChild(this.enemies)

        this.flyTexts = new Container()
        this.addChild(this.flyTexts)

        /*
        this.popup = new Popup()
        this.addChild(this.popup)
        */

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
        
        // setMusicList( getMusic() )

        
    }

    screenResize(screenData) {
        // set scene container in center of screen
        this.position.set( screenData.centerX, screenData.centerY )

        this.bg.screenResize(screenData)
        this.gameContainer.screenResize(screenData)

        //this.popup.screenResize(screenData)
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

    updateLanguage(lang) {
        this.currentLanguage = lang
    }

    kill() {
        removeCursorPointer(this.bg)
        this.bg.off('pointerdown', this.getPointerDown, this)
        this.bg.off('pointermove', this.getPointerMove, this)
        this.bg.off('pointerup', this.getPointerUp, this)
        this.bg.destroy()

        gameplayStopSDK()

        if (this.handlerKeyboard) {
            EventHub.off( events.resumeGameplay, this.resumeGameplay, this )
            document.removeEventListener('keydown', this.handlerKeyboard)
            this.handlerKeyboard = null
        }

        EventHub.off( events.updateLanguage, this.updateLanguage, this )
        EventHub.off( events.pauseGameplay, this.pauseGameplay, this )
        //this.tapArea.off('pointerdown', this.getFlyClick, this)
    }
}