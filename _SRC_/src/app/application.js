import { Application } from 'pixi.js'
import { changeFocus, EventHub, events, screenResize } from './events'

// app settings
let isAutoFullScreen = false

let isGlobalAppCursor = false
export let appPointer = null

const isCursorHidden = false // use custom image
if (isCursorHidden) document.body.style.cursor = 'none'

// game state
let isGamePaused = false

// ticker list
let tickerArr = []
let tickerSet = new Set() // для быстрой проверки наличия объекта в тикере

// queues
const tickerAddQueue = new Set()
const tickerRemoveQueue = new Set()
const killQueue = new Set()

// pixi app settings
const appSettings = {
    background: 0x000000,
    antialias: true, // сглаживание (false - для пиксель-арт стиля)
    //autoDensity: true, // не растягивается, пиксели остаются чёткими
    //roundPixels: true, // чтобы пиксели не размывались
    resolution: window.devicePixelRatio || 1,
    resizeTo: null    
}

// app logic
let app = null
let appContainer = null
let appReadyCallback = null

export default function initApp(container, callback) {
    if (app) return

    app = new Application()
    appContainer = container
    appReadyCallback = callback

    appSettings.resizeTo = appContainer
    app.init( appSettings ).then( appReady )
}

function appReady() {
    app.ticker.add( time => tick(time) )
    appContainer.append( app.canvas )

    if (isAutoFullScreen) startFullScreen()

    // cancel screenshot on right mouse button click
    app.canvas.oncontextmenu = (event) => event.preventDefault()

    resize() // update application screen size data

    if (isGlobalAppCursor) {
        app.stage.eventMode = 'static'
        app.stage.on('pointermove', (event) => appPointer = event.data)
    }

    appReadyCallback()
}

const appScreen = {
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    isLandscape: false
}

function resize() {
    appScreen.width = app.screen.width
    appScreen.height = app.screen.height
    appScreen.centerX = app.screen.width * 0.5
    appScreen.centerY = app.screen.height * 0.5
    appScreen.isLandscape = app.screen.width > app.screen.height

    screenResize( appScreen )
}

export function getAppScreen() {
    return appScreen
}

export function getAppPointer(target) {
    return appPointer.getLocalPosition(target)
}

export function blockStageEventMode() {
    app.stage.eventMode = 'none'
}
export function unblockStageEventMode() {
    app.stage.eventMode = 'static'
}

export function sceneAdd(...elements) {
    elements.forEach( element => app.stage.addChild( element ) )
}

export function sceneRemove(element) {
    app.stage.removeChild( element )
}

export function sceneClear() {
    while (app.stage.children.length) app.stage.children[0].destroy({children: true})
}

export function getAppRenderer() {
    return app.renderer
}

let orientation = window.matchMedia("(orientation: portrait)");
orientation.addEventListener("change", () => setTimeout(resize, 0))
window.addEventListener('resize', () => setTimeout(resize, 0))

window.addEventListener('focus', updateVisibilityState)
window.addEventListener('blur', updateVisibilityState)
if ('hidden' in document) document.addEventListener('visibilitychange', updateVisibilityState)

function checkVisible() {
    return document.visibilityState === 'visible' // && document.hasFocus()
}

function updateVisibilityState( ) {
    if (app === null || !('ticker' in app)) return

    // true if in focus and visible
    const isVisible = checkVisible()

    changeFocus(isVisible) // event for others entities

    // one render step to create first visible frame
    if (isVisible && app.renderer) app.renderer.render(app.stage)

    if (isVisible) tickerStart()
    else tickerStop()
}
// update visibility with app init
setTimeout(updateVisibilityState, 0)

// check device info
const deviceInfo = (() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && !isMobile
    
    return {
        deviceType: isTablet ? 'tablet' : isMobile ? 'mobile' : isTouch ? 'touch-desktop' : 'desktop',
        capabilities: {
            touch: isTouch,
            mouse: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
            keyboard: window.matchMedia('(hover: hover)').matches,
            gamepad: 'getGamepads' in navigator
        }
    }
})()

export function getDeviceType() {
    return deviceInfo.deviceType
}

export function getInputCapabilities() {
    return deviceInfo.capabilities
}

export function getSafeAreaOffsets() {
    const style = getComputedStyle(document.documentElement)
    
    return {
        top: parseInt(style.getPropertyValue('--sat')) || 0,
        bottom: parseInt(style.getPropertyValue('--sab')) || 0,
        left: parseInt(style.getPropertyValue('--sal')) || 0,
        right: parseInt(style.getPropertyValue('--sar')) || 0,
    }
}

function startFullScreen() {
    if (!isAutoFullScreen) return
    
    function onCanvasClick() {
        // Запускаем FoolScreen
        if (app.canvas.requestFullscreen) {
            app.canvas.requestFullscreen()
        } else if (app.canvas.mozRequestFullScreen) {
            app.canvas.mozRequestFullScreen()
        } else if (app.canvas.webkitRequestFullscreen) {
            app.canvas.webkitRequestFullscreen()
        } else if (app.canvas.msRequestFullscreen) {
            app.canvas.msRequestFullscreen()
        }
        
        // Отписываемся от клика
        app.canvas.removeEventListener('click', onCanvasClick)
        
        // Подписываемся на выход
        document.addEventListener('fullscreenchange', onFullscreenChange)
        document.addEventListener('mozfullscreenchange', onFullscreenChange)
        document.addEventListener('webkitfullscreenchange', onFullscreenChange)
        document.addEventListener('msfullscreenchange', onFullscreenChange)
    }
    
    function onFullscreenChange() {
        // Проверяем, что вышли из fullscreen
        if (!document.fullscreenElement && 
            !document.mozFullScreenElement && 
            !document.webkitFullscreenElement && 
            !document.msFullscreenElement) {
            
            // Отписываемся от выхода
            document.removeEventListener('fullscreenchange', onFullscreenChange)
            document.removeEventListener('mozfullscreenchange', onFullscreenChange)
            document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
            document.removeEventListener('msfullscreenchange', onFullscreenChange)
            
            // Снова подписываемся на клик
            if (isAutoFullScreen) app.canvas.addEventListener('click', onCanvasClick)
        }
    }
    
    // Подписываемся на клик
    app.canvas.addEventListener('click', onCanvasClick)
}

// ticker

EventHub.on( events.gamePause, gamePause )
EventHub.on( events.gameResume, gameResume )
function gamePause() {
    isGamePaused = true
    tickerStop()
}
function gameResume() {
    isGamePaused = false

    // Возвращаем фокус игровому окну
    window.focus?.()
    window.top?.focus?.()

    tickerStart()
}

export function tickerStart() {
    if (checkVisible() && isGamePaused === false) app.ticker.start()
}
export function tickerStop() {
    app.ticker.stop()
}

export function tickerAdd(element) {
    if (!element?.tick) {
        console.warn('TRY TO ADD ELEMENT IN TICKER WITHOUT .tick(deltaMS) METHOD:', element)
        return
    }

    if (killQueue.has(element)) return

    tickerRemoveQueue.delete(element)

    if (tickerSet.has(element) || tickerAddQueue.has(element)) return

    tickerAddQueue.add(element)
}

export function tickerRemove(element) {
    if (!element) return
    
    tickerAddQueue.delete(element) // не выходим !!!
    
    tickerRemoveQueue.add(element)
}

export function kill(element) {
    if (!element) return
    if (killQueue.has(element)) return
    
    const stack = [element]
    
    while (stack.length > 0) {
        const current = stack.pop()
        
        tickerAddQueue.delete(current)
        tickerRemoveQueue.delete(current)
        killQueue.add(current)
        
        const children = current.children
        if (children && children.length > 0) {
            for (let i = children.length; i--;) {
                stack.push(children[i])
            }
        }
    }
}

function tick(time) {
    // if (delta = 1) -> FPS = 60 (16.66ms per frame)
    
    const deltaMS = time.deltaMS
    for (let i = tickerArr.length - 1; i >= 0; i--) {
        tickerArr[i].tick(deltaMS)
    }
    // time.elapsedMS - milliseconds after start app
    // time.deltaMS   - milliseconds after previous frame
    // time.deltaTime - FPS rate (from 60 FPS) ~1 (= 1 FPS)    

    if (tickerAddQueue.size > 0) {
        for (const obj of tickerAddQueue) {
            tickerArr.push(obj)
            tickerSet.add(obj)
        }
        tickerAddQueue.clear()
    }
            
    if (tickerRemoveQueue.size > 0) filterTickerArrBySet( tickerRemoveQueue )
            
    if (killQueue.size > 0) {
        const killArr = Array.from(killQueue)
        filterTickerArrBySet( killQueue )
            
        while (killArr.length > 0) {
            const obj = killArr.pop()
            tickerSet.delete(obj)
            if (obj.kill) obj.kill()
            if (obj.destroy) obj.destroy({ children: true })
        }
    }
}

function filterTickerArrBySet(set) {
    let writeIndex = 0
    for (let i = 0; i < tickerArr.length; i++) {
        const obj = tickerArr[i]
        if (set.has(obj)) tickerSet.delete(obj)
        else tickerArr[writeIndex++] = obj
    }
    tickerArr.length = writeIndex
    set.clear()
}

export function isInTicker(element) {
    return tickerSet.has(element)
}