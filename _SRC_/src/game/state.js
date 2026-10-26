import { Assets, roundPixelsBit } from "pixi.js"
import { EventHub, events } from "../app/events"
import { setLeaderboardScore, updateStoredData } from "../game/storage"
import { createEnum } from "../utils/functions"

export let isAdAvailable = true
export let isLeaderboardAvailable = false

export const ROUND_TYPE = createEnum(['EASY', 'NORM', 'HARD', 'BOSS'])
const START_REWARD = {
    [ROUND_TYPE.EASY]: 20,
    [ROUND_TYPE.NORM]: 30,
    [ROUND_TYPE.HARD]: 50,
    [ROUND_TYPE.BOSS]: 100,
}
export let levelReward = START_REWARD.EASY
export let levelType = ROUND_TYPE.EASY
export function setLevelType(type) {
    levelType = type
    switch (type) {
        case ROUND_TYPE.BOSS:
            gameState.levelRewardEasy = START_REWARD.EASY
            gameState.levelRewardNorm = START_REWARD.NORM
            gameState.levelRewardHard = START_REWARD.HARD
            
            levelReward = gameState.levelRewardBoss

            gameState.levelRewardBoss = Math.max(10, gameState.levelRewardBoss - 10)
        break

        case ROUND_TYPE.EASY:
            gameState.levelRewardNorm = START_REWARD.NORM
            gameState.levelRewardHard = START_REWARD.HARD
            gameState.levelRewardBoss = START_REWARD.BOSS

            levelReward = gameState.levelRewardEasy

            gameState.levelRewardEasy = Math.max(10, gameState.levelRewardEasy - 10)
        break

        case ROUND_TYPE.NORM:
            gameState.levelRewardEasy = START_REWARD.EASY
            gameState.levelRewardHard = START_REWARD.HARD
            gameState.levelRewardBoss = START_REWARD.BOSS

            levelReward = gameState.levelRewardNorm

            gameState.levelRewardNorm = Math.max(10, gameState.levelRewardNorm - 10)
        break

        case ROUND_TYPE.HARD:
            gameState.levelRewardEasy = START_REWARD.EASY
            gameState.levelRewardNorm = START_REWARD.NORM
            gameState.levelRewardBoss = START_REWARD.BOSS

            levelReward = gameState.levelRewardHard

            gameState.levelRewardHard = Math.max(10, gameState.levelRewardHard - 10)
        break
    }
}

function initState() {
    return {
        gold: 0,
        round: 1,
        levelRewardEasy: START_REWARD.EASY,
        levelRewardNorm: START_REWARD.NORM,
        levelRewardHard: START_REWARD.HARD,
        levelRewardBoss: START_REWARD.BOSS,
        
        towerHp: 100,
        towerHpPrice: 25,
        towerRepairsCount: 0,
        towerRepairHp: 25,
        towerRepairUpgradePrice: 15,

        fogCount: 0,
        fogPower: 5,
        fogPowerPrice: 30,

        arrowsCount: 10,
        arrowPower: 10,
        arrowFlyRate: 0.02,
        arrowShootTimeout: 1000,
        arrowReloadTimeout: 3000,
        berserkPowerRate: 1.2,
        berserkStartRage: 0,

        mineTimeout: 2.25 * 60 * 1000, // 2 minutes 15 seconds
        mineTimeoutPrice: 25,
        mineMaxGold: 100,
        mineMaxGoldPrice: 50,

        iceCount: 0,
        iceDuration: 4000,
        iceDurationPrice: 35,
        iceFreezeDepth: 1.0,
        iceFreezeDepthPrice: 25,

        trapsCount: 0,
        trapPower: 75, // 100, 125, 150, 175, 200
        trapPowerPrice: 25,
        trapRadius: 60, // activateRadius = trapRadius * 0.5
        trapRadiusPrice: 35,

        dragonsCount: 0,
        dragonPrice: 50,
        dragonFuel: 60,
        dragonFuelPrice: 20,
        dragonPower: 5,
        dragonPowerPrice: 25,

        wizardsCount: 0,
        wizardPrice: 50,
        wizardPower: 20,
        wizardPowerPrice: 10,
        wizardTimeout: 4000,
        wizardTimeoutPrice: 15,
        wizardDistance: 240,
        wizardDistancePrice: 20,
        wizardTargets: 1,
        wizardTargetPrice: 25,

        catapultsCount: 0,
        catapultPrice: 80,
        catapultPower: 30,
        catapultPowerPrice: 30,
        catapultTimeout: 6000,
        catapultTimeoutPrice: 20,
        catapultDistance: 300,
        catapultDistancePrice: 10,
        catapultRadius: 60,
        catapultRadiusPrice: 40,
    }
}

let mineLastCollectedAt = Date.now()

export let gameState = initState()

export const adGoldBonus = 12

export const towerHPStep = 20
export const towerHPMax = 200
export const towerRepairStep = 5
export const towerRepairMax = 50
export const towerRepairPrice = 75

export const mineTimeoutStep = 15 * 1000 // 15 seconds
export const mineTimeoutMax = 1 * 60 * 1000 // 1 minutes
export const mineMaxGoldStep = 50
export const mineMaxGoldMax = 300

export const fogPowerStep = 1
export const fogPowerMax = 10
export const fogReloadStep = 0.06
export const fogReloadDone = 100
export const fogPrice = 40

export const icePrice = 40
export const iceAdd = 12
export const iceDurationStep = 500
export const iceFreezeDepthStep = 0.2
export const iceFreezeDepthMax = 2.0

export const trapPrice = 30
export const trapsAdd = 6
export const trapPowerStep = 25
export const trapPowerMax = 200
export const trapRadiusStep = 12
export const trapRadiusMax = 120

export const dragonPrice = 100
export const dragonFuelStep = 12
export const dragonFuelMax = 120
export const dragonPowerStep = 3
export const dragonPowerMax = 20

export const arrowsStep = 2
export const arrowsMax = 20
export const arrowPowerStep = 1
export const arrowShootTimeoutStep = 120
export const arrowShootTimeoutMax = 400
export const arrowReloadTimeoutStep = 360
export const arrowReloadTimeoutMax = 1200
export const arrowFlyRateStep = 0.016
export const arrowFlyRateMax = 0.10

export const berserkPowerRateStep = 0.1
export const berserkStartRageStep = 12
export const berserkReadyRage = 144

export const catapultsCountMax = 3
export const catapultBasePrice = 75
export const catapultPowerStep = 2
export const catapultDamageRadiusStep = 14
export const catapultDamageRadiusMax = 120
export const catapultShootTimeoutStep = 600
export const catapultShootTimeoutMax = 3000
export const catapultShootDistanceStep = 12
export const catapultShootDistanceMax = 360

export const wizardsCountMax = 3
export const wizardBasePrice = 50
export const wizardPowerStep = 1
export const wizardTargetsCountMax = 6 // main + 5 additional targets
export const wizardTargetRadiusRate = 0.25 // цепь бьет не больше чем на 25% расстояния от wizardShootDistance
export const wizardShootTimeoutStep = 400
export const wizardShootTimeoutMax = 2000
export const wizardShootDistanceStep = 16
export const wizardShootDistanceMax = 320

export function getHelperPrice(currentPrice) {
    return currentPrice * 2 ** (wizardsCount + catapultsCount)
}
export function getWizardTargetMaxDistance() {
    return Math.ceil(wizardShootDistance * wizardTargetRadiusRate)
}

export function getMineAccumulated() {
    const elapsed = Date.now() - mineLastCollectedAt
    const value = Math.floor(elapsed / gameState.mineTimeout)
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