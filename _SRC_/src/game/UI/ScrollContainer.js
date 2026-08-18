import { Container, Graphics, Rectangle } from 'pixi.js'

const BG_COLOR = 0x1a1a1a
const BG_ALPHA = 0.8
const BG_PADDING = 8
const BG_RADIUS = 16

const MASK_RADIUS = 12

const SCROLL_LINE_WIDTH = 12
const SCROLL_TRACK_COLOR = 0x000000
const SCROLL_TRACK_ALPHA = 0.3
const SCROLL_THUMB_COLOR = 0xffffff
const SCROLL_THUMB_ALPHA = 0.7
const SCROLL_PADDING_RIGHT = -3
const SCROLL_PADDING_VERTICAL = 3
const MIN_THUMB_HEIGHT = 30

export default class ScrollContainer extends Container {
    // ширина подстраивается под ширину contentContainer
    // высота видимой части -> visibleHeight
    // высоту можно менять через ScrollContainer.setHeight(visibleHeight)
    constructor(contentContainer, fixedWidth, visibleHeight) {
        super()

        this.viewHeight = visibleHeight
        this.fixedWidth = fixedWidth

        this.background = new Graphics()
        this.drawBackground()
        this.addChild(this.background)

        this.innerContainer = new Container()
        this.addChild(this.innerContainer)

        this.maskGraphics = new Graphics()
        this.maskGraphics.roundRect(0, 0, this.fixedWidth, this.viewHeight, MASK_RADIUS)
        this.maskGraphics.fill(0xffffff)
        this.innerContainer.addChild(this.maskGraphics)
        this.innerContainer.mask = this.maskGraphics

        this.content = contentContainer
        this.innerContainer.addChild(this.content)

        this.eventMode = 'static'
        this.hitArea = new Rectangle(0, 0, this.fixedWidth, this.viewHeight)
        this.cursor = 'pointer'

        this.dragging = false
        this.thumbDragging = false
        this.dragStartY = 0
        this.startContentY = 0
        this.minY = 0

        this.track = null
        this.thumb = null

        this.bgBounds = new Rectangle(
            -BG_PADDING, -BG_PADDING,
            this.fixedWidth + BG_PADDING * 2,
            this.viewHeight + BG_PADDING * 2
        )

        this.calculateMinY()

        this.on('pointerdown', this.onDragStart, this)
        this.on('pointermove', this.onDragMove, this)
        this.on('pointerup', this.onDragEnd, this)
        this.on('pointerupoutside', this.onDragEnd, this)
        this.on('pointercancel', this.onDragEnd, this)
        this.on('wheel', this.onWheel, this)
    }

    drawBackground() {
        this.background.clear()
        this.background.roundRect(
            -BG_PADDING,
            -BG_PADDING,
            this.fixedWidth + BG_PADDING * 2,
            this.viewHeight + BG_PADDING * 2,
            BG_RADIUS
        )
        this.background.fill({ color: BG_COLOR, alpha: BG_ALPHA })

        this.bgBounds = new Rectangle(
            -BG_PADDING,
            -BG_PADDING,
            this.fixedWidth + BG_PADDING * 2,
            this.viewHeight + BG_PADDING * 2
        )
    }

    updateScrollbar() {
        const contentHeight = this.content.height
        if (contentHeight <= this.viewHeight || this.minY === 0) {
            if (this.track) {
                this.removeChild(this.track)
                this.track.destroy()
                this.track = null
            }
            if (this.thumb) {
                this.removeChild(this.thumb)
                this.thumb.destroy()
                this.thumb = null
            }
            return
        }

        if (!this.track) {
            this.track = new Graphics()
            this.addChild(this.track)
        }
        if (!this.thumb) {
            this.thumb = new Graphics()
            this.addChild(this.thumb)
        }

        const trackX = this.fixedWidth - SCROLL_PADDING_RIGHT - SCROLL_LINE_WIDTH
        const trackY = SCROLL_PADDING_VERTICAL
        const trackHeight = this.viewHeight - SCROLL_PADDING_VERTICAL * 2
        const radius = SCROLL_LINE_WIDTH / 2

        this.track.clear()
        this.track.roundRect(trackX, trackY, SCROLL_LINE_WIDTH, trackHeight, radius)
        this.track.fill({ color: SCROLL_TRACK_COLOR, alpha: SCROLL_TRACK_ALPHA })

        const thumbHeight = Math.max(
            MIN_THUMB_HEIGHT,
            (this.viewHeight / contentHeight) * trackHeight
        )
        const maxThumbY = trackHeight - thumbHeight
        const scrollProgress = this.minY === 0 ? 0 : this.content.y / this.minY
        const thumbY = trackY + maxThumbY * scrollProgress

        this.thumb.clear()
        this.thumb.roundRect(trackX, thumbY, SCROLL_LINE_WIDTH, thumbHeight, radius)
        this.thumb.fill({ color: SCROLL_THUMB_COLOR, alpha: SCROLL_THUMB_ALPHA })
    }

    calculateMinY() {
        this.minY = Math.min(0, this.viewHeight - this.content.height)
        this.clampContentY()
        this.updateScrollbar()
    }

    clampContentY() {
        let y = this.content.y
        if (y > 0) y = 0
        if (y < this.minY) y = this.minY
        this.content.y = y
        this.updateScrollbar()
    }

    onDragStart(event) {
        event.preventDefault()
        const pos = event.getLocalPosition(this)

        const trackX = this.fixedWidth - SCROLL_PADDING_RIGHT - SCROLL_LINE_WIDTH
        const trackY = SCROLL_PADDING_VERTICAL
        const trackHeight = this.viewHeight - SCROLL_PADDING_VERTICAL * 2

        if (this.thumb && this.thumb.visible &&
            pos.x >= trackX && pos.x <= trackX + SCROLL_LINE_WIDTH &&
            pos.y >= trackY && pos.y <= trackY + trackHeight) {

            this.thumbDragging = true
            this.dragging = false
            this.dragStartY = pos.y
            this.startContentY = this.content.y

            const contentHeight = this.content.height
            const thumbHeight = Math.max(MIN_THUMB_HEIGHT, (this.viewHeight / contentHeight) * trackHeight)
            const halfThumb = thumbHeight / 2
            const maxThumbTop = trackHeight - thumbHeight

            let targetCenterY = pos.y
            const minCenterY = trackY + halfThumb
            const maxCenterY = trackY + trackHeight - halfThumb
            targetCenterY = Math.max(minCenterY, Math.min(maxCenterY, targetCenterY))

            const targetThumbTop = targetCenterY - halfThumb - trackY

            if (maxThumbTop > 0 && this.minY !== 0) {
                const scrollProgress = targetThumbTop / maxThumbTop
                this.content.y = scrollProgress * this.minY
                this.clampContentY()
                this.startContentY = this.content.y
            }
            return
        }

        this.dragging = true
        this.thumbDragging = false
        this.dragStartY = pos.y
        this.startContentY = this.content.y
    }

    onDragMove(event) {
        if (!this.dragging && !this.thumbDragging) return

        event.preventDefault()
        const pos = event.getLocalPosition(this)

        // проверка выхода за пределы подложки
        if (!this.bgBounds.contains(pos.x, pos.y)) {
            this.onDragEnd()
            return
        }

        if (this.thumbDragging) {
            const deltaY = pos.y - this.dragStartY
            const trackHeight = this.viewHeight - SCROLL_PADDING_VERTICAL * 2
            const contentHeight = this.content.height
            const thumbHeight = Math.max(MIN_THUMB_HEIGHT, (this.viewHeight / contentHeight) * trackHeight)
            const maxThumbY = trackHeight - thumbHeight

            if (maxThumbY > 0 && this.minY !== 0) {
                const ratio = this.minY / maxThumbY
                this.content.y = this.startContentY + deltaY * ratio
                this.clampContentY()
            }
            return
        }

        // обычное перетаскивание контента
        const deltaY = pos.y - this.dragStartY
        this.content.y = this.startContentY + deltaY
        this.clampContentY()
    }

    onDragEnd() {
        this.dragging = false
        this.thumbDragging = false
    }

    onWheel(event) {
        event.preventDefault()
        this.content.y -= event.deltaY
        this.clampContentY()
    }

    setHeight(visibleHeight) {
        this.viewHeight = visibleHeight

        this.drawBackground()

        this.maskGraphics.clear()
        this.maskGraphics.roundRect(0, 0, this.fixedWidth, this.viewHeight, MASK_RADIUS)
        this.maskGraphics.fill(0xffffff)

        this.hitArea = new Rectangle(0, 0, this.fixedWidth, this.viewHeight)
        this.calculateMinY()
    }

    kill() {
        this.off('pointerdown', this.onDragStart, this)
        this.off('pointermove', this.onDragMove, this)
        this.off('pointerup', this.onDragEnd, this)
        this.off('pointerupoutside', this.onDragEnd, this)
        this.off('pointercancel', this.onDragEnd, this)
        this.off('wheel', this.onWheel, this)

        if (this.content && this.content.parent) {
            this.content.parent.removeChild(this.content)
        }

        this.destroy({ children: true })
    }
}