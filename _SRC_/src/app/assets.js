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
    tower_layer_1: 'tower_layer_1.png',
    tower_layer_2: 'tower_layer_2.png',
    tower_layer_3: 'tower_layer_3.png',
    archer_arrow: 'archer_arrow.png',
    arrow_point: 'arrow_point.png',
    enemy: 'enemy.png',
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
    explosion: 'explosion_240x240px_28frames.json'
}
export const sounds = {
    
}
export const music = {

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