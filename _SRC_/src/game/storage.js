import { gamePause, gameResume, getTopResults } from '../app/events'
import { getSoundData, setStoredSoundData } from '../app/sound'
import LocalMockSDK from '../sdk/LocalMock'
// import YaGamesSDK from '../sdk/YaGamesSDK'
//import CrazyGamesSDK from '../sdk/CrazyGamesSDK'
import { setLanguage, getLanguage } from './localization'
import { getStateData, setStoredState } from './state'

export let isReadySDK = false

const LEADERBOARD_NAME = 'CrashDashLB'

// localStorage.clear()

let SDK = new LocalMockSDK(SDKReadyCallback, SDKgetStateForSave, SDKsetSavedState, [LEADERBOARD_NAME])
// let SDK = new YaGamesSDK(SDKReadyCallback, SDKgetStateForSave, SDKsetSavedState)
// let SDK = new CrazyGamesSDK(SDKReadyCallback, SDKgetStateForSave, SDKsetSavedState)

export function updateStoredData() {
    if (!isReadySDK) return

    SDK.save()
}

function SDKReadyCallback() {
    const sdkLang = SDK.getLanguageCode()
    if (sdkLang) setLanguage( sdkLang, false)

    SDK.getSavedData()
}

function SDKgetStateForSave() {
    const soundState = getSoundData()
    const gameState = getStateData()

    const currentState = {
        language: getLanguage(),

        // sound
        isSoundOn: soundState.isSoundOn,
        soundVolume: soundState.soundVolume,
        isMusicOn: soundState.isMusicOn,
        musicVolume: soundState.musicVolume,
    }

    for(const key in gameState) {
        currentState[key] = gameState[key]
    }

    return currentState
}

function SDKsetSavedState( savedState ) {
    isReadySDK = true

    if ( !savedState || Object.keys( savedState ).length === 0 ) return

    const gameState = {}
    const soundState = {}
    for(const key in savedState) {
        // language
        if (key === 'language') {
            setLanguage( savedState.language, false)
        }

        // sound
        else if (key === 'isSoundOn' || key === 'soundVolume' || key === 'isMusicOn' || key === 'musicVolume') {
            soundState[key] = savedState[key]
        }

        // game
        else {
            gameState[key] =  savedState[key]
        }
    }

    setStoredSoundData(soundState)
    setStoredState(gameState)
}

export function gameReadySDK() {
    SDK.gameReady()
}
export function gameplayRunSDK() {
    SDK.gameplayStart()
}
export function gameplayStopSDK() {
    SDK.gameplayStop()
}
export function showFullScreenAdSDK() {
    gamePause()
    SDK.showFullScreenAd( () => gameResume() )
}
export function showRewardAdSDK( callback ) {
    gamePause()
    SDK.showRewardAd( (isOk) => {
        gameResume()
        /*
        if (isOk) { логика получения награды }
        */
        callback(isOk)
    })
}

export function getTopPlayers() {
    // leaderboardName, topQuantity, aroundQuantity, callback
    SDK.fetchLeaderboard(LEADERBOARD_NAME, 20, 5, (response) => getAnswerTopPlayers(response))
}
function getAnswerTopPlayers(response) {
    // prepare data from response

    // send event with data
    getTopResults(response)
}

export function loginPlayer(callback) {
    SDK.requestAuth((isOk) => callback(isOk))
}

export function setLeaderboardScore(score, extraData = '') {
    SDK.setLeaderboardScore(LEADERBOARD_NAME, score, extraData)
}