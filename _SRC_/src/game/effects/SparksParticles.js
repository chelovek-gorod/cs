import { Particle, ParticleContainer } from "pixi.js"
import { tickerAdd, tickerRemove } from "../../app/application"
import { images, atlases } from "../../app/assets"
import { EventHub, events } from "../../app/events"
import { NOISE_BUFFER, NOISE_BUFFER_SIZE, NOISE_MASK, _2PI } from "./constants"

const SMALL_SCALE_MIN = 0.2
const SMALL_SCALE_MAX = 0.4
const BIG_SCALE_MIN = 0.6
const BIG_SCALE_MAX = 0.8

const BIG_COUNT_RATIO = 0.25

const SPREAD = 30
const SPREAD_2 = SPREAD * 2

const GRAVITY_MIN = 0.003
const GRAVITY_MAX = 0.006
const GRAVITY_MID = GRAVITY_MAX - GRAVITY_MIN

const SPARK_SIZE = 28

function getScale(isBig) {
    const scale = isBig
        ? BIG_SCALE_MIN + Math.random() * (BIG_SCALE_MAX - BIG_SCALE_MIN)
        : SMALL_SCALE_MIN + Math.random() * (SMALL_SCALE_MAX - SMALL_SCALE_MIN)
    return scale
}

function createSpark( isBig = false ) {
    const scale = getScale(isBig)
    const spark = new Particle({
        texture: images.spark,
        x: 0,
        y: 0,
        anchorX: 0.5,
        anchorY: 0.5,
        scaleX: scale,
        scaleY: scale,
        rotation: Math.random() * _2PI,
        alpha: 1
    })
    spark.data = {
        isBig: isBig,
        noiseOffset: Math.floor(Math.random() * NOISE_BUFFER_SIZE)
    }
    return spark
}

export default class SparksParticles {
    constructor(width, height) {
        this.container = new ParticleContainer({
            dynamicProperties: {
                position: true,
                rotation: false,
                scale: false,
                alpha: true,
                color: true
            }
        })
        //this.container.blendMode = "add"

        this.poolSmall = []
        this.poolBig = []
        this.sparks = []

        for (let i = 0; i < 120; i++) {
            this.poolSmall.push(createSpark(false))
        }
        for (let i = 0; i < 30; i++) {
            this.poolBig.push(createSpark(true))
        }

        // Границы удаления (будут установлены через resize)
        this.minX = -1000
        this.maxX = 2000
        this.minY = -1000
        this.maxY = 2000
        this.resize(width, height)

        EventHub.on( events.addSparks, this.addSparks, this )
    }

    resize(width, height) {
        // Экран центрирован, координаты частиц относительно центра
        this.minX = -width * 0.5
        this.maxX = width * 1.5
        this.minY = -height * 0.5
        this.maxY = height * 1.5
    }

    // data = {x, y, count = 1, isGravity = true}
    addSparks(data) { 
        const countBig = Math.floor(data.count * BIG_COUNT_RATIO)
        const countSmall = data.count - countBig

        for (let i = 0; i < countBig; i++) {
            const spark = this.poolBig.length ? this.poolBig.pop() : createSpark(true)
            spark.x = data.x - SPREAD + Math.random() * SPREAD_2
            spark.y = data.y - SPREAD + Math.random() * SPREAD_2
            this.setupSpark(spark, data.isGravity)
        }
        for (let i = 0; i < countSmall; i++) {
            const spark = this.poolSmall.length ? this.poolSmall.pop() : createSpark(false)
            spark.x = data.x - SPREAD + Math.random() * SPREAD_2
            spark.y = data.y - SPREAD + Math.random() * SPREAD_2
            this.setupSpark(spark, data.isGravity)
        }

        if (this.sparks.length) tickerAdd(this)
    }

    setupSpark(spark, isGravity) {
        const angle = isGravity
            ? Math.PI * -1.25 + Math.random() * (Math.PI * 1.5)
            : Math.random() * _2PI
        const data = spark.data
        data.gravity = isGravity ? GRAVITY_MIN + Math.random() * GRAVITY_MID : 0
        data.dx = Math.cos(angle)
        data.dy = Math.sin(angle)
        data.alphaDecay = 0.0006
        data.deceleration = 0.96
        data.speed = isGravity ? 0.36 + Math.random() * 0.36 : 0.12 + Math.random() * 0.12
        data.turnSpeed = 0.036

        spark.rotation = Math.random() * _2PI
        spark.alpha = 1

        this.container.addParticle(spark)
        this.sparks.push(spark)
    }

    tick(deltaMs) {
        const sparks = this.sparks
        for (let i = sparks.length - 1; i >= 0; i--) {
            const spark = sparks[i]
            const data = spark.data
            const speed = data.speed * deltaMs
            spark.x += data.dx * speed
            spark.y += data.dy * speed
            if (data.gravity) data.dy += data.gravity * deltaMs

            data.speed *= data.deceleration
            if (data.speed < data.turnSpeed) {
                // 1. Получаем индекс: (текущий_оффсет + шаг) & маска
                // Добавляем небольшой инкремент 3, чтобы частица ползла по шуму
                const noiseIndex = (data.noiseOffset + 3) & NOISE_MASK
                // 2. Берем предзаписанное значение из буфера
                // Буфер содержит значения от -1 до 1, умножаем на коэффициент дрожания
                const jitter = NOISE_BUFFER[noiseIndex] * 0.05 
                data.dx += jitter
                data.dy += jitter

                //data.dx += Math.random() - 0.5
                //data.dy += Math.random() - 0.5
            }

            spark.alpha = Math.max(0, spark.alpha - data.alphaDecay * deltaMs)

            if (spark.alpha <= 0 || data.speed <= 0 ||
                spark.x < this.minX || spark.x > this.maxX ||
                spark.y < this.minY || spark.y > this.maxY) {
                
                this.container.removeParticle(spark)
                if (data.isBig) this.poolBig.push(spark)
                else this.poolSmall.push(spark)
                
                sparks[i] = sparks[sparks.length - 1]
                sparks.pop()
            }
        }

        if (sparks.length === 0) tickerRemove(this)
    }

    kill() {
        EventHub.off( events.addSparks, this.addSparks, this )
        tickerRemove(this)
        
        if (this.container) {
            this.container.destroy({ children: true })
            this.container = null
        }
        
        this.poolSmall.length = 0
        this.poolBig.length = 0
        this.sparks.length = 0
    }
}