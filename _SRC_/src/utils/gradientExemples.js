// примеры градиентов для вызова getRecTexture()

// 1. Линейный градиент слева направо (по умолчанию)
const tex1 = getRecTexture(200, 100, {
    type: "linear-gradient",
    stops: [
        { offset: 0, color: 0xFF0000 },   // Красный слева
        { offset: 1, color: 0x0000FF }    // Синий справа
    ]
})

// 2. Линейный градиент сверху вниз
const tex2 = getRecTexture(200, 100, {
    type: "linear-gradient",
    y0: 0,    // Верх
    y1: 100,  // Низ (равно height)
    stops: [
        { offset: 0, color: 0xFFFF00 },   // Жёлтый сверху
        { offset: 1, color: 0x00FF00 }    // Зелёный снизу
    ]
})

// 3. Диагональный градиент
const tex3 = getRecTexture(200, 100, {
    type: "linear-gradient",
    x0: 0, y0: 0,     // Левый верхний угол
    x1: 200, y1: 100, // Правый нижний угол
    stops: [
        { offset: 0, color: 0xFFFFFF },
        { offset: 0.5, color: 0x888888 },
        { offset: 1, color: 0x000000 }
    ]
})

// 4. Многоцветный градиент
const tex4 = getRecTexture(200, 100, {
    type: "linear-gradient",
    stops: [
        { offset: 0, color: 0xFF0000 },
        { offset: 0.3, color: 0xFFFF00 },
        { offset: 0.6, color: 0x00FF00 },
        { offset: 1, color: 0x0000FF }
    ]
})