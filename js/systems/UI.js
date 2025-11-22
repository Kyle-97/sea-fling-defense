// UI system for Sea Fling Defense
import { GameState } from '../state.js';
import { updateShipStats, getMainCannonStats } from '../entities/Ship.js';

const SHOP_ITEMS = [
    { id: 'repair', name: 'Repair', cost: 50, icon: '🔧', type: 'consumable', action: () => {
        if (GameState.ship.hp < GameState.ship.maxHp) {
            GameState.ship.hp = Math.min(GameState.ship.hp + 25, GameState.ship.maxHp);
            updateHUD();
            return true;
        }
        return false;
    }},
    { id: 'standard', name: 'Std. Shot', cost: 0, icon: '⚪', type: 'ammo', action: () => {
        GameState.ship.ammo = 'standard';
        spawnFloatingText(GameState.ship.x, GameState.ship.y, "Standard Equipped", "#fff");
        return true; 
    }},
    { id: 'heavy', name: 'Heavy Shot', cost: 500, icon: '⚫', type: 'ammo', action: () => {
        if(!GameState.ship.unlockedAmmo.includes('heavy')) {
            GameState.ship.unlockedAmmo.push('heavy');
        }
        GameState.ship.ammo = 'heavy';
        spawnFloatingText(GameState.ship.x, GameState.ship.y, "Heavy Equipped", "#fff");
        return true; 
    }},
    { id: 'grape', name: 'Grape Shot', cost: 600, icon: '🍇', type: 'ammo', action: () => {
        if(!GameState.ship.unlockedAmmo.includes('grape')) {
            GameState.ship.unlockedAmmo.push('grape');
        }
        GameState.ship.ammo = 'grape';
        spawnFloatingText(GameState.ship.x, GameState.ship.y, "Grape Equipped", "#fff");
        return true; 
    }},
    { id: 'crew', name: 'Crew', cost: 150, icon: '🏴‍☠️', type: 'upgrade', action: () => {
        GameState.ship.crew++; return true;
    }},
    { id: 'bilge', name: 'Bilge Pump', cost: 300, icon: '🪣', type: 'upgrade', action: () => {
        GameState.ship.bilgeLevel++; return true;
    }},
    { id: 'maingun', name: 'Main Gun', cost: 500, icon: '☄️', type: 'upgrade', action: () => {
        if(GameState.ship.mainCannonLevel < 3) { GameState.ship.mainCannonLevel++; return true; }
        return false;
    }},
    { id: 'cannon', name: 'Cannon', cost: 250, icon: '💣', type: 'upgrade', action: () => {
        const emptySlot = GameState.ship.slots.findIndex((s, i) => s.type === 'cannon' && !GameState.ship.cannons.some(c => c.slotIndex === i));
        if (emptySlot !== -1) { GameState.ship.cannons.push({ loaded: 0, slotIndex: emptySlot }); return true; }
        return false;
    }},
    { id: 'swivel', name: 'Swivel Gun', cost: 400, icon: '🔭', type: 'upgrade', action: () => {
        const emptySlot = GameState.ship.slots.findIndex((s, i) => s.type === 'swivel' && !GameState.ship.cannons.some(c => c.slotIndex === i));
        if (emptySlot !== -1) { GameState.ship.cannons.push({ loaded: 0, slotIndex: emptySlot }); return true; }
        return false;
    }},
    { id: 'captain', name: 'Captain', cost: 800, icon: '🧑‍✈️', type: 'unique', action: () => {
        if(!GameState.ship.hasCaptain) { GameState.ship.hasCaptain = true; return true; }
        return false;
    }},
    { id: 'ship', name: 'Upgr. Ship', cost: 1200, icon: '🚢', type: 'upgrade', action: () => {
        if(GameState.ship.tier < 3) { GameState.ship.tier++; updateShipStats(); return true; }
        return false;
    }}
];

// --- FIX: Store Base Costs ---
SHOP_ITEMS.forEach(item => item.baseCost = item.cost);

export function resetShopCosts() {
    SHOP_ITEMS.forEach(item => {
        item.cost = item.baseCost;
    });
}
// -----------------------------

export function updateHUD() {
    document.getElementById('goldDisplay').innerText = GameState.gold;
    document.getElementById('hpDisplay').innerText = Math.floor(GameState.ship.hp);
    document.getElementById('crewDisplay').innerText = GameState.ship.crew;
    
    const hpEl = document.getElementById('hpDisplay');
    hpEl.style.color = (GameState.ship.hp < 30) ? 'red' : '#f87171';
    
    updateInGameAmmoUI(); // Update ammo buttons whenever HUD updates
}

// --- Manage In-Game Ammo Switcher ---
export function updateInGameAmmoUI() {
    const container = document.getElementById('ammoControls');
    if (!GameState.gameActive || GameState.inMenu || GameState.inPort) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    container.innerHTML = ''; 
    
    const ammoTypes = [
        { id: 'standard', label: 'Standard', icon: '⚪' },
        { id: 'heavy', label: 'Heavy', icon: '⚫' },
        { id: 'grape', label: 'Grape', icon: '🍇' }
    ];
    
    ammoTypes.forEach(type => {
        if (GameState.ship.unlockedAmmo.includes(type.id)) {
            const btn = document.createElement('div');
            btn.className = 'ammo-btn';
            if (GameState.ship.ammo === type.id) btn.classList.add('active-ammo');
            
            btn.innerHTML = `${type.icon} ${type.label}`;
            
            btn.onclick = (e) => {
                e.stopPropagation(); 
                if (GameState.ship.ammo !== type.id) {
                    switchAmmoInGame(type.id);
                }
            };
            container.appendChild(btn);
        }
    });
}

function switchAmmoInGame(newType) {
    GameState.ship.ammo = newType;
    const newStats = getMainCannonStats();
    
    // Apply 3x Reload Speed Penalty
    GameState.lastFireTime = Date.now() + (newStats.cooldown * 2); 
    
    spawnFloatingText(GameState.ship.x, GameState.ship.y - 60, "SWAPPING AMMO...", "#fcd34d");
    updateHUD();
}

export function addGold(amount) {
    GameState.gold += amount;
    updateHUD();
    if(GameState.inPort) {
        document.getElementById('portGold').innerText = GameState.gold;
        initShop();
    }
}

export function initShop() {
    const grid = document.getElementById('shopGrid');
    grid.innerHTML = '';
    SHOP_ITEMS.forEach(item => {
        const btn = document.createElement('div');
        btn.className = 'shop-btn';
        
        let countHTML = '';
        if(item.type === 'upgrade') { 
            let val = 0;
            if(item.id === 'cannon') val = GameState.ship.cannons.filter(c => GameState.ship.slots[c.slotIndex].type === 'cannon').length;
            if(item.id === 'swivel') val = GameState.ship.cannons.filter(c => GameState.ship.slots[c.slotIndex].type === 'swivel').length;
            if(item.id === 'crew') val = GameState.ship.crew;
            if(item.id === 'ship') val = GameState.ship.tier;
            if(item.id === 'bilge') val = GameState.ship.bilgeLevel;
            if(item.id === 'maingun') val = GameState.ship.mainCannonLevel; 
            countHTML = `<div class="owned-count">${val}</div>`; 
        }

        let label = item.name;
        let price = item.cost + 'g';
        
        if (item.type === 'ammo') {
            if (GameState.ship.ammo === item.id) {
                btn.style.borderColor = '#22c55e'; 
                price = "EQUIPPED";
            } else if (GameState.ship.unlockedAmmo.includes(item.id)) {
                 price = "OWNED"; 
            }
        }

        btn.innerHTML = `${countHTML}<div class="shop-icon">${item.icon}</div><div class="shop-name">${label}</div><div class="price">${price}</div>`;
        
        let isDisabled = false;
        if (item.type === 'ammo') {
             if (GameState.ship.ammo === item.id) isDisabled = true;
             else if (!GameState.ship.unlockedAmmo.includes(item.id) && GameState.gold < item.cost) isDisabled = true;
        } else {
             if (GameState.gold < item.cost) isDisabled = true;
        }

        if(item.id === 'ship' && GameState.ship.tier >= 3) isDisabled = true;
        if(item.id === 'captain' && GameState.ship.hasCaptain) isDisabled = true;
        if(item.id === 'maingun' && GameState.ship.mainCannonLevel >= 3) isDisabled = true;
        if(item.id === 'repair' && GameState.ship.hp >= GameState.ship.maxHp) isDisabled = true;

        if(item.id === 'cannon' || item.id === 'swivel') {
            const hasSlot = GameState.ship.slots.some((s, i) => s.type === item.id && !GameState.ship.cannons.some(c => c.slotIndex === i));
            if(!hasSlot) isDisabled = true;
        }
        
        if(isDisabled) btn.classList.add('disabled');
        else btn.onclick = () => purchase(item);
        
        grid.appendChild(btn);
    });
}

function purchase(item) {
    if (item.type === 'ammo') {
        if (GameState.ship.unlockedAmmo.includes(item.id)) {
            item.action();
            initShop();
            return;
        }
    }

    if (GameState.gold >= item.cost) {
        if (item.action()) {
            addGold(-item.cost); 
            if (item.type === 'upgrade' || item.type === 'unique') {
                item.cost = Math.floor(item.cost * 1.2);
            }
            initShop(); 
        }
    }
}

export function spawnFloatingText(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'floating-text'; el.innerText = text; 
    el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.color = color;
    document.body.appendChild(el); 
    setTimeout(() => el.remove(), 1000);
}