// Game state management for Sea Fling Defense
export const GameState = {
    gameActive: false,
    isPaused: false,
    inPort: false,
    inMenu: true,
    frameCount: 0,
    enemiesKilled: 0,
    
    gold: 0,
    wave: 1,
    enemiesToSpawn: 5,
    spawnTimer: 0,
    
    // --- Input State ---
    isDraggingAmmo: false,
    dragStartPos: { x: 0, y: 0, time: 0 },
    dragCurrentPos: { x: 0, y: 0 },
    
    // --- Reload State ---
    lastFireTime: 0, 
    // --------------------

    // Lists
    projectiles: [],
    enemies: [],
    particles: [],
    splashes: [],
    enemyProjectiles: [],
    
    // Ship Object (Singleton)
    ship: {
        x: 0, y: 0, 
        w: 60, h: 140, 
        rotation: 0, 
        hp: 100, maxHp: 100,
        tier: 1,
        slots: [], 
        cannons: [], 
        crew: 0,
        bilgeLevel: 0, 
        bilgeCrew: 0, 
        hasCaptain: false,
        
        // --- NEW MAIN CANNON STATE ---
        mainCannonLevel: 0, // Upgrade Level
        mainCannonCrew: 0,  // Current Crew assigned
        
        // --- AMMO SYSTEM ---
        ammo: 'standard',          // current equipped
        unlockedAmmo: ['standard'], // inventory
        // -------------------

        sinking: false,
        sinkProgress: 0,
        sinkAngle: 0
    },

    reset() {
        this.ship.hp = 100; 
        this.ship.maxHp = 100; 
        this.ship.tier = 1; 
        this.ship.cannons = []; 
        this.ship.crew = 0; 
        this.ship.bilgeLevel = 0; 
        this.ship.sinking = false; 
        this.ship.hasCaptain = false; 
        
        this.ship.mainCannonLevel = 0; 
        this.ship.mainCannonCrew = 0; 
        
        this.ship.ammo = 'standard';
        this.ship.unlockedAmmo = ['standard'];
        
        this.ship.rotation = 0;
        this.gold = 0; 
        this.wave = 1; 
        this.enemies = []; 
        this.projectiles = []; 
        this.enemyProjectiles = []; 
        this.particles = []; 
        this.splashes = []; 
        this.enemiesKilled = 0;
        this.gameActive = false; 
        this.isPaused = false; 
        this.inPort = false; 
        this.enemiesToSpawn = 5;
        this.inMenu = true;
        
        this.isDraggingAmmo = false;
        this.lastFireTime = 0;
    }
};