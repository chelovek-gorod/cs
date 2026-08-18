import { TextStyle, FillGradient } from "pixi.js"
import { fonts } from "./assets"

const damageGradient = new FillGradient({
    type: 'linear',
    colorStops: [
      { offset: 0,    color: '#ffff00' },
      { offset: 1,    color: '#ff9900' },
    ],
})

const levelGradient = new FillGradient({
    type: 'linear',
    colorStops: [
      { offset: 0,    color: '#ffffff' },
      { offset: 1,    color: '#ff9900' },
    ],
})
const scoreGradient = new FillGradient({
    type: 'linear',
    colorStops: [
      { offset: 0,    color: '#ffff00' },
      { offset: 1,    color: '#ff9900' },
    ],
})
const comboGradient = new FillGradient({
    type: 'linear',
    colorStops: [
      { offset: 0,    color: '#00ffff' },
      { offset: 1,    color: '#ff00ff' },
    ],
})
const coinsGradient = new FillGradient({
    type: 'linear',
    colorStops: [
      { offset: 0,    color: '#ffff00' },
      { offset: 1,    color: '#ff7700' },
    ],
})
const savesGradient = new FillGradient({
    type: 'linear',
    colorStops: [
      { offset: 0,    color: '#ffffff' },
      { offset: 1,    color: '#ff0000' },
    ],
})
const titleGradient = new FillGradient({
    type: 'linear',
    colorStops: [
      { offset: 0,    color: '#ffFF00' },
      { offset: 0.5,    color: '#ffffff' },
      { offset: 1,    color: '#ffFF00' },
    ],
})

export let styles = {
    isReady: false, /* if true -> fonts is already loaded */

    /* Font keys (init all fonts in function bellow) */
    loading: null,

    arrowsCount: null,
    damage: null,

    level: null,
    target: null,
    score: null,
    combo: null,
    coins: null,
    saves: null,

    flyText: null,
    flyMessage: null,

    button: null,
    buttonHover: null,
    
    popupTitle: null,
    popupDescription: null,
    popupLabel: null,

    topTableCenter: null,
    topTableLeft: null,
    topTableRight: null,
}

export function initFontStyles() {
    styles.loading = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 48,
        fill: '#ffffff',
    
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 6,
        dropShadowAngle: 0,
        dropShadowDistance: 0,
    })

    styles.arrowsCount = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 16,
        fill: 0x000000,
        align: 'left',
    })

    styles.damage = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 18,
        fill: damageGradient,
    
        stroke: {
            color: 0x000000,
            width: 2
        },
    })

    styles.level = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 32,
        fill: levelGradient,
        align: 'left',
    
        stroke: {
            color: 0x000000,
            width: 4
        },
    })
    styles.target = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 16,
        fill: 0xffffff,
        align: 'left',
    
        stroke: {
            color: 0x000000,
            width: 4
        },
    })
    styles.score = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 56,
        fill: scoreGradient,
        align: 'right',
    
        stroke: {
            color: 0x000000,
            width: 5
        },
    })
    styles.combo = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 32,
        fill: comboGradient,
        align: 'left',
    
        stroke: {
            color: 0x000000,
            width: 4
        },
    })
    styles.coins = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 32,
        fill: coinsGradient,
        align: 'left',
    
        stroke: {
            color: 0x000000,
            width: 4
        },
    })
    styles.saves = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 36,
        fill: savesGradient,
        align: 'right',
    
        stroke: {
            color: 0x000000,
            width: 4
        },
    })

    styles.flyText = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 64,
        fill: scoreGradient,
        align: 'left',

        stroke: {
            color: 0x000000,
            width: 6
        },

        dropShadow: true,
        dropShadowColor: '#770077',
        dropShadowBlur: 6,
        dropShadowAngle: Math.PI * 0.5,
        dropShadowDistance: 6,
    })

    styles.flyMessage = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 48,
        fill: 0xffffff,
        align: 'center',

        wordWrap: true,
        wordWrapWidth: 320,

        stroke: {
            color: 0x000000,
            width: 6
        },
    })

    styles.button = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 36,
        fill: '#ffffff',
    })
    styles.buttonHover = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 36,
        fill: '#ffffff',
    
        dropShadow: true,
        dropShadowColor: '#770077',
        dropShadowBlur: 6,
        dropShadowAngle: 0,
        dropShadowDistance: 0,
    })

    styles.popupTitle = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 64,
        fill: titleGradient,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 600,
        lineHeight: 64,
        stroke: {
            color: 0x000000,
            width: 3
        }
    })
    styles.popupDescription = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 32,
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 600,
        lineHeight: 32,
        stroke: {
            color: 0x000000,
            width: 3
        }
    })
    styles.popupLabel = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 32,
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 260,
        lineHeight: 32,
        stroke: {
            color: 0x000000,
            width: 3
        }
    })

    styles.topTableCenter = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 24,
        fill: 0xffffff,
        align: 'center',
        stroke: {
            color: 0x000000,
            width: 2
        }
    })
    styles.topTableLeft = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 24,
        fill: 0xffffff,
        align: 'left',
        stroke: {
            color: 0x000000,
            width: 2
        }
    })
    styles.topTableRight = new TextStyle({
        fontFamily: fonts.P,
        fontSize: 24,
        fill: 0xffffff,
        align: 'right',
        stroke: {
            color: 0x000000,
            width: 2
        }
    })

    styles.isReady = true

    // EXAMPLES
    /*
    gradientText: new TextStyle({
        fontFamily: fonts.RobotoBlack,
        fontSize: 32,
        fill: '#000000',

        align: 'center',
        
        wordWrap: true,
        wordWrapWidth: 440,
        //breakWords: true,
        lineJoin: 'round',

        stroke: {
            color: 0x000000,
            width: 2
        }

        dropShadow: true,
        dropShadowColor: '#ffffff',
        dropShadowBlur: 6,
        dropShadowAngle: 0,
        dropShadowDistance: 0,

        wordWrap: true,
        wordWrapWidth: 400,
    }),
    */
}