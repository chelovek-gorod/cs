import { createEnum } from "../../../utils/functions"
import { TYPES } from "./Enemy"

// ============================================================
//  КОНФИГ ГЕНЕРАТОРА ВОЛН
//  Все значения можно менять без изменения логики генератора
// ============================================================

// --- ОБЩАЯ ФОРМУЛА ЧИСЛА NORMAL В РАУНДЕ ---
// TotalNormal(round) = A + B * round + C * round^1.5 + D * round^2
const NORMAL_FORMULA = {
    A: 5,          // базовое число врагов
    B: 1,          // линейный коэффициент
    C: 0.5,        // коэффициент степени 1.5
    D: 0.1         // коэффициент квадратичного роста
}

// --- ЛЁГКИЕ РАУНДЫ ---
const EASY_ROUND_MODULO = 3            // раунды, кратные этому числу, считаются лёгкими
const EASY_NORMAL_MULTIPLIER = 0.7     // множитель числа NORMAL в лёгком раунде

// --- МИНИМУМЫ И МАКСИМУМЫ ДЛЯ ВОЛН И ЛИНИЙ ---
const MIN_ENEMIES_PER_WAVE = 8                     // минимум врагов в волне
const MAX_ENEMIES_PER_WAVE_EXTRA = 8               // добавка к раунду для максимума врагов в волне
const MAX_ENEMIES_PER_LINE_BASE = 5                // базовая вместимость линии
const MAX_ENEMIES_PER_LINE_SQRT_RATE = 1           // множитель корня раунда для вместимости линии

// --- ПАТТЕРНЫ ВОЛН ---
const WAVE_PATTERNS = [
    [0.4, 0.2, 0.4],
    [0.4, 0.3, 0.3],
    [0.4, 0.4, 0.2],
]

// --- ПАТТЕРНЫ ЛИНИЙ ---
const LINE_PATTERNS = [
    [0.5, 0.2, 0.3],
    [0.4, 0.2, 0.4],
    [0.6, 0.2, 0.2],
    [0.5, 0.1, 0.4],
    [0.4, 0.3, 0.3],
    [0.6, 0.1, 0.3],
    [0.7, 0.1, 0.2],
]

// --- СПЕЦ-ЮНИТЫ (появление и лимиты) ---
const PRIORITY_ORDER = [TYPES.BOSS, TYPES.TANK, TYPES.BOMB, TYPES.FAST]

const PLACEMENT_TYPE = createEnum([
    'first_line_of_first_wave',  // первая линия первой волны раунда
    'first_line_of_each_wave',   // первая линия каждой волны раунда
    'last_line_of_last_wave',    // последняя линия последней волны раунда
    'last_line_of_each_wave',    // последняя линия каждой волны раунда
    'middle_lines_of_each_wave', // средняя линия каждой волны (если линий чётное количество - две средние)
    'evenly_from_start',         // равномерное распределение, начиная с первой линии
    'evenly_from_end',           // равномерное распределение, начиная с последней линии
    'from_last_line_backwards'   // размещение с последней линии и далее назад по предыдущим
])

const UNIT_DATA = {
    [TYPES.FAST]: {
        unlockRound: 3,
        replacementLimit: 0.2,
        rules: [
            { multiplicity: 5, placement: PLACEMENT_TYPE.first_line_of_first_wave, maxLineRatio: 0.5 },
            { multiplicity: 7, placement: PLACEMENT_TYPE.evenly_from_start, maxLineRatio: 0.5 },
            { multiplicity: 2, placement: PLACEMENT_TYPE.first_line_of_each_wave, maxLineRatio: 0.5 },
            { multiplicity: 1, placement: PLACEMENT_TYPE.last_line_of_each_wave, maxLineRatio: 0.5 }
        ]
    },
    [TYPES.BOMB]: {
        unlockRound: 5,
        replacementLimit: 0.1,
        rules: [
            { multiplicity: 6, placement: PLACEMENT_TYPE.middle_lines_of_each_wave, maxLineRatio: 0.5 },
            { multiplicity: 8, placement: PLACEMENT_TYPE.evenly_from_end, maxLineRatio: 0.5 },
            { multiplicity: 10, placement: PLACEMENT_TYPE.first_line_of_each_wave, maxLineRatio: 0.5 },
            { multiplicity: 9, placement: PLACEMENT_TYPE.first_line_of_first_wave, maxLineRatio: 0.5 },
            { multiplicity: 1, placement: PLACEMENT_TYPE.last_line_of_each_wave, maxLineRatio: 0.5 }
        ]
    },
    [TYPES.TANK]: {
        unlockRound: 8,
        replacementLimit: 0.4,
        rules: [
            { multiplicity: 4, placement: PLACEMENT_TYPE.last_line_of_last_wave, maxLineRatio: 0.5 },
            { multiplicity: 6, placement: PLACEMENT_TYPE.first_line_of_first_wave, maxLineRatio: 0.5 },
            { multiplicity: 8, placement: PLACEMENT_TYPE.last_line_of_each_wave, maxLineRatio: 0.5 },
            { multiplicity: 1, placement: PLACEMENT_TYPE.last_line_of_each_wave, maxLineRatio: 1 }
        ]
    },
    [TYPES.BOSS]: {
        unlockRound: 10,
        countDivisor: 10,
        placement: PLACEMENT_TYPE.from_last_line_backwards,
        maxLineRatio: 0.5
    }
}

// --- ТАЙМИНГИ ---
const FIRST_LINE_TIMEOUT_MS = 1800       // задержка перед первой линией каждой волны
const BASE_LINE_TIMEOUT_MS = 3600        // минимальная задержка между линиями

// ============================================================
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Вычисляет общее число NORMAL в раунде по формуле.
 */
function getTotalNormal(round) {
    const { A, B, C, D } = NORMAL_FORMULA
    let total = A + B * round + C * Math.pow(round, 1.5) + D * Math.pow(round, 2)

    if (round % EASY_ROUND_MODULO === 0 && round % 10 !== 0) {
        total = Math.floor(total * EASY_NORMAL_MULTIPLIER)
    }

    // Не меньше минимально допустимого числа в одной волне (чтобы волна не пустовала)
    const minTotal = MIN_ENEMIES_PER_WAVE
    return Math.max(minTotal, Math.floor(total))
}

/**
 * Подбирает количество волн на основе общего числа врагов и ограничений на волну.
 */
function determineWavesCount(round, totalNormal) {
    let waves = Math.max(1, Math.ceil(Math.sqrt(round)))

    const maxPerWave = MAX_ENEMIES_PER_WAVE_EXTRA + round
    let average = totalNormal / waves

    // Увеличиваем число волн, если среднее превышает максимум
    while (average > maxPerWave) {
        waves++
        average = totalNormal / waves
    }

    // Уменьшаем число волн, если среднее меньше минимума (но не меньше 1)
    while (average < MIN_ENEMIES_PER_WAVE && waves > 1) {
        waves--
        average = totalNormal / waves
    }

    return waves
}

/**
 * Строит нормализованный массив весов для заданного количества элементов (волн или линий),
 * используя паттерн, выбранный по индексу. Веса строятся с конца: последний элемент получает
 * первый коэффициент паттерна и т.д. При нехватке коэффициентов переходим к следующему паттерну.
 */
function buildWeights(count, patternIndex, patterns) {
    if (count === 0) return []

    const weights = new Array(count)
    let patternPos = patternIndex
    let coeffPos = 0

    for (let i = count - 1; i >= 0; i--) {
        const pattern = patterns[patternPos]
        weights[i] = pattern[coeffPos]

        coeffPos++
        if (coeffPos >= pattern.length) {
            coeffPos = 0
            patternPos = (patternPos + 1) % patterns.length
        }
    }

    // Нормализуем
    const sum = weights.reduce((s, w) => s + w, 0)
    if (sum <= 0) return weights.map(() => 1 / count)

    return weights.map(w => w / sum)
}

/**
 * Распределяет total по count групп с помощью весов. Возвращает массив целых чисел,
 * сумма которых равна total. Округление вниз, остаток добавляем в последнюю группу.
 */
function distributeByWeights(total, weights) {
    const count = weights.length
    const result = new Array(count).fill(0)

    let assigned = 0
    for (let i = 0; i < count; i++) {
        if (i === count - 1) {
            result[i] = total - assigned // последний получает остаток
        } else {
            result[i] = Math.floor(total * weights[i])
            assigned += result[i]
        }
    }

    return result
}

// ============================================================
//  ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ РАУНДА
// ============================================================
export function getRoundWaves(round) {
    // 1. Общее число NORMAL
    const totalNormal = getTotalNormal(round)

    // 2. Число волн
    const wavesCount = determineWavesCount(round, totalNormal)

    // 3. Выбираем паттерн волн
    const wavePatternIndex = round % WAVE_PATTERNS.length
    const waveWeights = buildWeights(wavesCount, wavePatternIndex, WAVE_PATTERNS)

    // 4. Распределяем NORMAL по волнам
    const enemiesInWaves = distributeByWeights(totalNormal, waveWeights)

    // 5. Выбираем паттерн линий (для всех волн один и тот же в этом раунде)
    const linePatternIndex = round % LINE_PATTERNS.length
    const maxLineCapacity = MAX_ENEMIES_PER_LINE_BASE + Math.sqrt(round) * MAX_ENEMIES_PER_LINE_SQRT_RATE

    // 6. Для каждой волны распределяем её врагов по линиям
    const wavesData = []

    for (let w = 0; w < wavesCount; w++) {
        const enemiesInWave = enemiesInWaves[w]

        // Определяем количество линий
        let linesInWave = Math.max(1, Math.ceil(enemiesInWave / maxLineCapacity))

        // Строим веса для линий этой волны
        const lineWeights = buildWeights(linesInWave, linePatternIndex, LINE_PATTERNS)

        // Распределяем врагов по линиям
        let enemiesInLines = distributeByWeights(enemiesInWave, lineWeights)

        // Проверяем, что ни одна линия не превысила максимум
        while (Math.max(...enemiesInLines) > maxLineCapacity && linesInWave < enemiesInWave) {
            linesInWave++
            const newWeights = buildWeights(linesInWave, linePatternIndex, LINE_PATTERNS)
            enemiesInLines = distributeByWeights(enemiesInWave, newWeights)
        }

        // Создаём массив линий с изначальным составом только NORMAL
        const waveLines = enemiesInLines.map(count => ({
            enemies: { [TYPES.NORMAL]: count }
        }))

        wavesData.push({
            waveIndex: w,
            lines: waveLines
        })
    }

    // 7. Добавляем спец-юнитов (кроме BOSS)
    for (const type of PRIORITY_ORDER) {
        if (type === TYPES.BOSS) continue
        const unitConfig = UNIT_DATA[type]
        if (!unitConfig || round < unitConfig.unlockRound) continue

        const targetTotal = Math.floor(totalNormal * unitConfig.replacementLimit)
        if (targetTotal <= 0) continue

        const rule = unitConfig.rules.find(rule => round % rule.multiplicity === 0)
        if (!rule) continue

        const placement = rule.placement
        const maxLineRatio = rule.maxLineRatio

        // Формируем плоский список всех линий
        const flatLines = []
        for (const wave of wavesData) {
            for (const line of wave.lines) {
                flatLines.push(line)
            }
        }

        // Определяем целевые линии для приоритетного размещения
        let targetLines = []
        switch (placement) {
            case PLACEMENT_TYPE.first_line_of_first_wave:
                targetLines = [flatLines[0]]
                break
            case PLACEMENT_TYPE.first_line_of_each_wave:
                targetLines = wavesData.map(wave => wave.lines[0])
                break
            case PLACEMENT_TYPE.last_line_of_last_wave:
                targetLines = [flatLines[flatLines.length - 1]]
                break
            case PLACEMENT_TYPE.last_line_of_each_wave:
                targetLines = wavesData.map(wave => wave.lines[wave.lines.length - 1])
                break
            case PLACEMENT_TYPE.middle_lines_of_each_wave:
                targetLines = []
                for (const wave of wavesData) {
                    const lines = wave.lines
                    const mid = Math.floor(lines.length / 2)
                    if (lines.length % 2 === 0) {
                        targetLines.push(lines[mid - 1], lines[mid])
                    } else {
                        targetLines.push(lines[mid])
                    }
                }
                break
            case PLACEMENT_TYPE.evenly_from_start:
                targetLines = flatLines.slice()
                break
            case PLACEMENT_TYPE.evenly_from_end:
                targetLines = flatLines.slice().reverse()
                break
            default:
                targetLines = []
        }

        // Этап 1: приоритетное размещение
        let remaining = targetTotal
        for (const line of targetLines) {
            if (remaining <= 0) break

            const totalInLine = Object.values(line.enemies).reduce((s, c) => s + c, 0)
            const maxAllowed = Math.floor(totalInLine * maxLineRatio)
            const currentType = line.enemies[type] || 0
            const availableNormal = line.enemies[TYPES.NORMAL] || 0

            const canAdd = Math.min(remaining, availableNormal, maxAllowed - currentType)
            if (canAdd > 0) {
                line.enemies[type] = currentType + canAdd
                line.enemies[TYPES.NORMAL] -= canAdd
                remaining -= canAdd
            }
        }

        // Этап 2: остаточное распределение по всем линиям
        if (remaining > 0) {
            let allLinesOrdered
            switch (placement) {
                case PLACEMENT_TYPE.first_line_of_first_wave:
                case PLACEMENT_TYPE.first_line_of_each_wave:
                case PLACEMENT_TYPE.evenly_from_start:
                    allLinesOrdered = flatLines.slice()
                    break
                case PLACEMENT_TYPE.last_line_of_last_wave:
                case PLACEMENT_TYPE.last_line_of_each_wave:
                case PLACEMENT_TYPE.evenly_from_end:
                    allLinesOrdered = flatLines.slice().reverse()
                    break
                case PLACEMENT_TYPE.middle_lines_of_each_wave:
                    allLinesOrdered = flatLines.slice().sort((a, b) => {
                        const mid = Math.floor(flatLines.length / 2)
                        return Math.abs(flatLines.indexOf(a) - mid) - Math.abs(flatLines.indexOf(b) - mid)
                    })
                    break
                default:
                    allLinesOrdered = flatLines.slice()
            }

            let attempts = 0
            const maxAttempts = allLinesOrdered.length * 10
            while (remaining > 0 && attempts < maxAttempts) {
                for (const line of allLinesOrdered) {
                    if (remaining <= 0) break

                    const totalInLine = Object.values(line.enemies).reduce((s, c) => s + c, 0)
                    const maxAllowed = Math.floor(totalInLine * maxLineRatio)
                    const currentType = line.enemies[type] || 0
                    const availableNormal = line.enemies[TYPES.NORMAL] || 0

                    const canAdd = Math.min(remaining, availableNormal, maxAllowed - currentType)
                    if (canAdd > 0) {
                        line.enemies[type] = currentType + canAdd
                        line.enemies[TYPES.NORMAL] -= canAdd
                        remaining -= canAdd
                    }
                }
                attempts++
            }
        }
    }

    // 8. Добавляем боссов, если раунд кратен 10
    if (round % UNIT_DATA[TYPES.BOSS].unlockRound === 0) {
        const bossConfig = UNIT_DATA[TYPES.BOSS]
        const bossCount = Math.floor(round / bossConfig.countDivisor)
        let remainingBoss = bossCount

        if (remainingBoss > 0) {
            const maxRatio = bossConfig.maxLineRatio
            const flatLines = []
            for (const wave of wavesData) {
                for (const line of wave.lines) {
                    flatLines.push(line)
                }
            }

            // Идём с конца
            for (let i = flatLines.length - 1; i >= 0 && remainingBoss > 0; i--) {
                const line = flatLines[i]
                const totalInLine = Object.values(line.enemies).reduce((s, c) => s + c, 0)
                const maxAllowed = Math.floor(totalInLine * maxRatio)
                const currentBoss = line.enemies[TYPES.BOSS] || 0
                const availableNormal = line.enemies[TYPES.NORMAL] || 0

                const canAdd = Math.min(remainingBoss, availableNormal, maxAllowed - currentBoss)
                if (canAdd > 0) {
                    line.enemies[TYPES.BOSS] = currentBoss + canAdd
                    line.enemies[TYPES.NORMAL] -= canAdd
                    remainingBoss -= canAdd
                }
            }
        }
    }

    // 9. Формируем итоговый массив волн с таймингами
    const resultWaves = []
    for (const wave of wavesData) {
        const waveLines = []
        for (let l = 0; l < wave.lines.length; l++) {
            const line = wave.lines[l]

            const timeout = l === 0 ? FIRST_LINE_TIMEOUT_MS : BASE_LINE_TIMEOUT_MS

            // Фильтруем типы с нулевым количеством
            const enemies = {}
            for (const [type, count] of Object.entries(line.enemies)) {
                if (count > 0) enemies[type] = count
            }

            waveLines.push({ timeout, enemies })
        }
        resultWaves.push(waveLines)
    }

    console.log('РАУНД:', round, '\nволны:', JSON.stringify(resultWaves))

    return resultWaves
}