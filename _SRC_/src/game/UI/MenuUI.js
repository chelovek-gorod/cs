import { Container, Text, Sprite } from "pixi.js";
import { getAppScreen, getSafeAreaOffsets, kill, tickerAdd, tickerRemove } from "../../app/application";
import { atlases } from "../../app/assets";
import { EventHub, events, startScene, updateTopResults } from "../../app/events";
import { styles } from "../../app/styles";
import { playerCoins, playerLevel, playerSaves, playerTopScore } from "../state";
import TapIcon from "./TapIcon"
import { formatNumber } from "../scenes/level/UI"
import { POPUP_TYPE } from "../popup/popupTypes";
import Button from "./Button";
import { BUTTON_TYPE, TEXT_NEED_LOGIN } from "../localText";
import { getLanguage } from "../localization";
import { loginPlayer, setLeaderboardScore } from "../storage";

export default class MenuUI extends Container {
    constructor(menu, targetScene, buttonType, buttonCallback = null) {
        super()

        this.menu = menu

        this.levelContainer = new Container()
        
        this.levelIcon = new Sprite(atlases.ui.textures.cup)
        this.levelIcon.scale.set(0.5)
        this.levelContainer.addChild(this.levelIcon)

        this.levelText = new Text({text: 'x' + playerLevel, style: styles.level})
        this.levelText.position.set(60, -5)
        this.levelContainer.addChild(this.levelText)

        this.topScoreText = new Text({text: formatNumber(playerTopScore, true), style: styles.target})
        this.topScoreText.position.set(60, 32)
        this.levelContainer.addChild(this.topScoreText)

        this.addChild(this.levelContainer)

        this.settingsContainer = new Container()
        this.settingsButton = new TapIcon( atlases.ui.textures.settings, this.openSettings.bind(this), true )
        this.settingsButton.anchor.set(1, 0)
        this.settingsButton.scale.set(0.5)
        this.settingsContainer.addChild(this.settingsButton)
        this.addChild(this.settingsContainer)

        this.coinAnimations = 0
        this.coinContainer = new Container()

        this.coinIcon = new Sprite(atlases.ui.textures.coin)
        this.coinIcon.anchor.set(1, 0)
        this.coinIcon.scale.set(0.5)
        this.coinContainer.addChild(this.coinIcon)

        this.coinsText = new Text({text: 'x' + playerCoins, style: styles.coins})
        this.coinsText.position.set(0, 10)
        this.coinContainer.addChild(this.coinsText)

        this.addChild(this.coinContainer)

        this.saveAnimations = 0
        this.saveContainer = new Container()

        this.saveIcon = new Sprite(atlases.ui.textures.save)
        this.saveIcon.scale.set(0.5)
        this.saveContainer.addChild(this.saveIcon)

        this.savesText = new Text({text: 'x' + playerSaves, style: styles.saves})
        this.savesText.anchor.set(1, 0)
        this.savesText.position.set(0, 5)
        this.saveContainer.addChild(this.savesText)

        this.addChild(this.saveContainer)

        this.buttonContainer = new Container()
        this.buttonCallback = buttonCallback
            ? buttonCallback
            : () => {
                if (!this.menu.isMenuActive) return

                this.menu.isMenuActive = false
                startScene(targetScene)
            }
        this.startButton = new Button(
            null, buttonType, this.buttonCallback.bind(this), true
        )
        this.startButton.scale.set(0.75)
        this.buttonContainer.addChild(this.startButton)
        this.addChild(this.buttonContainer)

        this.loginText = null
        this.loginButton = null

        EventHub.on( events.updateLanguage, this.updateLanguage, this )
    }

    screenResize(screenData) {
        const safeArea = getSafeAreaOffsets()
        const scaleUI = Math.min( 1, screenData.width / 500, screenData.height / 500 )
        const scaleBC = Math.min( scaleUI, 
            this.loginButton ? screenData.width / 800 : screenData.width / 400
        )

        this.levelContainer.scale.set(scaleUI)
        this.settingsContainer.scale.set(scaleUI)
        this.coinContainer.scale.set(scaleUI)
        this.saveContainer.scale.set(scaleUI)

        this.buttonContainer.scale.set(scaleBC)

        const topX = screenData.centerX - 10
        const topY = -screenData.centerY + 10 + safeArea.top

        this.levelContainer.position.set(-topX, topY)
        this.settingsContainer.position.set(topX, topY)

        if (screenData.isLandscape) {
            const offset = Math.ceil(screenData.width / 8)
            this.coinContainer.position.set(-offset, topY)
            this.saveContainer.position.set(offset, topY)
        } else {
            this.coinContainer.position.set(-topX + 65 * scaleUI, topY + 80 * scaleUI)
            this.saveContainer.position.set(topX - 65 * scaleUI, topY + 80 * scaleUI)
        }

        this.buttonContainer.position.set(0, screenData.centerY - 75 * scaleBC - safeArea.bottom)
        if (this.loginButton) {
            this.startButton.position.set(-140, 0)
            this.loginButton.position.set(140, 0)
            this.loginText.position.set(0, -70)
        } else {
            this.startButton.position.set(0, 0)
        }
    }

    changeLogin(isAuthorized) {
        if (isAuthorized) {
            if (this.loginText) {
                this.buttonContainer.removeChild(this.loginText)
                this.loginText.destroy()
                this.loginText = null
            }
            if (this.loginButton) {
                this.buttonContainer.removeChild(this.loginButton)
                kill(this.loginButton)
                this.loginButton = null
            }
        } else {
            if (!this.loginText) {
                this.loginText = new Text({text: TEXT_NEED_LOGIN[getLanguage()], style: styles.topTableCenter})
                this.loginText.anchor.set(0.5)
                this.buttonContainer.addChild(this.loginText)
            }

            if (!this.loginButton) {
                this.loginButton = new Button(null, BUTTON_TYPE.LOGIN, this.clickLogin.bind(this))
                this.loginButton.scale.set(0.75)
                this.buttonContainer.addChild(this.loginButton)
            }
        }
        this.screenResize(getAppScreen())
    }

    clickLogin() {
        loginPlayer((isOk) => {
            if (isOk) {
                setLeaderboardScore(playerTopScore)
                updateTopResults()
            }
        })
    }

    openSettings() {
        this.menu.popup.show(POPUP_TYPE.SETTINGS)
    }

    updateCoins() {
        this.coinsText.text = 'x' + playerCoins
        this.coinAnimations = 2
        tickerAdd(this)
    }

    updateSaves() {
        this.savesText.text = 'x' + Math.max(0, playerSaves)
        this.saveAnimations = 2
        tickerAdd(this)
    }

    resetButton(buttonType, targetScene, buttonCallback = null) {
        this.buttonCallback = buttonCallback
            ? buttonCallback
            : () => {
                if (!this.menu.isMenuActive) return

                this.menu.isMenuActive = false
                startScene(targetScene)
            }
        this.startButton.setCallback(this.buttonCallback.bind(this))
        if (buttonType) this.startButton.setTextKey( buttonType )
    }

    updateLanguage(lang) {
        if (this.loginText) this.loginText.text = TEXT_NEED_LOGIN[lang]
    }

    tick(deltaMs) {
        if (this.saveAnimations > 0) {
            if (this.saveAnimations % 2 === 0) {
                this.saveIcon.scale.set( Math.min(0.6, this.saveIcon.scale.x + 0.0006 * deltaMs) )
                if (this.saveIcon.scale.x === 0.6) this.saveAnimations--
            } else {
                this.saveIcon.scale.set( Math.max(0.5, this.saveIcon.scale.x - 0.0006 * deltaMs) )
                if (this.saveIcon.scale.x === 0.5) {
                    this.saveAnimations--
                    if (this.saveAnimations === 0 && this.coinAnimations === 0) tickerRemove(this)
                }
            }
        }

        if (this.coinAnimations > 0) {
            if (this.coinAnimations % 2 === 0) {
                this.coinIcon.scale.set( Math.min(0.6, this.coinIcon.scale.x + 0.0006 * deltaMs) )
                if (this.coinIcon.scale.x === 0.6) this.coinAnimations--
            } else {
                this.coinIcon.scale.set( Math.max(0.5, this.coinIcon.scale.x - 0.0006 * deltaMs) )
                if (this.coinIcon.scale.x === 0.5) {
                    this.coinAnimations--
                    if (this.saveAnimations === 0 && this.coinAnimations === 0) tickerRemove(this)
                }
            }
        }
    }

    kill() {
        tickerRemove(this)
        EventHub.off( events.updateLanguage, this.updateLanguage, this )
    }
}