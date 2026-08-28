import { EventEmitter } from "pixi.js"
import { createEnum } from "../utils/functions"

export const EventHub = new EventEmitter()

export const events = createEnum([
    'screenResize',
    'changeFocus',

    'gamePause',
    'gameResume',

    'startScene',

    'updateLanguage',

    'showPopup',
    'closePopup',

    'getTopResults',

    'addGoldForKill',
    'setDamage',
    'setShutPoint',
    'arrowOnTarget',
])

export function screenResize( data ) {
    EventHub.emit( events.screenResize, data )
}
export function changeFocus( isOnFocus ) {
    EventHub.emit( events.changeFocus, isOnFocus )
}
export function gamePause() {
    EventHub.emit( events.gamePause )
}
export function gameResume() {
    EventHub.emit( events.gameResume )
}

export function startScene( sceneName ) {
    EventHub.emit( events.startScene, sceneName )
}

export function updateLanguage( currentLanguageCode ) {
    EventHub.emit( events.updateLanguage, currentLanguageCode )
}

export function showPopup( type ) {
    EventHub.emit( events.showPopup, type )
}
export function closePopup( ) {
    EventHub.emit( events.closePopup )
}

export function getTopResults( ) {
    EventHub.emit( events.getTopResults )
}


export function addGoldForKill( value ) {
    EventHub.emit( events.addGoldForKill, value )
}

export function setDamage( value ) {
    EventHub.emit( events.setDamage, value )
}

export function setShutPoint( data ) {
    EventHub.emit( events.setShutPoint, data )
}

export function arrowOnTarget( data ) {
    EventHub.emit( events.arrowOnTarget, data )
}