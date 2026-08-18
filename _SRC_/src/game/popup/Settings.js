import { Container, Text } from "pixi.js"
import { atlases } from "../../app/assets"
import { styles } from "../../app/styles"
import { EventHub, events } from "../../app/events"
import { BUTTON_TYPE, TEXT_POPUP_TITLE, TEXT_MUSIC, TEXT_SOUND } from "../localText"
import { getAvailableLanguages, getLanguage, getLanguageName, setLanguage } from "../localization"
import {
    musicGetState, musicGetVolume, musicOff, musicOn, musicSetVolume,
    soundGetState, soundGetVolume, soundOff, soundOn, soundSetVolume
} from "../../app/sound"
import Button from "../UI/Button"
import TapIcon from "../UI/TapIcon"
import { POPUP_TYPE } from "./popupTypes"

export default class Settings extends Container {
    constructor(popup) {
        super()
        this.popup = popup
        this.currentLanguage = getLanguage()
        this.langCodes = getAvailableLanguages().map(item => item.code)
        this.langIndex = this.langCodes.indexOf(this.currentLanguage)

        // Устанавливаем фон, если надо временно заменить кастомный
        // this.popup.setBackgroundColor([0x1a1a2e, 0x16213e, 0x0f3460])
        // this.popup.setBackgroundImage(texture)
        // this.popup.setBackgroundTile(texture)

        this.isActive = false

        // Заголовок
        this.title = new Text({
            text: TEXT_POPUP_TITLE[POPUP_TYPE.SETTINGS][this.currentLanguage],
            style: styles.popupTitle
        })
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.addChild(this.title)

        // Музыка
        this.musicLabel = new Text({
            text: TEXT_MUSIC[this.currentLanguage],
            style: styles.popupLabel
        })
        this.musicLabel.anchor.set(0.5)
        this.musicLabel.position.set(-200, -160)
        this.addChild(this.musicLabel)

        const musicIconIndex = this.findSoundMusic(true)
        this.musicBtn = new TapIcon(
            atlases.ui.textures['music_' + musicIconIndex],
            () => this.changeMusic()
        )
        this.musicBtn.anchor.set(0.5)
        this.musicBtn.position.set(-200, -70)
        this.addChild(this.musicBtn)

        // Звук
        this.soundLabel = new Text({
            text: TEXT_SOUND[this.currentLanguage],
            style: styles.popupLabel
        })
        this.soundLabel.anchor.set(0.5)
        this.soundLabel.position.set(200, -160)
        this.addChild(this.soundLabel)

        const soundIconIndex = this.findSoundMusic(false)
        this.soundBtn = new TapIcon(
            atlases.ui.textures['sound_' + soundIconIndex],
            () => this.changeSound()
        )
        this.soundBtn.anchor.set(0.5)
        this.soundBtn.position.set(200, -70)
        this.addChild(this.soundBtn)

        // Язык
        this.langLabel = new Text({
            text: getLanguageName(),
            style: styles.popupLabel
        })
        this.langLabel.anchor.set(0.5)
        this.langLabel.position.set(0, 10)
        this.addChild(this.langLabel)

        this.leftBtn = new TapIcon(
            atlases.ui.textures.left,
            () => this.prevLang()
        )
        this.leftBtn.anchor.set(0.5)
        this.leftBtn.position.set(-120, 90)
        this.addChild(this.leftBtn)

        this.langCodeText = new Text({
            text: this.currentLanguage.toUpperCase(),
            style: styles.popupTitle
        })
        this.langCodeText.anchor.set(0.5)
        this.langCodeText.position.set(0, 90)
        this.addChild(this.langCodeText)

        this.rightBtn = new TapIcon(
            atlases.ui.textures.right,
            () => this.nextLang()
        )
        this.rightBtn.anchor.set(0.5)
        this.rightBtn.position.set(120, 90)
        this.addChild(this.rightBtn)

        // Кнопка закрытия
        this.closeBtn = new Button(null, BUTTON_TYPE.BACK, () => {
            EventHub.emit(events.closePopup)
        })
        this.closeBtn.position.set(0, 265)
        this.closeBtn.scale.set(0.75)
        this.addChild(this.closeBtn)
    }

    setActive(isActive) {
        this.isActive = isActive
    }

    findSoundMusic(isMusic) {
        const isOn = isMusic ? musicGetState() : soundGetState()
        if (!isOn) return 0
        const volume = isMusic ? musicGetVolume() : soundGetVolume()
        if (volume > 0.7) return 3
        if (volume > 0.4) return 2
        return 1
    }

    changeMusic() {
        if(!this.isActive) return

        const volume = musicGetVolume()
        let iconIndex = 0
        if (volume > 0.7) {
            musicSetVolume(0)
            musicOff()
        } else if (volume > 0.4) {
            musicSetVolume(1)
            iconIndex = 3
        } else if (volume > 0.1) {
            musicSetVolume(0.5)
            iconIndex = 2
        } else {
            musicSetVolume(0.25)
            musicOn()
            iconIndex = 1
        }
        this.musicBtn.setIcon(atlases.ui.textures['music_' + iconIndex])
    }

    changeSound() {
        if(!this.isActive) return

        const volume = soundGetVolume()
        let iconIndex = 0
        if (volume > 0.7) {
            soundSetVolume(0)
            soundOff()
        } else if (volume > 0.4) {
            soundSetVolume(1)
            iconIndex = 3
        } else if (volume > 0.1) {
            soundSetVolume(0.5)
            iconIndex = 2
        } else {
            soundSetVolume(0.25)
            soundOn()
            iconIndex = 1
        }
        this.soundBtn.setIcon(atlases.ui.textures['sound_' + iconIndex])
    }

    prevLang() {
        if(!this.isActive) return

        this.langIndex = (this.langIndex - 1 + this.langCodes.length) % this.langCodes.length
        this.updateLanguage(this.langCodes[this.langIndex])
    }

    nextLang() {
        if(!this.isActive) return
        
        this.langIndex = (this.langIndex + 1) % this.langCodes.length
        this.updateLanguage(this.langCodes[this.langIndex])
    }

    updateLanguage(code) {
        this.currentLanguage = code
        setLanguage(code)

        this.title.text = TEXT_POPUP_TITLE[POPUP_TYPE.SETTINGS][this.currentLanguage]
        this.musicLabel.text = TEXT_MUSIC[this.currentLanguage]
        this.soundLabel.text = TEXT_SOUND[this.currentLanguage]
        this.langLabel.text = getLanguageName()
        this.langCodeText.text = this.currentLanguage.toUpperCase()
    }
}