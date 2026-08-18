import { TilingSprite } from 'pixi.js'
import { getAppScreen } from '../../app/application'

export default class BackgroundTiling extends TilingSprite {
    constructor(texture) {
        super(texture)
        
        this.bgTileWidth = texture.width
        this.bgTileHeight = texture.height
        this.anchor.set(0.5)
    }

    screenResize(screenData) {
        this.width = screenData.width
        this.height = screenData.height
        const offsetX = screenData.width % this.bgTileWidth
        const offsetY = screenData.height % this.bgTileHeight
        this.tilePosition.x = offsetX * 0.5
        this.tilePosition.y = offsetY * 0.5
    }

    setTexture(texture) {
        this.texture = texture
        this.bgTileWidth = texture.width
        this.bgTileHeight = texture.height
        this.anchor.set(0.5)
        screenResize(getAppScreen())
    }
}