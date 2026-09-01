export const assetType = {
    images : 'images',
    atlases: 'atlases',
    sounds : 'sounds',
    music : 'music',
    fonts : 'fonts',
}

export const path = {
    images : './images/',
    atlases: './atlases/',
    sounds : './sounds/',
    music : './music/',
    fonts : './fonts/',
}
export const fonts = {
    P: 'Tuffy-Regular.ttf',
}

export const images = {
    /***  for LoadScene ***/
    //logo: 'logo.png',
    //title_en: 'title_en.png',
    //title_ru: 'title_ru.png',
    //bg_main: 'bg_main.webp',


    /*** game images ***/
    coin: 'coin.png',
    round_bg: 'round_bg.png',
    winter_bg: 'winter_bg.png',
    tower: 'tower.png',
    tower_layer_1: 'tower_layer_1.png',
    tower_layer_2: 'tower_layer_2.png',
    tower_layer_3: 'tower_layer_3.png',
    archer_arrow: 'archer_arrow.png',
    arrow_point: 'arrow_point.png',
    enemy: 'enemy.png',
    enemy_arrow: 'enemy_arrow.png',
    hp_bar_bg: 'hp_bar_bg.png',
    hp_bar_line: 'hp_bar_line.png',
    icon_bow: 'icon_bow.png',
    icon_bow_line: 'icon_bow_line.png',
    icon_bow_bg: 'icon_bow_bg.png',
    stone: 'stone.png'
}
export const atlases = {
    archer: 'archer.json',
    wizard: 'wizard.json',
    catapult: 'catapult.json',
    explosion_stone: 'explosion_240x240px_28frames.json',
    explosion_bomb: 'explosion_192x192px_25frames.json',
    enemy_normal: 'enemy_normal_hit.json',
    enemy_runner: 'enemy_runner.json',
    enemy_shooter: 'enemy_shooter.json',
    enemy_bomber: 'enemy_bomber.json',
    enemy_tank: 'enemy_tank.json',
    enemy_other: 'enemy_other.json',
}
export const sounds = {
    se_arrow: 'se_arrow_shut.mp3',
    se_wizard_shut: 'se_wizard_shut.mp3',
    se_catapult_shut: 'se_catapult_shut.mp3',
}
export const music = {
    bgm_menu: 'bgm_menu.mp3',
    bgm_1: 'bgm_1.mp3',
    bgm_2: 'bgm_2.mp3',
    bgm_3: 'bgm_3.mp3',
    bgm_4: 'bgm_4.mp3',
    bgm_5: 'bgm_5.mp3',
    bgm_6: 'bgm_6.mp3',
    bgm_7: 'bgm_7.mp3',
}

export const assets = {fonts, images, atlases, sounds, music}
for (let assetType in assets) {
    for (let key in assets[assetType]) {
        assets[assetType][key] = path[assetType] + assets[assetType][key]
    }
}

// check duplicated keys
const allKeys = new Map()
const duplicates = new Set()

for (const [assetTypeName, assetCollection] of Object.entries(assets)) {
    for (const key of Object.keys(assetCollection)) {
        if (allKeys.has(key)) duplicates.add(key)
        allKeys.set(key, assetTypeName)
    }
}

if (duplicates.size > 0) {
    const duplicateDetails = Array.from(duplicates).map(key => {
        const types = []
        for (const [typeName, assetCollection] of Object.entries(assets)) {
            if (Object.prototype.hasOwnProperty.call(assetCollection, key)) {
                types.push(typeName)
            }
        }
        return `"${key}" (${types.join(', ')})`
    }).join(', ')
    
    throw new Error(`Duplicate asset keys detected: ${duplicateDetails}`)
}