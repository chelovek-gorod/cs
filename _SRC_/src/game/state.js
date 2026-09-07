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
export const goldForSavingHp = 0.2
export const adGoldBonus = 25

export let towerHP = 100
export const towerHPStep = 10
export const towerHPMax = 200

export let arrows = 10
export const arrowsStep = 1
export const arrowsMax = 20
export let arrowPower = 10
export const arrowPowerStep = 1
export let arrowShootTimeout = 900
export const arrowShootTimeoutStep = 70
export const arrowShootTimeoutMax = 200
export let arrowReloadTimeout = 1800
export const arrowReloadTimeoutStep = 90
export const arrowReloadTimeoutMax = 900
export let arrowSpeedRate = 0.02 // 0.03 - normal (1s to nearest side); 0.01 - slow(3s); 0.1 - fast(0.2s)
export const arrowSpeedRateStep = 0.008
export const arrowSpeedRateMax = 0.10

export let catapultsCount = 0
export const catapultsCountMax = 4
export const catapultBasePrice = 75
export let catapultPower = 30
export const catapultPowerStep = 2
export let catapultDamageRadius = 50 // 50
export const catapultDamageRadiusStep = 14
export const catapultDamageRadiusMax = 120
export let catapultShootTimeout = 6000
export const catapultShootTimeoutStep = 300
export const catapultShootTimeoutMax = 3000
export let catapultShootDistance = 300
export const catapultShootDistanceStep = 30
export const catapultShootDistanceMax = 600

export let wizardsCount = 0
export const wizardsCountMax = 4
export const wizardBasePrice = 50
export let wizardPower = 20 // 20
export const wizardPowerStep = 1
export let wizardTargetsCount = 1 // 1
export const wizardTargetsCountMax = 11 // main + 10 additional targets
export const wizardTargetRadiusRate = 0.25 // цепь бьет не больше чем на 25% расстояния от wizardShootDistance
export let wizardShootTimeout = 4000
export const wizardShootTimeoutStep = 200
export const wizardShootTimeoutMax = 2000
export let wizardShootDistance = 240 // 240
export const wizardShootDistanceStep = 24
export const wizardShootDistanceMax = 480

export let traps = 0
export const trapPrice = 6
export const trapPower = 75
export const trapDamageRadius = 150
export const trapActivationDistance = 75

export let isDragon = false
export const dragonPrice = 50

export function addGold(value) { gold += value }
export function addRound() { round++ }
export function addLevel() { level++ }

export function addTowerHP() { towerHP = Math.min(towerHPMax, towerHP + towerHPStep) }

export function addArrow() { arrows = Math.min(arrowsMax, arrows + arrowsStep) }
export function addArrowPower() { arrowPower += arrowPowerStep }
export function addArrowShootTimeout() {
    arrowShootTimeout = Math.max(arrowShootTimeoutMax, arrowShootTimeout - arrowShootTimeoutStep)
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
export function addCatapultShootTimeout() {
    catapultShootTimeout = Math.max(catapultShootTimeoutMax, catapultShootTimeout - catapultShootTimeoutStep)
}
export function addCatapultShootDistance() {
    catapultShootDistance = Math.min(catapultShootDistanceMax, catapultShootDistance + catapultShootDistanceStep)
}

export function getWizardPrice() { return wizardBasePrice * 2 ** wizardsCount }
export function addWizardsCount() { wizardsCount = Math.min(wizardsCountMax, wizardsCount + 1) }
export function addWizardPower() { wizardPower += wizardPowerStep }
export function addWizardTargetsCount() {
    wizardTargetsCount = Math.min(wizardTargetsCountMax, wizardTargetsCount + 1)
}
export function addWizardShootTimeout() {
    wizardShootTimeout = Math.max(wizardShootTimeoutMax, wizardShootTimeout - wizardShootTimeoutStep)
}
export function addWizardShootDistance() {
    wizardShootDistance = Math.min(wizardShootDistanceMax, wizardShootDistance + wizardShootDistanceStep)
}
export function getWizardPowerStep() { return Math.max(1, Math.ceil(wizardPower / wizardTargetsCount)) }
export function getWizardMaxDistance() { return Math.ceil(wizardShootDistance * wizardTargetRadiusRate) }

export function addTraps(value) { traps += value }
export function setDragon(isAAvailable = false) { isDragon = isAAvailable }

export function resetAllProgress() {
    gold = 0
    round = 1
    level = 0

    towerHP = 100

    arrows = 10
    arrowPower = 10
    arrowShootTimeout = 480
    arrowReloadTimeout = 1800
    arrowSpeedRate = 0.02 // 0.03 - normal (1s to nearest side); 0.01 - slow(3s); 0.1 - fast(0.2s)

    catapultsCount = 0
    catapultPower = 30
    catapultDamageRadius = 50
    catapultShootTimeout = 3200
    catapultShootDistance = 300

    wizardsCount = 0
    wizardPower = 20
    wizardTargetsCount = 1
    wizardShootTimeout = 1800
    wizardShootDistance = 240
}


export function getStateData() {
    const gameState =  {
        gold, round, level, towerHP,
        arrows, arrowPower, arrowShootTimeout, arrowReloadTimeout, arrowSpeedRate,
        catapultsCount, catapultPower, catapultDamageRadius, catapultShootTimeout, catapultShootDistance,
        wizardsCount, wizardPower, wizardTargetsCount, wizardShootTimeout, wizardShootDistance
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
    if ('arrowShootTimeout' in savedState) arrowShootTimeout = savedState.arrowShootTimeout
    if ('arrowReloadTimeout' in savedState) arrowReloadTimeout = savedState.arrowReloadTimeout
    if ('arrowSpeedRate' in savedState) arrowSpeedRate = savedState.arrowSpeedRate
    if ('catapultsCount' in savedState) catapultsCount = savedState.catapultsCount
    if ('catapultPower' in savedState) catapultPower = savedState.catapultPower
    if ('catapultDamageRadius' in savedState) catapultDamageRadius = savedState.catapultDamageRadius
    if ('catapultShootTimeout' in savedState) catapultShootTimeout = savedState.catapultShootTimeout
    if ('catapultShootDistance' in savedState) catapultShootDistance = savedState.catapultShootDistance
    if ('wizardsCount' in savedState) wizardsCount = savedState.wizardsCount
    if ('wizardPower' in savedState) wizardPower = savedState.wizardPower
    if ('wizardTargetsCount' in savedState) wizardTargetsCount = savedState.wizardTargetsCount
    if ('wizardShootTimeout' in savedState) wizardShootTimeout = savedState.wizardShootTimeout
    if ('wizardShootDistance' in savedState) wizardShootDistance = savedState.wizardShootDistance
}