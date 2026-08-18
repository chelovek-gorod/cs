const SAVE_DELAY_DATA = 4000 // частота сохранения строковых
const SAVE_DELAY_LB_DATA = 2000 // частота сохранения значений в лидерборд
const GET_DELAY_LB_DATA = 16000 // частота запросов данных из лидерборд
const INIT_DELAY = 100 // кастомная задержка повтора инициализации

/**
 * Универсальный CrazyGames SDK для интеграции с CrazyGames
 * @class
 * @param {function} readyCallback 
 * @param {function} getStateForSaveCallback
 * @param {function} setSavedStateCallback
 * @param leaderboardNames: []
 */
export default class CrazyGamesSDK {
    constructor(
            readyCallback = null,
            getStateForSaveCallback = null,
            setSavedStateCallback = null,
            leaderboardNames = []
        ) {

        this._readyCallback = readyCallback
        this._getStateForSaveCallback = getStateForSaveCallback
        this._setSavedStateCallback = setSavedStateCallback
        this._leaderboardNames = leaderboardNames
        this._isSaveUsed = this._getStateForSaveCallback && this._setSavedStateCallback

        this._isReady = false // this.SDK, this.player, ?this.leaderboard

        this._SDK = null        
        // this.SDK.environment.i18n.lang - код языка
        // this.SDK.features.LoadingAPI?.ready() - игра готова к взаимодействию с игроком
        // this.SDK.features.GameplayAPI?.start() - Сообщаем о старте геймплея
        // this.SDK.features.GameplayAPI?.stop() - Сообщаем об остановке геймплея

        this._player = null

        this._saveTimerData = {
            timeout: null,
            isLoad: this._isSaveUsed,
            isSave: false
        }
        this._initTimer = setTimeout(() => this._initSDK(), 0)

        // Настраиваем обработчики для сохранения при закрытии
        if (this._isSaveUsed) {
            this._isFlushSavingEmit = false
            window.addEventListener('beforeunload', () => this._flushSaving() )
            document.addEventListener('visibilitychange', () => this._flushSaving() )
        }
    }

    /**
     * Сохранение при закрытии окна (потеря видимости = закрытие для IOS)
     * @private
     */
    _flushSaving() {
        if (document.visibilityState === 'visible') {
            this._isFlushSavingEmit = false
            return
        }

        if (this._isFlushSavingEmit || !this._player) return

        this._handleSave( true )
    }

    /**
     * инициализируем SDK
     * @private
     */
    _initSDK() {
        if(typeof window === 'undefined' || !window.CrazyGames || !window.CrazyGames.SDK) {
            return this._initTimer = setTimeout(() => this._initSDK(), INIT_DELAY)
        }

        this._SDK = window.CrazyGames.SDK
        
        this._SDK.init().then(() => {
            clearTimeout(this._initTimer)
            this._initPlayer()
        }).catch(e => this._initTimer = setTimeout(() => this._initSDK(), INIT_DELAY))
    }

    /**
     * инициализируем игрока
     * @private
     */
    _initPlayer() {
        const userInfo = this._SDK.user.getUser()
        
        // Создаем player с API совместимым с Яндекс версией
        this._player = {
            isAuthorized: () => !!userInfo?.username,
            getData: () => {
                return this._SDK.data.getItem('gameState').then(value => {
                    try {
                        return typeof value === 'string' ? JSON.parse(value) : (value || {})
                    } catch {
                        return value || {}
                    }
                })
            },
            setData: (data, isFlush) => {
                // isFlush в CrazyGames не поддерживается, игнорируем
                return this._SDK.data.setItem('gameState', data)
            }
        }

        if (this._leaderboardNames.length) {
            this._initLeaderboard()
        } else {
            this._isReady = true
            if (this._readyCallback) this._readyCallback()
        }
    }

    /**
     * инициализируем игрока
     * @private
     */
    _initLeaderboard() {
        /* заглушка */
        clearTimeout( this._initTimer )
        this._isReady = true
        if (this._readyCallback) this._readyCallback()
        /*
        this._SDK._getPlayer().then( player => {
            clearTimeout( this._initTimer )
            this.player = player
            this.isReady = true
            if (this.readyCallback) this.readyCallback()
        }).catch( e => this._initTimer = setTimeout(() => this.initLeaderboard(), INIT_DELAY))
        */
    }

    gameReady() {
        if (this._SDK) {
            // CrazyGames: gameLoadingStart/Stop вместо LoadingAPI.ready()
            this._SDK.gameLoadingStart()
            this._SDK.gameLoadingStop()
        } else {
            console.warn('*** can not call gameReady() ***')
            this._initTimer = setTimeout(() => this.gameReady(), 1000)
        }
    }

    getLanguageCode() {
        try {
            // CrazyGames: язык в user.getUser().lang или navigator.language
            return this?._SDK?.user?.getUser()?.lang || navigator.language || null
        } catch {
            return null
        }
    }

    getSavedData() {
        if (!this._setSavedStateCallback) return

        this._saveTimerData.isLoad = true
        if (this._saveTimerData.timeout === null) this._handleSave()
    }

    save() {
        if (!this._getStateForSaveCallback || !this._player) return

        this._saveTimerData.isSave = true
        if (this._saveTimerData.timeout === null) {
            this._saveTimerData.timeout = setTimeout(
                () => this._handleSave(), SAVE_DELAY_DATA
            )
        }
    }

    /**
     * инициализируем игрока
     * @private
     */
    _handleSave( isFlush = false ) {
        if (!this._player) {
            this._saveTimerData.timeout = setTimeout(
                () => this._handleSave(), SAVE_DELAY_DATA
            )
            return
        }

        clearTimeout(this._saveTimerData.timeout)
        this._saveTimerData.timeout = null

        // приоритет на загрузку, так как загрузка важна при старте
        if (this._saveTimerData.isLoad) {
            this._player.getData().then( (data) => {
                this._saveTimerData.isLoad = false
                this._setSavedStateCallback(data)

                // если есть запрос на сохранение
                if (this._saveTimerData.isSave) {
                    this._saveTimerData.timeout = setTimeout(
                        () => this._handleSave(), SAVE_DELAY_DATA
                    )
                } else {
                    clearTimeout(this._saveTimerData.timeout)
                    this._saveTimerData.timeout = null
                }
            // ошибка загрузки - повторяем вызов через таймаут
            }).catch( (error) => {
                this._saveTimerData.timeout = setTimeout(
                    () => this._handleSave(), SAVE_DELAY_DATA
                )
            })

            return
        } 
        
        // отправка сохранений
        if (this._saveTimerData.isSave) {
            this._saveTimerData.isSave = false
            this._player.setData( this._getStateForSaveCallback(), isFlush ).catch( (error) => {
                this._saveTimerData.isSave = true
                this._saveTimerData.timeout = setTimeout(
                    () => this._handleSave(), SAVE_DELAY_DATA
                )
            })
        }
    }

    gameplayStart() {
        if (!this._SDK) return

        this._SDK?.gameplayStart()
    }

    gameplayStop() {
        if (!this._SDK) return

        this._SDK?.gameplayStop()
    }

    showFullScreenAd( callback = null ) {
        if (!this._SDK) {
            if (callback) callback()
            return
        }

        // CrazyGames: gameplayStop/Start вместо features.GameplayAPI
        this._SDK.gameplayStop()
        
        this._SDK.ad.requestAd('midgame', {
            onEnd: () => {
                this._SDK.gameplayStart()
                if (callback) callback()
            },
            onError: (e) => {
                this._SDK.gameplayStart()
                if (callback) callback()
            }
        })
    }

    showRewardAd( callback = null ) {
        if (!this._SDK) {
            if (callback) callback(false)
            return
        }

        this._SDK.gameplayStop()
        
        this._SDK.ad.requestAd('rewarded', {
            onEnd: () => {
                this._SDK.gameplayStart()
                if (callback) callback(true)
            },
            onError: (e) => {
                this._SDK.gameplayStart()
                if (callback) callback(false)
            }
        })
    }
}