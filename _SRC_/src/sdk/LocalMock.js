const MOCK_LANGUAGE = 'ru'
const MOCK_STORAGE_KEY = 'test-01'

export const MOCK_LEADERBOARD_NAME = 'crashDashLB';
const MOCK_FETCH_DELAY = 1500; // имитация задержки сети

/**
 * Моковый SDK для тестирования
 * @class
 * @param {function} readyCallback - вызывается сразу
 * @param {function} getStateForSaveCallback - возвращает данные для сохранения
 * @param {function} setSavedStateCallback - принимает загруженные данные
 * @param {Array} leaderboardNames - не используется
 */
export default class LocalMockSDK {
    constructor(
        readyCallback = null,
        getStateForSaveCallback = null,
        setSavedStateCallback = null,
        leaderboardNames = []
    ) {
        this._getStateForSaveCallback = getStateForSaveCallback;
        this._setSavedStateCallback = setSavedStateCallback;
        this._leaderboardNames = leaderboardNames;

        // Хранилище лидербордов в памяти
        this._leaderboards = {};
        leaderboardNames.forEach(name => {
            if (!this._leaderboards[name]) {
                // Создаём 20 тестовых записей
                const mockEntries = [];
                for (let i = 1; i <= 21; i++) {
                    mockEntries.push({
                        playerName: `Player_${i}`,
                        score: 1129 - i * 47,
                        extraData: '',
                    });
                }
                // Сортируем по убыванию
                mockEntries.sort((a, b) => b.score - a.score);
                this._leaderboards[name] = mockEntries;
            }
        });

        // Данные авторизации
        this._isAuth = false;
        this._playerName = null;

        // Сохранение игры (не трогаем)
        if (getStateForSaveCallback) {
            window.addEventListener('beforeunload', () => {
                const data = getStateForSaveCallback();
                localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
            });
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    const data = getStateForSaveCallback();
                    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
                }
            });
        }

        if (readyCallback) setTimeout(() => readyCallback(), 0);
    }

    // ===== БАЗОВЫЕ МЕТОДЫ =====
    gameReady() {}
    gameplayStart() {}
    gameplayStop() {}

    getLanguageCode() {
        return MOCK_LANGUAGE;
    }

    getSavedData() {
        if (!this._setSavedStateCallback) return;
        const savedData = localStorage.getItem(MOCK_STORAGE_KEY);
        this._setSavedStateCallback(savedData ? JSON.parse(savedData) : {});
    }

    save() {
        if (!this._getStateForSaveCallback) return;
        const data = this._getStateForSaveCallback();
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
    }

    showFullScreenAd(callback = null) {
        alert('showFullScreenAd');
        if (callback) callback();
    }

    showRewardAd(callback = null) {
        const reward = confirm('showRewardAd');
        if (callback) callback(!!reward);
    }

    // ===== АВТОРИЗАЦИЯ =====
    isAuthorized() {
        return this._isAuth;
    }

    requestAuth(callback) {
        const name = prompt('Введите имя игрока:', 'Player_' + Math.floor(Math.random() * 1000));
        if (name) {
            this._isAuth = true;
            this._playerName = name.trim() || 'Anonymous';
        } else {
            this._isAuth = false;
            this._playerName = null;
        }
        if (callback) callback(this._isAuth);
    }

    // ===== ЛИДЕРБОРДЫ =====
    setLeaderboardScore(leaderboardName, score, extraData = '') {
        if (!this.isAuthorized()) return;
        if (!this._leaderboards[leaderboardName]) return;

        const entries = this._leaderboards[leaderboardName];
        const existing = entries.find(e => e.playerName === this._playerName);

        if (existing) {
            // Обновляем, только если новый счёт больше
            if (score > existing.score) {
                existing.score = score;
                existing.extraData = extraData;
            }
        } else {
            entries.push({
                playerName: this._playerName,
                score,
                extraData,
            });
        }

        // Сортируем по убыванию счёта
        entries.sort((a, b) => b.score - a.score);
    }

    fetchLeaderboard(leaderboardName, topQuantity, aroundQuantity, callback) {
        const entries = this._leaderboards[leaderboardName] || [];
        const isAuth = this.isAuthorized();

        // Имитация задержки сети
        setTimeout(() => {
            // Формируем топ (первые topQuantity записей)
            const topEntries = entries.slice(0, topQuantity).map((entry, index) => ({
                rank: index + 1,
                playerName: entry.playerName,
                score: entry.score,
                formattedScore: String(entry.score),
                avatarSrc: null,
                isCurrentUser: isAuth && entry.playerName === this._playerName,
            }));

            let userRank = undefined;
            let aroundEntries = [];

            if (isAuth) {
                const playerIndex = entries.findIndex(e => e.playerName === this._playerName);
                if (playerIndex !== -1) {
                    userRank = playerIndex + 1;
                    // Берём aroundQuantity записей выше и ниже
                    const start = Math.max(0, playerIndex - aroundQuantity);
                    const end = Math.min(entries.length, playerIndex + aroundQuantity + 1);
                    aroundEntries = entries.slice(start, end).map((entry, idx) => ({
                        rank: start + idx + 1,
                        playerName: entry.playerName,
                        score: entry.score,
                        formattedScore: String(entry.score),
                        avatarSrc: null,
                        isCurrentUser: entry.playerName === this._playerName,
                    }));
                }
                // Если игрока нет в таблице, userRank и aroundEntries остаются undefined/[ ]
            }

            const data = {
                isAuthorized: isAuth,
                topEntries,
                userRank,
                aroundEntries,
            };

            callback(data);
        }, MOCK_FETCH_DELAY);
    }
}