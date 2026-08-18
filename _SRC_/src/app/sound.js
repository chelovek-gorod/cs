import { Howl, Howler } from 'howler';
import { updateStoredData } from '../game/storage'
import { EventHub, events } from './events'

// начальное состояние музыки и звуков
const state = {
    isSoundOn: true,
    soundVolume: 1.0,
    isMusicOn: true,
    musicVolume: 0.7,
    volumeStep: 0.1,
}

let isGamePaused = false
EventHub.on( events.gamePause, gamePause )
EventHub.on( events.gameResume, gameResume )
function gamePause() {
    isGamePaused = true
    Howler.stop()
}
function gameResume() {
    isGamePaused = false
    musicPlay()
}

export function setStoredSoundData( data ) {
    if ('isSoundOn' in data) state.isSoundOn = !!data.isSoundOn
    if ('soundVolume' in data) setVolume("sound", data.soundVolume, false)
    if ('isMusicOn' in data) state.isMusicOn = !!data.isMusicOn
    if ('musicVolume' in data) setVolume("music", data.musicVolume, false)
}
export function getSoundData() {
    return { ...state }
}

let musicHowl = null
let musicList = null
let musicIndex = 0
let musicToken = 0

export function musicGetState() {
    return state.isMusicOn
}
export function musicOn() {
    state.isMusicOn = true
    updateStoredData()
    musicPlay()
}
export function musicOff() {
    state.isMusicOn = false
    updateStoredData()
    musicStop()
}
export function musicGetVolume() { return state.musicVolume }
export function musicAddVolume() { return setVolume("music", state.musicVolume + state.volumeStep) }
export function musicSubVolume() { return setVolume("music", state.musicVolume - state.volumeStep) }
export function musicSetVolume(value) {return setVolume("music", value)}

function setVolume(type = "music", value, isNeedUpdateStorage = true) {
    if (typeof value === 'number') {
        const normalizedValue = Math.max(0, Math.min(1, value))
        const steps = Math.round(normalizedValue / state.volumeStep)
        const resultVolume = Math.max(0, Math.min(steps * state.volumeStep, 1))
        const fixedVolume = Math.round(resultVolume * 1e10) / 1e10
        if (type === "music") state.musicVolume = fixedVolume
        else state.soundVolume = fixedVolume

        if (isNeedUpdateStorage) updateStoredData()
    }

    if (type === "music") {
        if (musicHowl) musicHowl.volume(state.musicVolume)
        if (state.musicVolume === 0) musicStop()
        else musicPlay()
        return state.musicVolume
    }
    return state.soundVolume
}

let isSoundAvailable = false
export function getFirstUserAction() {
    isSoundAvailable = true
    setTimeout( () => musicPlay(), 500 )
}

EventHub.on( events.changeFocus, changeFocus )
function changeFocus( isOnFocus ) {
    isSoundAvailable = isOnFocus
    if (isOnFocus) {
        Howler.mute(false)
        musicPlay()
    } else {
        Howler.mute(true)
        musicStop()
    }
}

// sounds controller

const soundLoops = new Map()

export function soundLoopPlay(start_se, loop_se, end_se = null, id) {
    if (!state.isSoundOn || !isSoundAvailable) return
    if (!id) return
    if (soundLoops.has(id)) return

    const instruction = {
        start_se,
        loop_se,
        end_se,
        startId: null,
        loopId: null
    }

    soundLoops.set(id, instruction)

    const startLoop = () => {
        if (!soundLoops.has(id)) return

        loop_se.loop(true)
        loop_se.volume(state.soundVolume)

        instruction.loopId = loop_se.play()
    }

    if (start_se) {
        start_se.volume(state.soundVolume)

        const startId = start_se.play()
        instruction.startId = startId

        start_se.once('end', () => {
            startLoop()
        }, startId)

    } else {
        startLoop()
    }
}

export function soundLoopStop(id) {
    const instruction = soundLoops.get(id)
    if (!instruction) return

    const { start_se, loop_se, end_se, startId, loopId } = instruction

    if (start_se && startId !== null) {
        start_se.stop(startId)
    }

    if (loop_se && loopId !== null) {
        loop_se.stop(loopId)
    }

    soundLoops.delete(id)

    if (end_se) {
        soundPlay(end_se)
    }
}

const activeSingleSounds = new Set()
const singleSoundHandlers = new WeakMap() // Howl -> функция-обработчик 'end'

export function soundSinglePlay(se) {
    if (!state.isSoundOn || !isSoundAvailable) return
    if (activeSingleSounds.has(se)) return // уже играет – игнорируем

    // Удаляем старый обработчик, если был
    const oldHandler = singleSoundHandlers.get(se)
    if (oldHandler) {
        se.off('end', oldHandler)
        singleSoundHandlers.delete(se)
    }

    activeSingleSounds.add(se)

    se.volume(state.soundVolume)
    se.play()

    const onEnd = () => {
        activeSingleSounds.delete(se)
        se.off('end', onEnd)
        singleSoundHandlers.delete(se)
    }
    se.on('end', onEnd)
    singleSoundHandlers.set(se, onEnd)
}

export function soundOn() {
    state.isSoundOn = true
    updateStoredData()
}
export function soundOff() {
    state.isSoundOn = false
    updateStoredData()
}
export function soundGetState() {
    return state.isSoundOn
}

export function soundGetVolume() { return state.soundVolume }
export function soundAddVolume() { return setVolume("sound", state.soundVolume + state.volumeStep) }
export function soundSubVolume() { return setVolume("sound", state.soundVolume - state.volumeStep) }
export function soundSetVolume(value) {return setVolume("sound", value)}

export function soundPlay( se ) {
    if (!state.isSoundOn || !isSoundAvailable) return
    se.volume(state.soundVolume)
    se.play()
}
export function soundStop( se ) {
    if (activeSingleSounds.has(se)) {
        activeSingleSounds.delete(se)
        const handler = singleSoundHandlers.get(se)
        if (handler) {
            se.off('end', handler)
            singleSoundHandlers.delete(se)
        }
    }

    se.stop()
}

export function setMusicList(music, startIndex = null) {
    if (!music) return
  
    if ( Array.isArray(music) ) {
        musicList = music
    } else if (typeof music === 'object') {
        musicList = Object.values(music)
    } else if (typeof music === 'string') {
        musicList = [music]
    } else {
        musicList = []
        return console.warn('GET WRONG MUSIC LIST', music)
    }
    
    if (!musicList.length) return
  
    if (startIndex && startIndex < musicList.length) musicIndex = startIndex
    else musicIndex = Math.floor(Math.random() * musicList.length)

    musicToken++
    loadBgMusic()
}

export function musicStop() {
    if (!musicHowl) return
    
    musicHowl.pause()
}

export function musicPlay() {
    if (!state.isMusicOn || !isSoundAvailable || isGamePaused || !musicHowl) return
    if (musicHowl.playing()) return

    const soundId = musicHowl.play()
    musicHowl.volume(0, soundId)
    musicHowl.fade(0, state.musicVolume, 500, soundId)
    
    musicHowl.once('end', nextBgMusic)
}

function loadBgMusic() {
    const token = musicToken

    if (musicHowl) {
        musicHowl.off('load')
        musicHowl.off('loaderror')
        musicHowl.stop()
        musicHowl.unload()
        musicHowl = null
    }

    // СОЗДАЁМ новый трек
    const isSingleTrack = musicList.length === 1;
    musicHowl = new Howl({
        src: [musicList[musicIndex]],
        preload: true,
        loop: isSingleTrack,
        html5: false,
        volume: 0 // Начальный volume 0 для fade in
    })

    musicHowl.on('load', () => {
        if (token !== musicToken) {
            musicHowl.unload()
            musicHowl = null
            return
        }
        if (state.isMusicOn) musicPlay()
    })

    musicHowl.on('loaderror', () => {
        console.warn('Music load error')
        if (token === musicToken) {
            setTimeout(nextBgMusic, 1000)
        }
    })
}

function nextBgMusic() {
    if (!musicList || !musicList.length) return

    // Если трек всего один — просто перезапускаем
    if (musicList.length === 1 && musicHowl) {
        musicHowl.stop()
        musicPlay()
        return
    }
  
    musicIndex = (musicIndex + 1) % musicList.length
    musicToken++
    loadBgMusic()
}