import { Assets } from 'pixi.js'
import { assets } from '../../../app/assets'
import { Howl } from 'howler'
import { initFontStyles, styles } from '../../../app/styles'

function isString( value ) {
    return (typeof value === 'string' || value instanceof String)
}

const multiPacksMap = new Map()

export function preloadFonts( callback ) {
    if (styles.isReady) return callback()

    Assets.addBundle('fonts', assets.fonts)
    Assets.loadBundle('fonts').then( fontData => {
        // update font values by font family
        for(let key in fontData) assets.fonts[key] = fontData[key].family
        initFontStyles()
        callback()
    })
}

export function preloadAsset( type, key, callback ) {
    uploadAsset( type, key, assetLoaded )

    function assetLoaded() {
        checkMultiPackAnimations()
        callback()
    }
}

function uploadAsset( type, key, callback ) {
    if ( ! isString(assets[type][key]) ) return callback()

    if (type === 'sounds') {
        return loadHowlSound(type, key, callback)
    }

    Assets.add( {alias: key, src: assets[type][key]} )
    Assets.load( key ).then(data => {
        if ('data' in data && 'meta' in data.data
        && 'related_multi_packs' in data.data.meta
        && 'animations' in data.data) {
            multiPacksMap.set(key, data.data.animations)
        }
        assets[type][key] = data

        callback()
    })
}

function loadHowlSound(type, key, callback) {
    const config = {
        src: [assets[type][key]],
        preload: true,
        html5: false
    }
    
    /*
    // Можно добавить специфичные настройки по типу звука
    if (type === 'sounds') {
        config.volume = 1.0 // По умолчанию для эффектов
    }
    // else if (type === 'voice') { ... } // Для будущего расширения
    */
    
    const sound = new Howl(config)
    
    sound.on('load', () => {
        assets[type][key] = sound
        callback()
    })
    
    sound.on('loaderror', (id, error) => {
        console.warn(`Не удалось загрузить звуковой эффект: ${key}`, error)
        assets[type][key] = null
        callback()
    })
}

function checkMultiPackAnimations() {
    multiPacksMap.forEach( (animations, atlasKey) => {
        // update all textures in all animations at MultiPack atlas
        for(let animationName in assets.atlases[atlasKey].animations) {
            assets.atlases[atlasKey].animations[animationName].forEach( (frame, index) => {
                if (!!frame) return // texture is already loaded, go to next frame
                const texture = Assets.cache.get(animations[animationName][index])
                assets.atlases[atlasKey].animations[animationName][index] = texture
            })
        }
    })
    multiPacksMap.clear()
}

// assetsData{type:[keys], type:[keys]...}
export function loadAssets( assetsData, doneCallback, progressCallback = null ) {
    let assetsCount = 0
    for (let type in assetsData) assetsCount += assetsData[type].length
    const progressPerAsset = 100 / assetsCount
    let loadedAssetsCount = 0
    let progress = 0

    for (let type in assetsData) {
        assetsData[type].forEach( key => uploadAsset(type, key, sourceLoaded) )
    }
    
    function sourceLoaded() {
        loadedAssetsCount++
        progress += progressPerAsset
        if (progressCallback) progressCallback(progress, loadedAssetsCount, assetsCount)

        if (loadedAssetsCount === assetsCount) {
            checkMultiPackAnimations()
            doneCallback()
        }
    }
}