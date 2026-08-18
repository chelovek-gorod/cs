import { AnimatedSprite, Container } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../app/application";
import { atlases } from "../../app/assets";
import { EventHub, events } from "../../app/events";
import { timeScale } from "../state";

class Part extends AnimatedSprite {
    constructor(x, y, speedX, scale, pull, isPrefab = false) {
        super(atlases.smoke.animations.go)

        this.parentPull = pull

        this.anchor.set(0.5)
        this.position.set(x, y)
        this.rotation = Math.random() * (Math.PI * 2)
        this.scale.set( scale )
        this.alpha = 0.5 + Math.random() * 0.5

        this.speedX = speedX

        this.animationSpeed = 0.36 * timeScale
        this.loop = false
        this.onComplete = this.done.bind(this)

        if (!isPrefab) {
            this.play()
            tickerAdd(this)
        }
    }

    done() {
        tickerRemove(this)
        this.parent.removeChild(this)
        this.parentPull.push(this)
    }

    tick(deltaMs) {
        this.x -= this.speedX * deltaMs * timeScale
    }
}

class Explosion extends AnimatedSprite {
    constructor(x, y, speedX, pull, isPrefab = false) {
        super(atlases.explosion.animations.go)

        this.parentPull = pull

        this.anchor.set(0.5)
        this.position.set(x, y)
        this.rotation = Math.random() * (Math.PI * 2)
        this.scale.set( 1.6 )
        this.alpha = 0.75

        this.speedX = speedX

        this.animationSpeed = 0.67 * timeScale
        this.loop = false
        this.onComplete = this.done.bind(this)
       
        if (!isPrefab) {
            this.play()
            tickerAdd(this)
        }
    }

    done() {
        tickerRemove(this)
        this.parent.removeChild(this)
        this.parentPull.push(this)
    }

    tick(deltaMs) {
        this.x -= this.speedX * deltaMs * timeScale
    }
}

export default class Smoke extends Container {
    constructor(scrollSpeed) {
        super()
        
        this.scrollSpeed = scrollSpeed * 0.7

        this.smokePull = []
        for(let i = 25; i > 0; i--) {
            this.smokePull.push( new Part(0, 0, 0, 1, this.smokePull, true) )
        }

        this.explosionPull = []
        for(let i = 2; i > 0; i--) {
            this.explosionPull.push( new Explosion(0, 0, 0, this.explosionPull, true) )
        }

        EventHub.on( events.addSmoke, this.addSmoke, this )
        EventHub.on( events.addExplosion, this.addExplosion, this )
    }

    // data = {x, y}
    addSmoke(data) {
        const scale = 'asteroidTail' in data ? 3.6 : 0.6 + Math.random() * 0.6
        const speedX = 'asteroidTail' in data ? -0.6 : this.scrollSpeed
        
        if (this.smokePull.length) {
            const smoke = this.smokePull.pop()
            smoke.position.set(data.x, data.y)
            smoke.speedX = speedX
            smoke.scale.set(scale)
            smoke.animationSpeed = 0.36 * timeScale
            smoke.gotoAndPlay(0)
            smoke.scale.set(scale)
            this.addChild(smoke)
            tickerAdd(smoke)
        } else {
            const smoke = new Part(data.x, data.y, speedX, scale, this.smokePull)
            this.addChild(smoke)
            tickerAdd(smoke)
        }
    }

    // data = {x, y}
    addExplosion(data) {
        if (this.explosionPull.length) {
            const explosion = this.explosionPull.pop()
            explosion.position.set(data.x, data.y)
            explosion.speedX = this.scrollSpeed
            explosion.animationSpeed = 0.67 * timeScale
            explosion.gotoAndPlay(0)
            this.addChild(explosion)
            tickerAdd(explosion)
        } else {
            const explosion = new Explosion(data.x, data.y, this.scrollSpeed, this.explosionPull)
            this.addChild(explosion)
            tickerAdd(explosion)
        }
    }

    kill() {
        EventHub.off( events.addSmoke, this.addSmoke, this )
        EventHub.off( events.addExplosion, this.addExplosion, this )

        while(this.smokePull.length) {
            const smoke = this.smokePull.pop()
            smoke.destroy()
        }

        while(this.explosionPull.length) {
            const explosion = this.explosionPull.pop()
            explosion.destroy()
        }

        while(this.children.length) {
            const effect = this.children[0]
            tickerRemove(effect)
            this.removeChild(effect)
            effect.destroy()
        }
    }
}