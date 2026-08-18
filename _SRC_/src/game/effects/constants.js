export const _2PI = Math.PI * 2

export const NOISE_BUFFER_SIZE = 256
export const NOISE_MASK = NOISE_BUFFER_SIZE - 1 // 255 (для быстрого modulo через &)
export const NOISE_BUFFER = new Float32Array(NOISE_BUFFER_SIZE)

for (let i = 0; i < NOISE_BUFFER_SIZE; i++) {
    NOISE_BUFFER[i] = Math.random() * 2 - 1 // диапазон -1.0 ... 1.0
}

export const HELP_DURATION = 3600
export const HELP_IN_OUT = 2400