// Particle entity definition
// Copy Particle and Splash classes here
export class Particle {
    constructor(x, y, color, speed = 2) {
        this.x = x; this.y = y; 
        this.vx = (Math.random() - 0.5) * speed; 
        this.vy = (Math.random() - 0.5) * speed; 
        this.life = 1.0; this.color = color; 
        this.size = Math.random() * 2 + 1;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.05; }
}

export class Splash {
    constructor(x, y) { this.x = x; this.y = y; this.life = 1.0; this.radius = 0; }
    update() { this.life -= 0.03; this.radius += 1.5; }
}