import { Assets, roundPixelsBit } from "pixi.js"
import { EventHub, events } from "../app/events"
import { setLeaderboardScore, updateStoredData } from "../game/storage"
import { createEnum } from "../utils/functions"

export let isAdAvailable = true
export let isLeaderboardAvailable = false

// !!! ПРИ ПРАВКАХ СТАРТОВЫХ СТАТ - ОБНОВИТЬ ЗНАЧЕНИЯ в resetAllProgress()

// player and game data
export let gold = 0
export let round = 1
export let level = 0
export const levelStartPrice = 10
export const adGoldBonus = 25

export let towerHP = 100
export const towerHPStep = 20
export const towerHPMax = 200

export let arrows = 10
export const arrowsStep = 2
export const arrowsMax = 20
export let arrowPower = 10
export const arrowPowerStep = 1
export let arrowShutTimeout = 600
export const arrowShutTimeoutStep = 96
export const arrowShutTimeoutMax = 120
export let arrowReloadTimeout = 1800
export const arrowReloadTimeoutStep = 240
export const arrowReloadTimeoutMax = 600
export let arrowSpeedRate = 0.02 // 0.03 - normal (1s to nearest side); 0.01 - slow(3s); 0.1 - fast(0.2s)
export const arrowSpeedRateStep = 0.016
export const arrowSpeedRateMax = 0.10

export let catapultsCount = 0
export const catapultsCountMax = 4
export const catapultBasePrice = 50
export let catapultPower = 30
export const catapultPowerStep = 2
export let catapultDamageRadius = 50 // 50
export const catapultDamageRadiusStep = 14
export const catapultDamageRadiusMax = 120
export let catapultShutTimeout = 3200
export const catapultShutTimeoutStep = 400
export const catapultShutTimeoutMax = 1200
export let catapultShutDistance = 300
export const catapultShutDistanceStep = 60
export const catapultShutDistanceMax = 600

export let wizardsCount = 0
export const wizardsCountMax = 4
export const wizardBasePrice = 35
export let wizardPower = 20 // 20
export const wizardPowerStep = 1
export let wizardTargetsCount = 1 // 1
export const wizardTargetsCountMax = 6 // main + 10 additional targets
export const wizardTargetRadiusRate = 0.35 // цепь бьет не больше чем на 25% расстояния от wizardShutDistance
export let wizardShutTimeout = 1800
export const wizardShutTimeoutStep = 180
export const wizardShutTimeoutMax = 900
export let wizardShutDistance = 240 // 240
export const wizardShutDistanceStep = 48
export const wizardShutDistanceMax = 480

export function addGold(value) { gold += value }
export function addRound() { round++ }
export function addLevel() { level++ }

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
    level = 0

    towerHP = 100

    arrows = 10
    arrowPower = 10
    arrowShutTimeout = 480
    arrowReloadTimeout = 1800
    arrowSpeedRate = 0.02 // 0.03 - normal (1s to nearest side); 0.01 - slow(3s); 0.1 - fast(0.2s)

    catapultsCount = 0
    catapultPower = 30
    catapultDamageRadius = 50
    catapultShutTimeout = 3200
    catapultShutDistance = 300

    wizardsCount = 0
    wizardPower = 20
    wizardTargetsCount = 1
    wizardShutTimeout = 1800
    wizardShutDistance = 240
}


export function getStateData() {
    const gameState =  {
        gold, round, level, towerHP,
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
    if ('level' in savedState) level = savedState.level
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