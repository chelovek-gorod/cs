import { TYPES } from "./Enemy"

// ============================================================
//  КОНФИГ ГЕНЕРАТОРА ВОЛН (ПРОСТАЯ ВЕРСИЯ)
// ============================================================

// --- ОБЩЕЕ ЧИСЛО NORMAL В РАУНДЕ ---
const MIN_ENEMIES_PER_ROUND = 5
const ENEMIES_PER_ROUND_FORMULA_BASE = 4 // раунд 7 -> total = 4 + 7
const DIFFICULTY_MULTIPLIER = 1.2 // усложнение от роста раунда -> раунд 7 -> total = (4 + 7) * 1.2
const EASY_ROUND_MODULO = 3 // раунды кратные 3 -> легче
const EASY_NORMAL_MULTIPLIER = 0.7 // в них 70% врагов

// --- РАЗМЕР ВОЛНЫ ---
const MIN_ENEMIES_PER_WAVE = 7 // базовый минимум врагов в одной волне
// То есть на 1‑м раунде минимум 7 врагов в волне.
const ADDITIONAL_ENEMIES_IN_WAVES_DIVIDER = 3 // делитель номера раунда
// Если раунд 10, то 7 + floor(10/3) = 7+3 = 10 минимум.

// --- ТАЙМИНГИ (экспортируем для GameContainer) ---
export const FIRST_WAVE_TIMEOUT = 1800
export const WAVE_TIMEOUT = 1200
export const WAVE_NEXT_ENEMY_TIMEOUT_MAX = 900 
export const WAVE_NEXT_ENEMY_TIMEOUT_MIN = 120 
// this.enemySpawnInterval = Math.max(WAVE_NEXT_ENEMY_TIMEOUT_MIN, WAVE_NEXT_ENEMY_TIMEOUT_MAX - round)
// Получается, чем выше раунд, тем быстрее спавнятся враги, но не быстрее 120 мс.

// --- ПАКЕТНЫЙ СПАВН (экспортируем) ---
export const MAX_WAVE_SPAWN_TIME = 12000 // мс
// Если в текущей волне спавн дольше 12 секунд, то начинается пакетный спавн.

// --- СТРОКА ЧЕТВЕРТЕЙ (для долей заполнения и перемешивания) ---
const QUARTER_STRING = '123231132'

// --- ПРИОРИТЕТ ЗАМЕЩЕНИЯ ---
const PRIORITY_ORDER = [TYPES.BOSS, TYPES.TANK, TYPES.BOMB, TYPES.FAST]

// --- ДАННЫЕ СПЕЦ ЮНИТОВ (упрощённые) ---
// unlockRound - с какого раунда появляются
// replacementLimit - сколько % от NORMAL заменят
// countDivisor - бля босса - вывод каждый раунд кратный 10
// bossLineRatio: 0.75 - бля босса, всегда заменяет до 75%
const UNIT_DATA = {
    [TYPES.FAST]: {
        unlockRound: 3,
        replacementLimit: 0.3
    },
    [TYPES.BOMB]: {
        unlockRound: 5,
        replacementLimit: 0.1
    },
    [TYPES.TANK]: {
        unlockRound: 8,
        replacementLimit: 0.5 
    },
    [TYPES.BOSS]: {
        unlockRound: 10,
        countDivisor: 10,
        bossLineRatio: 0.75
    }
}

// ============================================================
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

// Общее число NORMAL в раунде с учётом лёгких раундов
function getTotalNormal(round) {
    let total = Math.round((ENEMIES_PER_ROUND_FORMULA_BASE + round) * DIFFICULTY_MULTIPLIER)

    if (round % EASY_ROUND_MODULO === 0 && round % 10 !== 0) {
        total = Math.ceil(total * EASY_NORMAL_MULTIPLIER)
    }

    return Math.max(MIN_ENEMIES_PER_ROUND, total)
}

// Минимальный размер одной волны для текущего раунда
function getMinWaveSize(round) {
    return MIN_ENEMIES_PER_WAVE + Math.floor(round / ADDITIONAL_ENEMIES_IN_WAVES_DIVIDER)
}

// Количество волн: totalNormal делим на минимальный размер волны с округлением вверх
function determineWavesCount(round, totalNormal) {
    const minWaveSize = getMinWaveSize(round)
    return Math.max(1, Math.ceil(totalNormal / minWaveSize))
}

// Распределяем NORMAL по волнам, начиная с последней (последняя получает больше)
function distributeNormal(totalNormal, wavesCount, minWaveSize) {
    const counts = new Array(wavesCount).fill(0)
    let remaining = totalNormal

    for (let i = wavesCount - 1; i >= 0 && remaining > 0; i--) {
        const take = Math.min(remaining, minWaveSize)
        counts[i] = take
        remaining -= take
    }

    return counts
}

// Получаем следующую цифру из строки четвертей и возвращаем следующий индекс
function getNextQuarterDigit(quarterIndex) {
    const digit = QUARTER_STRING[quarterIndex % QUARTER_STRING.length]
    return { digit: Number(digit), nextIndex: quarterIndex + 1 }
}

// Применяем спецюнитов (кроме BOSS) к волнам
function applySpecialUnits(round, wavesData, totalNormal, startQuarterIndex) {
    let quarterIndex = startQuarterIndex

    for (const type of PRIORITY_ORDER) {
        if (type === TYPES.BOSS) continue // боссов обрабатываем отдельно

        const unitConfig = UNIT_DATA[type]
        if (!unitConfig || round < unitConfig.unlockRound) continue

        let remaining = Math.floor(totalNormal * unitConfig.replacementLimit)
        if (remaining <= 0) continue

        // Этап 1: приоритетное размещение с конца, доля из строки четвертей
        for (let i = wavesData.length - 1; i >= 0 && remaining > 0; i--) {
            const wave = wavesData[i]
            if (wave.normal <= 0) continue

            const { digit, nextIndex } = getNextQuarterDigit(quarterIndex)
            quarterIndex = nextIndex
            const fraction = digit / 4
            const maxReplace = Math.floor(wave.normal * fraction)

            const canReplace = Math.min(remaining, wave.normal, maxReplace)
            if (canReplace > 0) {
                wave.normal -= canReplace
                wave.special[type] = (wave.special[type] || 0) + canReplace
                remaining -= canReplace
            }
        }

        // Этап 2: если остались юниты, добиваем равномерно с конца
        if (remaining > 0) {
            for (let i = wavesData.length - 1; i >= 0 && remaining > 0; i--) {
                const wave = wavesData[i]
                if (wave.normal <= 0) continue

                const canReplace = Math.min(remaining, wave.normal)
                if (canReplace > 0) {
                    wave.normal -= canReplace
                    wave.special[type] = (wave.special[type] || 0) + canReplace
                    remaining -= canReplace
                }
            }
        }
    }

    return quarterIndex
}

// Добавляем боссов
function applyBosses(round, wavesData) {
    const bossConfig = UNIT_DATA[TYPES.BOSS]
    if (round % bossConfig.unlockRound !== 0) return

    const bossCount = Math.floor(round / bossConfig.countDivisor)
    if (bossCount <= 0) return

    let remainingBoss = bossCount

    // Этап 1: по 75% от NORMAL в каждой волне, начиная с последней
    for (let i = wavesData.length - 1; i >= 0 && remainingBoss > 0; i--) {
        const wave = wavesData[i]
        if (wave.normal <= 0) continue

        const maxReplace = Math.floor(wave.normal * bossConfig.bossLineRatio)
        const canReplace = Math.min(remainingBoss, wave.normal, maxReplace)

        if (canReplace > 0) {
            wave.normal -= canReplace
            wave.special[TYPES.BOSS] = (wave.special[TYPES.BOSS] || 0) + canReplace
            remainingBoss -= canReplace
        }
    }

    // Этап 2: добиваем остаток равномерно с конца
    if (remainingBoss > 0) {
        for (let i = wavesData.length - 1; i >= 0 && remainingBoss > 0; i--) {
            const wave = wavesData[i]
            if (wave.normal <= 0) continue

            const canReplace = Math.min(remainingBoss, wave.normal)
            if (canReplace > 0) {
                wave.normal -= canReplace
                wave.special[TYPES.BOSS] += canReplace
                remainingBoss -= canReplace
            }
        }
    }
}

// Перемешиваем юнитов внутри каждой волны, используя строку четвертей
function shuffleWaves(wavesData, startQuarterIndex) {
    let quarterIndex = startQuarterIndex

    for (const wave of wavesData) {
        const units = []

        // Собираем все типы врагов: сначала NORMAL, потом специальные
        for (const type of [TYPES.NORMAL, TYPES.BOSS, TYPES.TANK, TYPES.BOMB, TYPES.FAST]) {
            const count = type === TYPES.NORMAL ? wave.normal : (wave.special[type] || 0)
            for (let i = 0; i < count; i++) units.push(type)
        }

        const front = []
        const middle = []
        const back = []

        for (const unit of units) {
            const { digit, nextIndex } = getNextQuarterDigit(quarterIndex)
            quarterIndex = nextIndex
            if (digit === 1) front.push(unit)
            else if (digit === 2) middle.push(unit)
            else back.push(unit)
        }

        wave.units = [...front, ...middle, ...back]
    }

    return quarterIndex
}

// ============================================================
//  ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ РАУНДА
// ============================================================
export function getRoundWaves(round) {
    // 1. Общее число NORMAL
    const totalNormal = getTotalNormal(round)

    // 2. Число волн
    const wavesCount = determineWavesCount(round, totalNormal)
    const minWaveSize = getMinWaveSize(round)

    // 3. Распределяем NORMAL по волнам
    const normalCounts = distributeNormal(totalNormal, wavesCount, minWaveSize)

    // 4. Инициализируем данные волн
    const wavesData = normalCounts.map(normal => ({
        normal,
        special: {},
        units: []
    }))

    // 5. Применяем спецюнитов (кроме BOSS)
    let quarterIndex = 0
    quarterIndex = applySpecialUnits(round, wavesData, totalNormal, quarterIndex)

    // 6. Применяем BOSS
    applyBosses(round, wavesData)

    // 7. Перемешиваем юнитов внутри волн
    shuffleWaves(wavesData, quarterIndex)

    // 8. Возвращаем массив волн: каждая волна — массив типов врагов
    const resultWaves = wavesData.map(wave => wave.units)

    console.log('РАУНД:', round, '\nволны:', JSON.stringify(resultWaves))

    return resultWaves
}