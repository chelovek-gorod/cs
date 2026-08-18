import { Particle, ParticleContainer } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../app/application";
import { atlases } from "../../app/assets";
import { EventHub, events } from "../../app/events";
import { timeScale } from "../state";
import { NOISE_BUFFER, NOISE_BUFFER_SIZE, NOISE_MASK, _2PI } from "./constants";

// ========== ПАРАМЕТРЫ (оптимизированы под текстуру 32x32 с glow) ==========
const ROCKET_SIZE = 0.12;
const TRAIL_SIZE = 0.06;
const EXPLOSION_SIZE_MIN = 0.18;
const EXPLOSION_SIZE_MAX = 0.36;

const ROCKET_SPEED = 1.2;
const EXPLOSION_SPEED = 0.36;
const GRAVITY = 0.0009;
const ROCKET_GRAVITY = 0.0018;

const TRAIL_COUNT = 12;               // уменьшено, т.к. частицы стали мелкими
const ALPHA_DECAY_EXPLOSION = 0.0009;

const LAUNCH_DELAY_MIN = 120;
const LAUNCH_DELAY_MAX = 360;

const COLORS = [
    0xff5555, 0xff9933, 0xffdd44, 0x55cc55, 0x5599ff, 0xbb66ff, 0xff66aa
];

export default class FireworkParticles {
    constructor(isBlandModeAdd = false) {
        this.container = new ParticleContainer({
            dynamicProperties: {
                position: true,
                scale: false,
                alpha: true,
                color: true
            }
        });
        if (isBlandModeAdd) this.container.blendMode = "add"

        this.pool = [];
        this.particles = [];
        this.rockets = [];
        this.pendingLaunches = [];

        this.minX = -1000;
        this.maxX = 1000;
        this.minY = -1000;
        this.maxY = 1000;
        this.explodeMarginX = 0;
        this.explodeMarginY = 0;

        // Пул частиц (1200 достаточно для вторичных взрывов)
        for (let i = 0; i < 1200; i++) {
            const p = new Particle({
                texture: atlases.gameplay.textures.firework,
                anchorX: 0.5,
                anchorY: 0.5,
            });
            p.data = {
                noiseOffset: Math.floor(Math.random() * NOISE_BUFFER_SIZE),
                baseColor: COLORS[Math.floor(Math.random() * COLORS.length)]
            };
            this.pool.push(p);
        }

        EventHub.on(events.launchFirework, this.launch, this);
    }

    resize(width, height) {
        this.minX = -width * 0.7;
        this.maxX = width * 0.7;
        this.minY = -height * 0.7;
        this.maxY = height * 0.7;

        this.explodeMarginX = width * 0.25;
        this.explodeMarginY = height * 0.25;
    }

    launch({ point, offset, count, sparks }) {
        if (count <= 0) return;

        for (let i = 0; i < count; i++) {
            const delay = LAUNCH_DELAY_MIN + Math.random() * (LAUNCH_DELAY_MAX - LAUNCH_DELAY_MIN);
            const rocketData = {
                x: point.x + (Math.random() - 0.5) * 2 * offset.x,
                y: point.y + (Math.random() - 0.5) * 2 * offset.y,
                sparksMin: Math.ceil( Math.max(9, sparks * 0.75) ),
                sparksMax: Math.ceil( Math.max(12, sparks * 1.25) ),
            };
            this.pendingLaunches.push({ timer: delay, data: rocketData });
        }

        if (this.pendingLaunches.length > 0) tickerAdd(this)
    }

    _spawnRocket({ x, y, sparksMin, sparksMax }) {
        const rocket = this.pool.pop();
        if (!rocket) return;

        rocket.x = x;
        rocket.y = y;
        rocket.scaleX = ROCKET_SIZE;
        rocket.scaleY = ROCKET_SIZE;
        rocket.alpha = 1.0;
        rocket.tint = 0xffdd00;

        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
        const speed = ROCKET_SPEED * (0.9 + Math.random() * 0.3);

        rocket.data = {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            exploded: false,
            trailTimer: 0,
            explosionColor: COLORS[Math.floor(Math.random() * COLORS.length)],
            noiseOffset: Math.floor(Math.random() * NOISE_BUFFER_SIZE),
            sparksMin,
            sparksMax
        };

        this.container.addParticle(rocket);
        this.rockets.push(rocket);
    }

    _explodeRocket(rocket, isSecondary = false) {
        const data = rocket.data;
        const count = isSecondary
            ? Math.floor(data.sparksMin * 0.3)
            : Math.floor(data.sparksMin + Math.random() * (data.sparksMax - data.sparksMin));

        const clusters = isSecondary ? 2 : (4 + Math.floor(Math.random() * 5));
        const baseAngles = [];
        for (let c = 0; c < clusters; c++) {
            baseAngles.push(Math.random() * _2PI);
        }

        for (let i = 0; i < count; i++) {
            const p = this.pool.pop();
            if (!p) break;

            const clusterAngle = baseAngles[Math.floor(Math.random() * baseAngles.length)];
            const spread = 0.4 + Math.random() * 0.6;
            const angle = clusterAngle + (Math.random() - 0.5) * spread;

            const speed = EXPLOSION_SPEED * (0.6 + Math.random() * 1.2);
            let size = EXPLOSION_SIZE_MIN + Math.random() * (EXPLOSION_SIZE_MAX - EXPLOSION_SIZE_MIN);
            p.x = rocket.x;
            p.y = rocket.y;
            p.tint = data.explosionColor;

            let dx = Math.cos(angle);
            let dy = Math.sin(angle);
            dx *= (0.9 + Math.random() * 0.3);
            dy *= (0.9 + Math.random() * 0.3);

            const mass = 0.5 + Math.random() * 1.5;
            const gravityScale = mass * (0.7 + Math.random() * 0.6);
            const deceleration = 0.96 - mass * 0.02;
            const alphaDecay = ALPHA_DECAY_EXPLOSION * (0.6 + mass * 0.5);

            // 🌟 Ядро взрыва (первые 20% частиц) – крупнее и ярче
            if (i < count * 0.2) {
                size *= 1.8;
                p.alpha = 1.0;
            } else {
                p.alpha = 0.8 + Math.random() * 0.2;
            }

            p.scaleX = size;
            p.scaleY = size;

            p.data = {
                dx, dy,
                speed: speed * (0.7 + mass * 0.4),
                mass: mass,
                gravity: GRAVITY * gravityScale,
                deceleration: Math.min(0.99, Math.max(0.92, deceleration)),
                alphaDecay: alphaDecay,
                turnSpeed: 0.008 + Math.random() * 0.01,
                noiseOffset: Math.floor(Math.random() * NOISE_BUFFER_SIZE),
                isExplosionParticle: true,
                explosionColor: data.explosionColor,
                sparksMin: data.sparksMin,
                sparksMax: data.sparksMax
            };

            this.container.addParticle(p);
            this.particles.push(p);
        }
    }

    tick(deltaMs) {
        const scaledDelta = deltaMs * timeScale;

        // 1. Отложенные запуски
        for (let i = this.pendingLaunches.length - 1; i >= 0; i--) {
            const item = this.pendingLaunches[i];
            item.timer -= scaledDelta;
            if (item.timer <= 0) {
                this._spawnRocket(item.data);
                this.pendingLaunches.splice(i, 1);
            }
        }

        // 2. Ракеты
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];
            const data = r.data;

            if (data.exploded) {
                this.container.removeParticle(r);
                r.tint = 0xffffff;
                this.pool.push(r);
                this.rockets.splice(i, 1);
                continue;
            }

            data.vx *= 0.999;
            data.vy *= 0.999;
            data.vy += ROCKET_GRAVITY * scaledDelta;

            r.x += data.vx * scaledDelta;
            r.y += data.vy * scaledDelta;

            // 💨 След (разделение на дым и искры)
            data.trailTimer += scaledDelta;
            if (data.trailTimer > 20) {
                data.trailTimer = 0;
                const dirX = -data.vx;
                const dirY = -data.vy;
                const len = Math.sqrt(dirX*dirX + dirY*dirY) || 1;
                const normX = dirX / len;
                const normY = dirY / len;

                for (let j = 0; j < TRAIL_COUNT; j++) {
                    const trail = this.pool.pop();
                    if (!trail) break;

                    const offsetX = (Math.random() - 0.5) * 8;
                    const offsetY = (Math.random() - 0.5) * 8;
                    trail.x = r.x + offsetX;
                    trail.y = r.y + offsetY;
                    trail.scaleX = TRAIL_SIZE;
                    trail.scaleY = TRAIL_SIZE;

                    const isSmoke = Math.random() < 0.5;  // 50% дым, 50% искры
                    if (isSmoke) {
                        // Дым: большой, полупрозрачный, сероватый
                        trail.alpha = 0.12 + Math.random() * 0.1;
                        trail.tint = 0xaaaaaa;
                        trail.scaleX *= 2.5 + Math.random() * 1.5;
                        trail.scaleY *= 2.5 + Math.random() * 1.5;
                        trail.data = {
                            dx: normX * 0.02 + (Math.random() - 0.5) * 0.01,
                            dy: normY * 0.02 + (Math.random() - 0.5) * 0.01,
                            speed: 0.05 + Math.random() * 0.04,
                            gravity: -0.00002,
                            deceleration: 0.93,
                            alphaDecay: 0.002 + Math.random() * 0.001,
                            turnSpeed: 0.03,
                            noiseOffset: Math.floor(Math.random() * NOISE_BUFFER_SIZE),
                        };
                    } else {
                        // Искры: маленькие, яркие
                        trail.alpha = 0.85 + Math.random() * 0.15;
                        trail.tint = 0xffcc44;
                        trail.scaleX *= 0.3 + Math.random() * 0.4;
                        trail.scaleY *= 0.3 + Math.random() * 0.4;
                        trail.data = {
                            dx: normX * 0.12 + (Math.random() - 0.5) * 0.06,
                            dy: normY * 0.12 + (Math.random() - 0.5) * 0.06,
                            speed: 0.2 + Math.random() * 0.15,
                            gravity: 0.00025,
                            deceleration: 0.87,
                            alphaDecay: 0.006 + Math.random() * 0.004,
                            turnSpeed: 0.08,
                            noiseOffset: Math.floor(Math.random() * NOISE_BUFFER_SIZE),
                        };
                    }

                    this.container.addParticle(trail);
                    this.particles.push(trail);
                }
            }

            const nearEdgeX = r.x < this.minX + this.explodeMarginX || r.x > this.maxX - this.explodeMarginX;
            const nearEdgeY = r.y < this.minY + this.explodeMarginY || r.y > this.maxY - this.explodeMarginY;
            const isFalling = data.vy > 0.05;

            if (nearEdgeX || nearEdgeY || isFalling) {
                this._explodeRocket(r, false);
                data.exploded = true;
            }
        }

        // 3. Частицы взрывов и следа
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const data = p.data;

            p.x += data.dx * data.speed * scaledDelta;
            p.y += data.dy * data.speed * scaledDelta;
            data.dy += data.gravity * scaledDelta;
            data.speed *= data.deceleration;

            if (data.dy > 0 && data.isExplosionParticle) {
                data.dx *= 0.995;
            }

            if (data.speed < data.turnSpeed) {
                const idx = (data.noiseOffset + 3) & NOISE_MASK;
                const jitter = NOISE_BUFFER[idx] * 0.02;
                data.dx += jitter;
                data.dy += jitter;
            }

            p.alpha = Math.max(0, p.alpha - data.alphaDecay * scaledDelta);

            // Вторичный взрыв (редко)
            if (data.isExplosionParticle && !data.secondaryTriggered && Math.random() < 0.003 * scaledDelta / 16) {
                data.secondaryTriggered = true;
                const fakeRocket = {
                    x: p.x,
                    y: p.y,
                    data: {
                        explosionColor: data.explosionColor,
                        sparksMin: Math.ceil(data.sparksMin * 0.4),
                        sparksMax: Math.ceil(data.sparksMax * 0.6)
                    }
                };
                this._explodeRocket(fakeRocket, true);
            }

            if (p.alpha <= 0.01 || data.speed <= 0.001 ||
                p.x < this.minX || p.x > this.maxX ||
                p.y < this.minY || p.y > this.maxY) {

                this.container.removeParticle(p);
                p.tint = 0xffffff;
                this.pool.push(p);
                this.particles[i] = this.particles[this.particles.length - 1];
                this.particles.pop();
            }
        }

        if (this.rockets.length === 0 && this.particles.length === 0 && this.pendingLaunches.length === 0) {
            tickerRemove(this);
        }
    }

    kill() {
        EventHub.off(events.launchFirework, this.launch, this);
        tickerRemove(this);
        if (this.container) {
            if (this.container.parent) this.container.parent.removeChild(this.container)
            this.container.destroy({ children: true });
            this.container = null;
        }
        this.pool.length = 0;
        this.particles.length = 0;
        this.rockets.length = 0;
        this.pendingLaunches.length = 0;
    }
}