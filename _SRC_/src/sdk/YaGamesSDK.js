const SAVE_DELAY_DATA = 4000 // частота сохранения строковых
const SAVE_DELAY_LB_DATA = 2000 // частота сохранения значений в лидерборд
const GET_DELAY_LB_DATA = 16000 // частота запросов данных из лидерборд
const INIT_DELAY = 100 // кастомная задержка повтора инициализации

/**
 * Универсальный Yandex SDK для интеграции с Яндекс Играми
 * @class
 * @param {function} readyCallback 
 * @param {function} getStateForSaveCallback
 * @param {function} setSavedStateCallback
 * @param leaderboardNames: []
 */
export default class YaGamesSDK {
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
        // this.player.isAuthorized() -> прямой вызов без промиса, вернет true / false
        /* this.SDK.auth.openAuthDialog().then(() => {
                    this.initPlayer() // нужна повторная инициализация
                }).catch(() => {
                    // Игрок не авторизован.
                });
        */
        // !!! Для работы с SDK.leaderboards важно что бы игрок был авторизирован

        // Кэш лидербордов
        this._leaderboardCache = {
            entries: {},      // leaderboardName -> { data: LeaderboardData, timestamp: number }
            pendingScores: {} // leaderboardName -> { score: number, extraData: string, timer: number | null }
        }
        this._fetchTimers = {}; // leaderboardName -> timeoutID

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

        // Принудительно отправляем счета в лидерборды (если есть)
        if (this._leaderboardNames.length && this.isAuthorized() && this._SDK?.leaderboards) {
            const pending = this._leaderboardCache.pendingScores;
            Object.entries(pending).forEach(([name, item]) => {
                if (item.timer) {
                    clearTimeout(item.timer);
                    item.timer = null;
                }
                this._SDK.leaderboards.setScore(name, item.score, item.extraData)
                    .catch(err => console.warn(`Flush score failed for ${name}:`, err));
                delete pending[name];
            });
        }
    }

    /**
     * инициализируем SDK
     * @private
     */
    _initSDK() {
        if(!YaGames) return this._initTimer = setTimeout(() => this._initSDK(), INIT_DELAY)

        YaGames.init().then( SDK => {
            clearTimeout( this._initTimer )
            this._SDK = SDK
            this._initPlayer()
        }).catch( e => this._initTimer = setTimeout(() => this._initSDK(), INIT_DELAY))
    }

    /**
     * инициализируем игрока
     * @private
     */
    _initPlayer() {
        // для лидербордов и инап покупок нужен signed параметр
        const parameterPlayer = this._leaderboardNames.length === 0 ? {} : { signed: true }
        this._SDK.getPlayer(parameterPlayer).then( player => {
            clearTimeout( this._initTimer )
            this._player = player
            if (this._leaderboardNames.length) {
                this._initLeaderboard()
            } else {
                this._isReady = true
                if (this._readyCallback) this._readyCallback()
            }
        }).catch( e => this._initTimer = setTimeout(() => this._initPlayer(), INIT_DELAY))
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
        if (this._SDK && 'features' in this._SDK && 'LoadingAPI' in this._SDK.features) {
            this._SDK.features.LoadingAPI.ready()
        } else {
            console.warn('*** can not call SDK.gameReady() ***')
            this._initTimer = setTimeout(() => this.gameReady(), 1000)
        }
    }

    gameplayStart() {
        if (!this._SDK) return

        this._SDK?.features?.GameplayAPI?.start()
    }

    gameplayStop() {
        if (!this._SDK) return

        this._SDK?.features?.GameplayAPI?.stop()
    }

    getLanguageCode() {
        try {
            return this?._SDK?.environment?.i18n?.lang ?? null
        } catch {
            return null
        }
    }

    /**
     * Проверяет, авторизован ли игрок
     * @returns {boolean}
     */
    isAuthorized() {
        return !!(this._player && typeof this._player.isAuthorized === 'function' && this._player.isAuthorized());
    }

    /**
     * Запрашивает авторизацию игрока
     * @param {function(boolean)} callback - вызывается с результатом авторизации
     */
    requestAuth(callback) {
        if (!this._SDK) {
            callback(false);
            return;
        }

        this._SDK.auth.openAuthDialog()
            .then(() => {
                // После успешной авторизации переинициализируем player
                const parameterPlayer = this._leaderboardNames.length === 0 ? {} : { signed: true };
                return this._SDK.getPlayer(parameterPlayer);
            })
            .then(player => {
                this._player = player;
                callback(true);
            })
            .catch(error => {
                console.warn('Auth failed or cancelled:', error);
                callback(false);
            });
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

    /**
     * Отправляет счёт в лидерборд (с троттлингом и повторными попытками при ошибках)
     * @param {string} leaderboardName - имя лидерборда
     * @param {number} score - количество очков
     * @param {string} [extraData] - дополнительные данные
     */
    setLeaderboardScore(leaderboardName, score, extraData = '') {
        if (!this.isAuthorized()) return;

        if (!this._leaderboardCache.pendingScores[leaderboardName]) {
            this._leaderboardCache.pendingScores[leaderboardName] = {
                score: score,
                extraData: extraData,
                timer: null
            };
        } else {
            const pending = this._leaderboardCache.pendingScores[leaderboardName];
            pending.score = score;
            pending.extraData = extraData;
            // Если таймер уже запущен, просто обновляем данные
            if (pending.timer !== null) return;
        }

        const pending = this._leaderboardCache.pendingScores[leaderboardName];
        
        const sendScore = () => {
            if (!this.isAuthorized()) return;
            if (!this._SDK || !this._SDK.leaderboards) {
                // SDK ещё не готов — пробуем позже
                pending.timer = setTimeout(sendScore, SAVE_DELAY_LB_DATA);
                return;
            }

            const currentScore = pending.score;
            const currentExtra = pending.extraData;

            this._SDK.leaderboards.setScore(leaderboardName, currentScore, currentExtra)
                .then(() => {
                    pending.timer = null;
                    // Если за время отправки появился новый счёт — сразу запускаем его отправку
                    if (pending.score !== currentScore || pending.extraData !== currentExtra) {
                        pending.timer = setTimeout(sendScore, SAVE_DELAY_LB_DATA)
                    }
                })
                .catch(err => {
                    console.warn(`Failed to set score for ${leaderboardName}, retrying:`, err);
                    // Повторная попытка через таймаут
                    pending.timer = setTimeout(sendScore, SAVE_DELAY_LB_DATA);
                });
        };

        pending.timer = setTimeout(sendScore, SAVE_DELAY_LB_DATA);
    }

    /**
     * Загружает данные лидерборда (топ и позицию игрока, если авторизован)
     * @param {string} leaderboardName - имя лидерборда
     * @param {number} topQuantity - сколько записей из топа вернуть (1-20)
     * @param {number} aroundQuantity - сколько соседей вокруг игрока (1-10)
     * @param {function(object)} callback - вызывается с объектом LeaderboardData
     */
    fetchLeaderboard(leaderboardName, topQuantity, aroundQuantity, callback) {
        const cached = this._leaderboardCache.entries[leaderboardName];
        const now = Date.now();

        // Если кэш свежий — сразу отдаём
        if (cached && (now - cached.timestamp) < GET_DELAY_LB_DATA) {
            callback(cached.data);
            return;
        }

        // Если кэш устарел, но есть — отдаём устаревшие данные сразу
        if (cached) {
            callback(cached.data);
        }

        // Функция выполнения запроса с повторными попытками
        const doFetch = () => {
            if (!this._SDK || !this._SDK.leaderboards) {
                // SDK не готов — пробуем позже
                this._fetchTimers[leaderboardName] = setTimeout(doFetch, GET_DELAY_LB_DATA);
                return;
            }

            const isAuth = this.isAuthorized();
            
            let requestPromise;
            if (!isAuth) {
                requestPromise = this._SDK.leaderboards.getEntries(leaderboardName, {
                    includeUser: false,
                    quantityTop: topQuantity
                });
            } else {
                requestPromise = this._SDK.leaderboards.getEntries(leaderboardName, {
                    includeUser: true,
                    quantityTop: topQuantity,
                    quantityAround: aroundQuantity
                });
            }

            requestPromise
                .then(res => {
                    // Преобразуем ответ SDK в LeaderboardData
                    const topEntries = res.entries.slice(0, topQuantity).map(entry => ({
                        rank: entry.rank,
                        playerName: entry.player.publicName,
                        score: entry.score,
                        formattedScore: entry.formattedScore,
                        avatarSrc: entry.player.getAvatarSrc('medium'),
                        isCurrentUser: false
                    }));

                    let userRank = res.userRank;
                    let aroundEntries = [];

                    if (isAuth && res.userRank) {
                        // Выделяем соседей (ранги вокруг userRank)
                        aroundEntries = res.entries
                            .filter(entry => entry.rank !== undefined)
                            .map(entry => ({
                                rank: entry.rank,
                                playerName: entry.player.publicName,
                                score: entry.score,
                                formattedScore: entry.formattedScore,
                                avatarSrc: entry.player.getAvatarSrc('medium'),
                                isCurrentUser: entry.rank === res.userRank
                            }));
                    }

                    const data = {
                        isAuthorized: isAuth,
                        topEntries: topEntries,
                        userRank: userRank,
                        aroundEntries: aroundEntries
                    };

                    // Сохраняем в кэш
                    this._leaderboardCache.entries[leaderboardName] = {
                        data: data,
                        timestamp: Date.now()
                    };

                    // Вызываем callback, если это первая загрузка или обновление после устаревшего кэша
                    callback(data);
                    delete this._fetchTimers[leaderboardName];
                })
                .catch(err => {
                    console.warn(`Failed to fetch leaderboard ${leaderboardName}, retrying:`, err);
                    // Повторная попытка через таймаут
                    this._fetchTimers[leaderboardName] = setTimeout(doFetch, GET_DELAY_LB_DATA);
                });
        };

        // Запускаем запрос (если ещё не запущен)
        if (!this._fetchTimers[leaderboardName]) {
            doFetch();
        }
    }

    showFullScreenAd( callback = null ) {
        if (!this._SDK) return

        this._SDK.features?.GameplayAPI?.stop()
        this._SDK.adv.showFullscreenAdv({
            callbacks: {
                onClose: () => {
                    this?._SDK?.features?.GameplayAPI?.start()
                    callback()
                },
                onError: (e) => {
                    this?._SDK?.features?.GameplayAPI?.start()
                    callback()
                }
            }
        })
    }

    showRewardAd( callback = null ) {
        if (!this._SDK) return

        this._SDK.features?.GameplayAPI?.stop()
        this._SDK.adv.showRewardedVideo({
            callbacks: {
                onRewarded: () => {
                    this?._SDK?.features?.GameplayAPI?.start()
                    callback(true)
                },
                onClose: () => {
                    this?._SDK?.features?.GameplayAPI?.start()
                    callback(false)
                },
                onError: (e) => {
                    this?._SDK?.features?.GameplayAPI?.start()
                    callback(false)
                }
            }
        })
    }
}