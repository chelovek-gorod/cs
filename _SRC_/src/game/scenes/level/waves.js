import { TYPES } from "./Enemy"

// ============================================================
//  ПОРЯДОК ТИПОВ
// ============================================================

// Полный порядок типов (используется при построении массива юнитов в волне)
const ALL_TYPES_ORDER = [
    TYPES.NORMAL,
    TYPES.BOSS,
    TYPES.TANK,
    TYPES.VOODOO,
    TYPES.BOMB,
    TYPES.RIDER,
    TYPES.SHOOTER,
    TYPES.FAST,
]

// Приоритет при замещении NORMAL спец-юнитами.
// Чем выше в списке — тем раньше "заберёт" слоты у NORMAL.
// Также используется при разрешении конфликтов тем (см. THEME_PRIORITY ниже).
const PRIORITY_ORDER = [
    TYPES.BOSS,
    TYPES.TANK,
    TYPES.VOODOO,
    TYPES.BOMB,
    TYPES.RIDER,
    TYPES.SHOOTER,
    TYPES.FAST,
]

// ============================================================
//  ОБЩЕЕ ЧИСЛО NORMAL В РАУНДЕ
// ============================================================

const MIN_ENEMIES_PER_ROUND = 5                // жёсткий минимум врагов в раунде
const ENEMIES_PER_ROUND_FORMULA_BASE = 4       // база формулы: (base + round)
const DIFFICULTY_MULTIPLIER = 1.3              // множитель сложности: (base + round) * mult
const EASY_ROUND_MODULO = 3                    // каждый N-й раунд считается "лёгким"
const EASY_NORMAL_MULTIPLIER = 0.7             // в лёгких раундах врагов × 0.7

// ============================================================
//  РАЗМЕР ВОЛНЫ
// ============================================================

// Минимальное количество врагов в одной волне.
// Итоговый минимум = MIN_ENEMIES_PER_WAVE + floor(round / ADDITIONAL_ENEMIES_IN_WAVES_DIVIDER)
const MIN_ENEMIES_PER_WAVE = 5
const ADDITIONAL_ENEMIES_IN_WAVES_DIVIDER = 3

// ============================================================
//  СТРОКА ЧЕТВЕРТЕЙ
// ============================================================
// Используется как "псевдо-рандом" для распределения замен и перемешивания.
// Числа 1, 2, 3 означают "положить в переднюю / среднюю / заднюю часть волны".
// Не менять в рантайме — это детерминированная последовательность.
const QUARTER_STRING = '123231132'

// ============================================================
//  СПЕЦ-ЮНИТЫ (базовые данные)
// ============================================================
// unlockRound — с какого раунда юнит появляется в игре вообще
// replacementLimit — доля от общего числа NORMAL, которую он может заменить
//                   (в обычных раундах; в тематических — см. THEME_ALIEN_RATE)
// countDivisor — только для BOSS: раз в сколько раундов он появляется
// bossLineRatio — только для BOSS: какую долю NORMAL в волне может заменить

const UNIT_DATA = {
    [TYPES.FAST]: {
        unlockRound: 3,
        replacementLimit: 0.1,
    },
    [TYPES.SHOOTER]: {
        unlockRound: 6,
        replacementLimit: 0.2,
    },
    [TYPES.RIDER]: {
        unlockRound: 12,
        replacementLimit: 0.2,
    },
    [TYPES.BOMB]: {
        unlockRound: 15,
        replacementLimit: 0.1,
    },
    [TYPES.TANK]: {
        unlockRound: 25,
        replacementLimit: 0.1,
    },
    [TYPES.VOODOO]: {
        unlockRound: 35,
        replacementLimit: 0.1,
    },
    [TYPES.BOSS]: {
        unlockRound: 10,
        countDivisor: 10,
        bossLineRatio: 0.7,
    },
}

// ============================================================
//  ТЕМАТИЧЕСКИЕ РАУНДЫ
// ============================================================
//
// Тема — это когда все NORMAL в раунде заменяются на один спец-тип.
// Это создаёт "волну бомберов", "волну фастов", "волну лучников" и т.д.
//
// ПРАВИЛА:
// - Босс-раунды (кратные BOSS_DIVISOR) и лёгкие раунды (кратные EASY_ROUND_MODULO)
//   НИКОГДА не бывают тематическими — они важнее.
// - Если раунд кратен нескольким темам — выбирается по THEME_PRIORITY.
// - Если спец-юнит темы ещё не разблокирован (round < unlockRound) — тема отменяется.
// - В тематическом раунде:
//     * Тема-спец применяется с обычным лимитом.
//       Каждый его слот при финальной сборке превращается в NORMAL (обратная конверсия).
//     * Прочие спецы применяются с лимитом × THEME_ALIEN_RATE, но минимум 1.
//       Это даёт немного разнообразия в монотонной волне.

const BOSS_DIVISOR = 10           // босс-раунды (кратные этому числу)

// Темы раундов: массив { type, divisor } — раунд кратен divisor → тема = type
// Если раунд кратен нескольким — сработает приоритет из THEME_PRIORITY.
const THEME_RULES = [
    { type: TYPES.FAST,    divisor: 4 },
    { type: TYPES.BOMB,    divisor: 7 },
    { type: TYPES.SHOOTER, divisor: 9 },
    { type: TYPES.TANK,    divisor: 13},
]

// Приоритет тем при конфликте (раунд кратен нескольким divisor'ам).
// BOMB > SHOOTER > FAST.
// Если добавляешь новую тему — впиши её сюда в нужном порядке.
const THEME_PRIORITY = [
    TYPES.BOMB,
    TYPES.SHOOTER,
    TYPES.FAST,
]

// Доля от обычного лимита для "прочих" спец-юнитов в тематическом раунде.
// 0.25 = четверть от того, сколько их было бы в обычном раунде.
// Минимум 1 на каждый доступный спец-тип — гарантирован.
const THEME_ALIEN_RATE = 0.25

// ============================================================
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

// Общее число NORMAL в раунде с учётом лёгких раундов.
// Формула: (base + round) * difficulty, для лёгких (÷3, кроме ÷10) умножается на 0.7.
function getTotalNormal(round) {
    let total = Math.floor((ENEMIES_PER_ROUND_FORMULA_BASE + round) * DIFFICULTY_MULTIPLIER)

    if (round % EASY_ROUND_MODULO === 0 && round % BOSS_DIVISOR !== 0) {
        total = Math.ceil(total * EASY_NORMAL_MULTIPLIER)
    }

    return Math.max(MIN_ENEMIES_PER_ROUND, total)
}

// Минимальный размер одной волны для текущего раунда.
function getMinWaveSize(round) {
    return MIN_ENEMIES_PER_WAVE + Math.floor(round / ADDITIONAL_ENEMIES_IN_WAVES_DIVIDER)
}

// Количество волн: totalNormal делим на минимальный размер волны (округление вверх).
function determineWavesCount(round, totalNormal) {
    const minWaveSize = getMinWaveSize(round)
    return Math.max(1, Math.ceil(totalNormal / minWaveSize))
}

// Распределяем NORMAL по волнам, начиная с последней (последняя получает больше).
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

// Получаем следующую цифру из строки четвертей.
// Возвращает { digit, nextIndex } — цифру и следующий индекс в строке.
function getNextQuarterDigit(quarterIndex) {
    const digit = QUARTER_STRING[quarterIndex % QUARTER_STRING.length]
    return { digit: Number(digit), nextIndex: quarterIndex + 1 }
}

// ============================================================
//  ОПРЕДЕЛЕНИЕ ТЕМЫ РАУНДА
// ============================================================
//
// Возвращает TYPES.FAST | TYPES.BOMB | TYPES.SHOOTER или null.
//
// Логика:
// 1. Босс-раунд (÷BOSS_DIVISOR) → null
// 2. Лёгкий раунд (÷EASY_ROUND_MODULO) → null
// 3. Собираем всех "кандидатов" — темы, чей divisor делит round
// 4. Из кандидатов выбираем по THEME_PRIORITY
// 5. Если выбранный юнит ещё не разблокирован — тема отменяется

function getThemeTypeForRound(round) {
    // 1. Босс-раунды — без темы
    if (round % BOSS_DIVISOR === 0) return null
    // 2. Лёгкие раунды — без темы
    if (round % EASY_ROUND_MODULO === 0) return null

    // 3. Собираем кандидатов
    const candidates = []
    for (const rule of THEME_RULES) {
        if (round % rule.divisor === 0) candidates.push(rule.type)
    }
    if (candidates.length === 0) return null

    // 4. Выбираем по приоритету
    for (const type of THEME_PRIORITY) {
        if (!candidates.includes(type)) continue

        const cfg = UNIT_DATA[type]
        if (!cfg) return null

        // 5. Проверяем разблокировку
        if (round < cfg.unlockRound) return null

        return type
    }

    return null
}

// ============================================================
//  ПРИМЕНЕНИЕ СПЕЦ-ЮНИТОВ
// ============================================================
//
// Заменяет часть NORMAL на спец-юнитов.
// Если themeType задан — сам тема-спец применяется с обычным лимитом,
// а прочие спецы с лимитом × THEME_ALIEN_RATE (минимум 1).
//
// Особенность тематического раунда:
//   слоты, куда "встал" тема-спец, при финальной сборке превратятся обратно в NORMAL
//   (см. shuffleWaves). Это даёт в монотонной волне немного "нормальных" врагов.

function applySpecialUnits(round, wavesData, totalNormal, startQuarterIndex, themeType) {
    let quarterIndex = startQuarterIndex

    for (const type of PRIORITY_ORDER) {
        // NORMAL и BOSS обрабатываются отдельно
        if (type === TYPES.NORMAL || type === TYPES.BOSS) continue

        const unitConfig = UNIT_DATA[type]
        if (!unitConfig) continue
        if (round < unitConfig.unlockRound) continue

        // Определяем лимит замены для этого типа
        let remaining
        if (type === themeType) {
            // Тема-спец: обычный лимит
            remaining = Math.floor(totalNormal * unitConfig.replacementLimit)
        } else {
            // Прочие спецы: × THEME_ALIEN_RATE, минимум 1
            // (в обычном раунде themeType = null, сюда попадут все — но для них лимит как обычно)
            const rate = themeType !== null ? THEME_ALIEN_RATE : 1
            remaining = Math.max(
                themeType !== null ? 1 : 0,
                Math.floor(totalNormal * unitConfig.replacementLimit * rate)
            )
        }
        if (remaining <= 0) continue

        // Этап 1: приоритетное размещение с конца волн, доля берётся из строки четвертей
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

        // Этап 2: если остались юниты — добиваем равномерно с конца
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

// ============================================================
//  ПРИМЕНЕНИЕ БОССОВ
// ============================================================
//
// Боссы появляются раз в BOSS_DIVISOR раундов.
// Количество боссов = floor(round / BOSS_DIVISOR).
// Каждый босс заменяет NORMAL с коэффициентом bossLineRatio (по умолчанию 0.75).

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
                wave.special[TYPES.BOSS] = (wave.special[TYPES.BOSS] || 0) + canReplace
                remainingBoss -= canReplace
            }
        }
    }
}

// ============================================================
//  ПЕРЕМЕШИВАНИЕ ЮНИТОВ ВНУТРИ ВОЛНЫ
// ============================================================
//
// 1. Собираем плоский массив юнитов волны.
// 2. Пробегаем по нему и раскидываем по front/middle/back по цифре из QUARTER_STRING.
// 3. Склеиваем front + middle + back — это и есть порядок спавна.
//
// Особенность тематического раунда:
//   - NORMAL-слоты превращаются в themeType.
//   - Слоты тема-спеца превращаются в NORMAL (обратная конверсия).

function shuffleWaves(wavesData, startQuarterIndex, themeType) {
    let quarterIndex = startQuarterIndex

    for (const wave of wavesData) {
        const units = []

        for (const type of ALL_TYPES_ORDER) {
            if (type === TYPES.NORMAL) {
                // NORMAL-слоты: если тема задана — становятся темой
                const count = wave.normal
                const actualType = themeType !== null ? themeType : TYPES.NORMAL
                for (let i = 0; i < count; i++) units.push(actualType)
            } else if (type === themeType) {
                // Слоты тема-спеца: становятся NORMAL (обратная конверсия)
                const count = wave.special[type] || 0
                for (let i = 0; i < count; i++) units.push(TYPES.NORMAL)
            } else {
                // Обычные спецы
                const count = wave.special[type] || 0
                for (let i = 0; i < count; i++) units.push(type)
            }
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
//  ГЛАВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ РАУНДА
// ============================================================
//
// Пайплайн:
//  1. Считаем общее число NORMAL в раунде.
//  2. Определяем количество волн.
//  3. Распределяем NORMAL по волнам.
//  4. Применяем боссов (они всегда идут первыми — приоритет выше темы).
//  5. Определяем тему раунда (может быть null).
//  6. Применяем спец-юнитов (с учётом темы).
//  7. Перемешиваем юнитов внутри каждой волны (с учётом темы).
//  8. Возвращаем массив волн — массив массивов типов.

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
        units: [],
    }))

    // 5. Боссы (высший приоритет — они не заменяются темой)
    applyBosses(round, wavesData)

    // 6. Тема раунда (или null)
    const themeType = getThemeTypeForRound(round)

    // 7. Спец-юниты
    let quarterIndex = 0
    quarterIndex = applySpecialUnits(round, wavesData, totalNormal, quarterIndex, themeType)

    // 8. Перемешивание
    shuffleWaves(wavesData, quarterIndex, themeType)

    // 9. Возврат
    const resultWaves = wavesData.map(wave => wave.units)

    // Лог для отладки. Убери в прод.
    const themeLabel = themeType !== null ? ` [THEME: ${themeType}]` : ''
    console.log('РАУНД:', round + themeLabel, '\nволны:', JSON.stringify(resultWaves))

    return resultWaves
}