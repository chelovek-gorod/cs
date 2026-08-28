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
export const towerHPStep = 10
export const towerHPMax = 250

export let arrows = 10
export const arrowsStep = 1
export const arrowsMax = 25
export let arrowPower = 10
export const arrowPowerStep = 1
export let arrowShutTimeout = 480
export const arrowShutTimeoutStep = 30
export const arrowShutTimeoutMax = 120
export let arrowReloadTimeout = 1800
export const arrowReloadTimeoutStep = 30
export const arrowReloadTimeoutMax = 900
export let arrowSpeedRate = 0.02 // 0.03 - normal (1s to nearest side); 0.01 - slow(3s); 0.1 - fast(0.2s)
export const arrowSpeedRateStep = 0.005
export const arrowSpeedRateMax = 0.1

export let catapultsCount = 0
export const catapultsCountMax = 4
export const catapultBasePrice = 40
export let catapultPower = 36
export const catapultPowerStep = 3
export let catapultDamageRadius = 48 // 48
export const catapultDamageRadiusStep = 16
export const catapultDamageRadiusMax = 128
export let catapultShutTimeout = 3200
export const catapultShutTimeoutStep = 100
export const catapultShutTimeoutMax = 1200
export let catapultShutDistance = 360
export const catapultShutDistanceStep = 60
export const catapultShutDistanceMax = 720

export let wizardsCount = 0
export const wizardsCountMax = 4
export const wizardBasePrice = 25
export let wizardPower = 18 // 18
export const wizardPowerStep = 1
export let wizardTargetsCount = 1 // 1
export const wizardTargetsCountMax = 9
export const wizardTargetRadiusRate = 0.5 // цепь бьет не больше чем на 50% расстояния от wizardShutDistance
export let wizardShutTimeout = 1800
export const wizardShutTimeoutStep = 30
export const wizardShutTimeoutMax = 900
export let wizardShutDistance = 240 // 240
export const wizardShutDistanceStep = 30
export const wizardShutDistanceMax = 600

export function addGold(value) { gold += value }
export function addRound() { round++ }
export function addTowerHP() { towerHP = Math.min(towerHPMax, towerHP + towerHPStep) }

export function addArrow() { arrows = Math.min(arrowsMax, arrows + arrowsStep) }
export function addArrowPower() { arrowPower += arrowPowerStep }
export function addArrowShutTimeout() {
    arrowShutTimeout = Math.max(arrowShutTimeoutMax, arrowShutTimeout - arrowShutTimeoutStep)
}
export function addArrowReloadTimeout() {
    arrowReloadTimeout = Math.max(arrowReloadTimeoutMax, arrowReloadTimeout - arrowReloadTimeoutStep)
}
export function addArrowSpeedRate() {
    arrowSpeedRate = Math.min(arrowSpeedRateMax, arrowSpeedRate + arrowSpeedRateStep)
}

export function getCatapultPrice() { return catapultBasePrice * 2 ** catapultsCount }
export function addCatapultCount() { catapultsCount = Math.min(catapultsCountMax, catapultsCount + 1) }
export function addCatapultPower() { catapultPower += catapultPowerStep }
export function addCatapultDamageRadius() {
    catapultDamageRadius = Math.min(catapultDamageRadiusMax, catapultDamageRadius + catapultDamageRadiusStep)
}
export function addCatapultShutTimeout() {
    catapultShutTimeout = Math.max(catapultShutTimeoutMax, catapultShutTimeout - catapultShutTimeoutStep)
}
export function addCatapultShutDistance() {
    catapultShutDistance = Math.min(catapultShutDistanceMax, catapultShutDistance + catapultShutDistanceStep)
}

export function getWizardPrice() { return wizardBasePrice * 2 ** wizardsCount }
export function addWizardsCount() { wizardsCount = Math.min(wizardsCountMax, wizardsCount + 1) }
export function addWizardPower() { wizardPower += wizardPowerStep }
export function addWizardTargetsCount() {
    wizardTargetsCount = Math.min(wizardTargetsCountMax, wizardTargetsCount + 1)
}
export function addWizardShutTimeout() {
    wizardShutTimeout = Math.max(wizardShutTimeoutMax, wizardShutTimeout - wizardShutTimeoutStep)
}
export function addWizardShutDistance() {
    wizardShutDistance = Math.min(wizardShutDistanceMax, wizardShutDistance + wizardShutDistanceStep)
}
export function getWizardPowerStep() { return Math.max(1, Math.ceil(wizardPower / wizardTargetsCount)) }
export function getWizardMaxDistance() { return Math.ceil(wizardShutDistance * wizardTargetRadiusRate) }

export function resetAllProgress() {
    gold = 0
    round = 1
    towerHP = 100

    arrows = 10
    arrowPower = 10
    arrowShutTimeout = 480
    arrowReloadTimeout = 1800
    arrowSpeedRate = 0.02 // 0.03 - normal (1s to nearest side); 0.01 - slow(3s); 0.1 - fast(0.2s)

    catapultsCount = 0
    catapultPower = 36
    catapultDamageRadius = 64
    catapultShutTimeout = 3200
    catapultShutDistance = 360

    wizardsCount = 0
    wizardPower = 18
    wizardTargetsCount = 1
    wizardShutTimeout = 1800
    wizardShutDistance = 240
}


export function getStateData() {
    const gameState =  {
        gold, round, towerHP,
        arrows, arrowPower, arrowShutTimeout, arrowReloadTimeout, arrowSpeedRate,
        catapultsCount, catapultPower, catapultDamageRadius, catapultShutTimeout, catapultShutDistance,
        wizardsCount, wizardPower, wizardTargetsCount, wizardShutTimeout, wizardShutDistance
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
    if ('catapultShutDistance' in savedState) catapultShutDistance = savedState.catapultShutDistance
    if ('wizardsCount' in savedState) wizardsCount = savedState.wizardsCount
    if ('wizardPower' in savedState) wizardPower = savedState.wizardPower
    if ('wizardTargetsCount' in savedState) wizardTargetsCount = savedState.wizardTargetsCount
    if ('wizardShutTimeout' in savedState) wizardShutTimeout = savedState.wizardShutTimeout
    if ('wizardShutDistance' in savedState) wizardShutDistance = savedState.wizardShutDistance
}