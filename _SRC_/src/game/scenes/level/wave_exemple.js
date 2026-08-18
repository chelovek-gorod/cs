export const WAVES = [

    // WAVE 1
    [
        {
            timeout: 3000,
            enemies: {
                [TYPES.NORMAL]: 1,
            }
        },
        {
            timeout: 1500,
            enemies: {
                [TYPES.NORMAL]: 1
            }
        },
        {
            timeout: 1500,
            enemies: {
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.NORMAL]: 1
            }
        },
    ],

    // WAVE 2
    [
        {
            timeout: 3000,
            enemies: {
                [TYPES.NORMAL]: 3
            }
        },
        {
            timeout: 2000,
            enemies: {
                [TYPES.NORMAL]: 3
            }
        },
        {
            timeout: 1500,
            enemies: {
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.NORMAL]: 2
            }
        },
    ],

    // WAVE 3
    [
        {
            timeout: 2000,
            enemies: {
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.NORMAL]: 2,
                [TYPES.FAST]: 1
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.NORMAL]: 2,
                [TYPES.FAST]: 2
            }
        },
    ],

    // WAVE 4
    [
        {
            timeout: 2000,
            enemies: {
                [TYPES.NORMAL]: 3
            }
        },
        {
            timeout: 900,
            enemies: {
                [TYPES.FAST]: 2,
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 900,
            enemies: {
                [TYPES.NORMAL]: 3,
                [TYPES.FAST]: 1
            }
        },
    ],

    // WAVE 5 — первый BOMB
    [
        {
            timeout: 2000,
            enemies: {
                [TYPES.NORMAL]: 3
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.FAST]: 2
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.NORMAL]: 2,
                [TYPES.BOMB]: 1
            }
        },
        {
            timeout: 1200,
            enemies: {
                [TYPES.NORMAL]: 2,
                [TYPES.FAST]: 1
            }
        },
    ],

    // WAVE 6
    [
        {
            timeout: 2000,
            enemies: {
                [TYPES.NORMAL]: 4
            }
        },
        {
            timeout: 900,
            enemies: {
                [TYPES.FAST]: 2,
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.BOMB]: 1,
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 900,
            enemies: {
                [TYPES.FAST]: 2,
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.BOMB]: 1
            }
        },
    ],

    // WAVE 7
    [
        {
            timeout: 2000,
            enemies: {
                [TYPES.NORMAL]: 4
            }
        },
        {
            timeout: 900,
            enemies: {
                [TYPES.FAST]: 3
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.NORMAL]: 2,
                [TYPES.BOMB]: 1
            }
        },
        {
            timeout: 900,
            enemies: {
                [TYPES.NORMAL]: 2,
                [TYPES.FAST]: 2
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.BOMB]: 1
            }
        },
    ],

    // WAVE 8 — первый TANK
    [
        {
            timeout: 2000,
            enemies: {
                [TYPES.NORMAL]: 4
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.FAST]: 2,
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 1200,
            enemies: {
                [TYPES.TANK]: 1
            }
        },
        {
            timeout: 900,
            enemies: {
                [TYPES.BOMB]: 1,
                [TYPES.FAST]: 2
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.NORMAL]: 3
            }
        },
    ],

    // WAVE 9
    [
        {
            timeout: 2000,
            enemies: {
                [TYPES.NORMAL]: 4
            }
        },
        {
            timeout: 800,
            enemies: {
                [TYPES.FAST]: 3,
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.BOMB]: 1,
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 1200,
            enemies: {
                [TYPES.TANK]: 1,
                [TYPES.FAST]: 2
            }
        },
        {
            timeout: 900,
            enemies: {
                [TYPES.NORMAL]: 3,
                [TYPES.BOMB]: 1
            }
        },
        {
            timeout: 1200,
            enemies: {
                [TYPES.TANK]: 1
            }
        },
    ],

    // WAVE 10
    [
        {
            timeout: 2000,
            enemies: {
                [TYPES.NORMAL]: 5
            }
        },
        {
            timeout: 800,
            enemies: {
                [TYPES.FAST]: 3,
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.BOMB]: 2
            }
        },
        {
            timeout: 1200,
            enemies: {
                [TYPES.TANK]: 1,
                [TYPES.FAST]: 2
            }
        },
        {
            timeout: 800,
            enemies: {
                [TYPES.NORMAL]: 3,
                [TYPES.FAST]: 2
            }
        },
        {
            timeout: 1000,
            enemies: {
                [TYPES.BOMB]: 2,
                [TYPES.NORMAL]: 2
            }
        },
        {
            timeout: 1200,
            enemies: {
                [TYPES.TANK]: 1
            }
        },
    ]

]