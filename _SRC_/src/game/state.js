import { Assets, roundPixelsBit } from "pixi.js"
import { EventHub, events } from "../app/events"
import { setLeaderboardScore, updateStoredData } from "../game/storage"
import { createEnum } from "../utils/functions"

export let isAdAvailable = true
export let isLeaderboardAvailable = false

function initState() {
    return {
        gold: 0,
        round: 1,
        
        towerHp: 100,
        towerHpPrice: 5,
        towerFogCount: 0,
        towerFogPower: 25,
        towerFogUpgradePrice: 10,
        towerRepairsCount: 0,
        towerRepairHp: 25,
        towerRepairUpgradePrice: 5,

        arrowsCount: 10,
        arrowPower: 10,
        arrowFlyRate: 0.02,
        arrowShootTimeout: 1000,
        arrowReloadTimeout: 3000,
        berserkPowerRate: 1.2,
        berserkShoots: 12,

        mineTimeout: 5 * 60 * 1000, // 5 minutes
        mineTimeoutPrice: 100,
        mineMaxGold: 100,
        mineMaxGoldPrice: 80,

        iceCount: 0,
        iceDuration: 5000,
        iceDurationPrice: 25,
        icePowerRate: 0.5, // 0.75, 1, 1.25, 1.5, 1.75, 2
        icePowerRatePrice: 40,

        trapsCount: 0,
        trapPower: 75, // 100, 125, 150, 175, 200
        trapPowerPrice: 10,
        trapRadius: 100, // activateRadius = trapRadius * 0.5
        trapRadiusPrice: 20,

        dragonsCount: 0,
        dragonPrice: 50,
        dragonFuel: 120,
        dragonPower: 5,
        dragonPowerPrice: 20,

        wizardsCount: 0,
        wizardPrice: 50,
        wizardPower: 20,
        wizardPowerPrice: 10,
        wizardTimeout: 4000,
        wizardTimeoutPrice: 10,
        wizardDistance: 240,
        wizardDistancePrice: 15,
        wizardTargets: 1,
        wizardTargetPrice: 15,

        catapultsCount: 0,
        catapultPrice: 80,
        catapultPower: 30,
        catapultPowerPrice: 20,
        catapultTimeout: 6000,
        catapultTimeoutPrice: 25,
        catapultDistance: 300,
        catapultDistancePrice: 30,
        catapultRadius: 60,
        catapultRadiusPrice: 40,
    }
}

let mineLastCollectedAt = Date.now()

export let gameState = initState()

export const goldForSavingHp = 0.2
export const adGoldBonus = 25

export const towerHPStep = 20
export const towerHPMax = 200
export const towerFogPowerStep = 5
export const towerFogPowerMax = 50
export const towerFogPrice = 120
export const towerRepairStep = 5
export const towerRepairMax = 50
export const towerRepairPrice = 75

export const mineTimeoutStep = 30 * 1000 // 30 seconds
export const mineTimeoutMax = 2.5 * 60 * 1000 // 2.5 minutes
export const mineMaxGoldStep = 50
export const mineMaxGoldMax = 300

export const icePrice = 50
export const iceAdd = 12
export const iceDurationStep = 1000
export const iceDurationMax = 10000
export const icePowerRateStep = 0.25
export const icePowerRateMax = 2

export const trapPrice = 25
export const trapsAdd = 6
export const trapPowerStep = 25
export const trapPowerMax = 200
export const trapRadiusTrigger = gameState.trapRadius * 0.5

export const dragonPrice = 50
export const dragonFuelMax = 120
export const dragonPowerStep = 3
export const dragonPowerMax = 20

export const arrowsStep = 2
export const arrowsMax = 20
export const arrowPowerStep = 1
export const arrowShootTimeoutStep = 150
export const arrowShootTimeoutMax = 250
export const arrowReloadTimeoutStep = 300
export const arrowReloadTimeoutMax = 1500
export const arrowFlyRateStep = 0.016
export const arrowFlyRateMax = 0.10

export const berserkShootStep = 1
export const berserkPowerRateStep = 0.1

export const catapultsCountMax = 4
export const catapultBasePrice = 75
export const catapultPowerStep = 2
export const catapultDamageRadiusStep = 14
export const catapultDamageRadiusMax = 120
export const catapultShootTimeoutStep = 600
export const catapultShootTimeoutMax = 3000
export const catapultShootDistanceStep = 60
export const catapultShootDistanceMax = 600

export const wizardsCountMax = 4
export const wizardBasePrice = 50
export const wizardPowerStep = 1
export const wizardTargetsCountMax = 6 // main + 5 additional targets
export const wizardTargetRadiusRate = 0.25 // цепь бьет не больше чем на 25% расстояния от wizardShootDistance
export const wizardShootTimeoutStep = 400
export const wizardShootTimeoutMax = 2000
export const wizardShootDistanceStep = 48
export const wizardShootDistanceMax = 480

export function getHelperPrice(currentPrice) {
    return currentPrice * 2 ** (wizardsCount + catapultsCount)
}
export function getWizardTargetMaxDistance() {
    return Math.ceil(wizardShootDistance * wizardTargetRadiusRate)
}

export function getMineAccumulated() {
    const elapsed = Date.now() - mineLastCollectedAt
    const value = Math.floor(elapsed / gameState.mineTimeout * gameState.mineMaxGold)
    return Math.min(value, gameState.mineMaxGold)
}

export function collectMineGold() {
    const value = getMineAccumulated()
    mineLastCollectedAt = Date.now()
    return value
}

//

export function resetAllProgress() {
    gameState = initState()
}

export function getStateData() {
    return gameState
}

export function setStoredState(savedState) {return
    if (!savedState) return

    for (let key in savedState) {
        if (key in gameState) gameState[key] = savedState[key]
    }
}