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
    'updateTowerHp',
    'updateArrows',
    'setShootPoint',
    'arrowOnTarget',
    'updateRage',
    'rageClick',
    'repairTower',
    'iceClick',
    'reloadClick',

    'setTrapsOnMap',
    'updateTrapsAvailable',
    'trapExploded',

    'fogStart',
    'updateFogAvailable',

    'addDragon',
    'updateDragonFuel',
    'dragonIsEmpty',

    'addExplosion',
    'addEnemySmoke',

    'goldChanged',

    'enemyHit',
    'addRage',

    'trailEmit',
    'addVoodooFX',
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

export function setDamage( data ) {
    EventHub.emit( events.setDamage, data )
}
export function updateTowerHp( value ) {
    EventHub.emit( events.updateTowerHp, value )
}
export function repairTower() {
    EventHub.emit( events.repairTower )
}

export function updateArrows( value ) {
    EventHub.emit( events.updateArrows, value )
}
export function updateArrowsReload( value ) {
    EventHub.emit( events.updateArrowsReload, value )
}
export function updateRage( value ) {
    EventHub.emit( events.updateRage, value )
}
export function rageClick() {
    EventHub.emit( events.rageClick )
}

export function iceClick() {
    EventHub.emit( events.iceClick )
}

export function reloadClick() {
    EventHub.emit( events.reloadClick )
}

export function setShootPoint( data ) {
    EventHub.emit( events.setShootPoint, data )
}

export function arrowOnTarget( data ) {
    EventHub.emit( events.arrowOnTarget, data )
}

export function setTrapsOnMap() {
    EventHub.emit( events.setTrapsOnMap )
}
export function updateTrapsAvailable( value ) {
    EventHub.emit( events.updateTrapsAvailable, value )
}
export function trapExploded( slotIndex ) {
    EventHub.emit( events.trapExploded, slotIndex )
}

export function fogStart() {
    EventHub.emit( events.fogStart )
}
export function updateFogAvailable( value ) {
    EventHub.emit( events.updateFogAvailable, value )
}

export function addDragon() {
    EventHub.emit( events.addDragon )
}
export function updateDragonFuel( progress ) {
    EventHub.emit( events.updateDragonFuel, progress )
}
export function dragonIsEmpty() {
    EventHub.emit( events.dragonIsEmpty )
}

export function addExplosion(data) {
    EventHub.emit( events.addExplosion, data )
}
export function addEnemySmoke( data ) {
    EventHub.emit( events.addEnemySmoke, data )
}

export function goldChanged() {
    EventHub.emit( events.goldChanged )
}

export function enemyHit( data ) {
    EventHub.emit( events.enemyHit, data )
}

export function addRage( value ) {
    EventHub.emit( events.addRage, value )
}

export function trailEmit( data ) {
    EventHub.emit( events.trailEmit, data )
}

export function addVoodooFX( data ) {
    EventHub.emit( events.addVoodooFX, data )
}