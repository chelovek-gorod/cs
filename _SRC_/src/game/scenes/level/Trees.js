import { Container, Sprite } from "pixi.js";
import { atlases } from "../../../app/assets";
import { gameState } from "../../state";

const _2Pi = Math.PI * 2
const TEXTURE_INDEXES = [1, 3, 1, 2, 3, 1, 3, 2, 3, 1, 2, 3]

// Минимальное расстояние от центра (0,0) — ближе деревья не ставятся.
const MIN_CENTER_OFFSET = 320

// Размер текстуры дерева в атласе (квадрат).
const TREE_TEXTURE_SIZE = 256

// Масштаб отрисовки дерева. 1.0 = как в атласе.
const TREE_SCALE = 0.5

// Половина диагонали спрайта (учитывает поворот на любой угол).
const TREE_HALF_DIAGONAL = TREE_TEXTURE_SIZE * Math.SQRT2 * 0.5 * TREE_SCALE

// Размер ячейки сетки. Меньше — плотнее лес.
const CELL_SIZE = 128

// Коэффициент плотности. 1.0 — базовый.
const DENSITY_RATE = 1.8

// Разброс внутри ячейки. 0 = строгая сетка, 1 = полный хаос.
const JITTER_RATE = 0.5

function getTexturePrefix() {
    if (gameState.round % 10 === 0) return 'lava_'
    if (gameState.round % 3 === 0) return 'marsh_'
    return 'winter_'
}

export default class Trees extends Container {
    constructor() {
        super()
        this.trees = []
        this.textureIndex = Math.floor(Math.random() * TEXTURE_INDEXES.length)
    }

    getTexture() {
        this.textureIndex = (this.textureIndex + 1) % TEXTURE_INDEXES.length
        return getTexturePrefix() + TEXTURE_INDEXES[this.textureIndex]
    }

    generateForest(localW, localH) {
        const maxSide = Math.max(localW, localH)
        const half = maxSide * 0.5

        const step = CELL_SIZE / DENSITY_RATE
        const minOffsetSq = MIN_CENTER_OFFSET * MIN_CENTER_OFFSET
        const jitterAmp = step * JITTER_RATE

        for (let gx = -half; gx < half; gx += step) {
            for (let gy = -half; gy < half; gy += step) {

                const baseX = gx + step * 0.5
                const baseY = gy + step * 0.5

                const px = baseX + (Math.random() - 0.5) * jitterAmp
                const py = baseY + (Math.random() - 0.5) * jitterAmp

                if (px * px + py * py < minOffsetSq) continue

                const tree = new Sprite( atlases.trees.textures[ this.getTexture() ] )
                tree.anchor.set(0.5)
                tree.rotation = Math.random() * _2Pi
                tree.scale.set(TREE_SCALE)
                tree.position.set(px, py)

                this.addChild(tree)
                this.trees.push(tree)
            }
        }
    }

    updateVisibility(localW, localH) {
        const boundX = localW * 0.5 + TREE_HALF_DIAGONAL
        const boundY = localH * 0.5 + TREE_HALF_DIAGONAL

        for (let i = 0; i < this.trees.length; i++) {
            const t = this.trees[i]
            const ax = Math.abs(t.x)
            const ay = Math.abs(t.y)
            t.visible = ax < boundX && ay < boundY
        }
    }

    screenResize(screenData) {
        const scale = this.parent ? this.parent.scale.x : 1
        const localW = screenData.width  / scale
        const localH = screenData.height / scale

        if (this.trees.length === 0) this.generateForest(localW, localH)
        this.updateVisibility(localW, localH)
    }

    kill() {
        this.trees.length = 0
        this.destroy({ children: true })
    }
}