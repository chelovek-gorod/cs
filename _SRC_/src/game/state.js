import { Assets, roundPixelsBit } from "pixi.js"
import { EventHub, events } from "../app/events"
import { setLeaderboardScore, updateStoredData } from "../game/storage"
import { createEnum } from "../utils/functions"

export let isAdAvailable = true
export let isLeaderboardAvailable = false

// player and game data
export let gold = 0
export let round = 1
export let towerHP = 100
export let arrows = 10
export let arrowPower = 10
export let arrowShutTimeout = 360
export let arrowReloadTimeout = 1800
export let arrowSpeedRate = 0.02 // 0.03 - normal (1s to nearest side); 0.01 - slow(3s); 0.1 - fast(0.2s)
export let catapultsCount = 1
export let catapultPower = 36
export let catapultDamageRadius = 64
export let catapultShutTimeout = 3200
export let wizardsCount = 1
export let wizardPower = 18
export let wizardTargetsCount = 1
export let wizardShutTimeout = 1800

export function addGold(value) { gold += value }
export function addRound() { round++ }
export function addTowerHP() { towerHP += 10 }
export function addArrow() { arrows += 1 }
export function addArrowPower() { arrowPower += 1 }
export function addArrowShutTimeout() { arrowShutTimeout = Math.ceil(arrowShutTimeout * 0.9) }
export function addArrowReloadTimeout() { arrowReloadTimeout = Math.ceil(arrowReloadTimeout * 0.9) }
export function addArrowSpeedRate() { arrowSpeedRate = arrowSpeedRate * 1.1 }
export function addCatapult() { catapultsCount++ }
export function addCatapultPower() { catapultPower += Math.floor(catapultPower * 0.1) }
export function addCatapultDamageRadius() { catapultDamageRadius += 4 }
export function addCatapultShutTimeout() { catapultShutTimeout = Math.ceil(catapultShutTimeout * 0.85) }
export function addWizardsCount() { wizardsCount++ }
export function addWizardPower() { wizardPower += Math.floor(wizardPower * 0.1) }
export function addWizardTargetsCount() { wizardTargetsCount++ }
export function addWizardShutTimeout() { wizardShutTimeout = Math.ceil(wizardShutTimeout * 0.85) }

export function resetAllProgress() {
    gold = 0
    round = 1
    towerHP = 100
    arrows = 12
    arrowPower = 12
    arrowShutTimeout = 360
    arrowReloadTimeout = 1800
    arrowSpeedRate = 0.03
    catapultsCount = 0
    catapultPower = 24
    catapultDamageRadius = 64
    catapultShutTimeout = 600
    wizardsCount = 0
    wizardPower = 24
    wizardTargetsCount = 1
    wizardShutTimeout = 360
}


export function getStateData() {
    const gameState =  {
        gold, round, towerHP,
        arrows, arrowPower, arrowShutTimeout, arrowReloadTimeout, arrowSpeedRate,
        catapultsCount, catapultPower, catapultDamageRadius, catapultShutTimeout,
        wizardsCount, wizardPower, wizardTargetsCount, wizardShutTimeout
    }
    return gameState
}

export function setStoredState(savedState) {return
    if (!savedState) return

    if ('gold' in savedState) gold = savedState.gold
    if ('round' in savedState) round = savedState.round
    if ('towerHP' in savedState) towerHP = savedState.towerHP
    if ('arrows' in savedState) arrows = savedState.arrows
    if ('arrowPower' in savedState) arrowPower = savedState.arrowPower
    if ('arrowShutTimeout' in savedState) arrowShutTimeout = savedState.arrowShutTimeout
    if ('arrowReloadTimeout' in savedState) arrowReloadTimeout = savedState.arrowReloadTimeout
    if ('arrowSpeedRate' in savedState) arrowSpeedRate = savedState.arrowSpeedRate
    if ('catapultsCount' in savedState) catapultsCount = savedState.catapultsCount
    if ('catapultPower' in savedState) catapultPower = savedState.catapultPower
    if ('catapultDamageRadius' in savedState) catapultDamageRadius = savedState.catapultDamageRadius
    if ('catapultShutTimeout' in savedState) catapultShutTimeout = savedState.catapultShutTimeout
    if ('wizardsCount' in savedState) wizardsCount = savedState.wizardsCount
    if ('wizardPower' in savedState) wizardPower = savedState.wizardPower
    if ('wizardTargetsCount' in savedState) wizardTargetsCount = savedState.wizardTargetsCount
    if ('wizardShutTimeout' in savedState) wizardShutTimeout = savedState.wizardShutTimeout
}