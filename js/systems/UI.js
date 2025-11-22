// UI system for Sea Fling Defense
import { GameState } from '../state.js';
import { updateShipStats } from '../entities/Ship.js';

// ... (Keep SHOP_ITEMS array exactly as it is) ...
const SHOP_ITEMS = [
    // ... keep existing items ...
    { id: 'crew', name: 'Crew', cost: 150, icon: '🏴‍☠️', type: 'upgrade', action: () => {
        GameState.ship.crew++; return true;
    }},
    { id: 'bilge', name: 'Bilge Pump', cost: 300, icon: '🪣', type: 'upgrade', action: () => {
        GameState.ship.bilgeLevel++; return true;
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

export function updateHUD() {
    document.getElementById('goldDisplay').innerText = GameState.gold;
    document.getElementById('hpDisplay').innerText = Math.floor(GameState.ship.hp);
    document.getElementById('crewDisplay').innerText = GameState.ship.crew;
    
    const hpEl = document.getElementById('hpDisplay');
    hpEl.style.color = (GameState.ship.hp < 30) ? 'red' : '#f87171';
}

// --- NEW EXPORT ---
export function addGold(amount) {
    GameState.gold += amount;
    updateHUD();
    // Update port display if we are in port
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
            countHTML = `<div class="owned-count">${val}</div>`; 
        }

        btn.innerHTML = `${countHTML}<div class="shop-icon">${item.icon}</div><div class="shop-name">${item.name}</div><div class="price">${item.cost}g</div>`;
        
        let isDisabled = GameState.gold < item.cost;
        if(item.id === 'ship' && GameState.ship.tier >= 3) isDisabled = true;
        if(item.id === 'captain' && GameState.ship.hasCaptain) isDisabled = true;
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
    if (GameState.gold >= item.cost) {
        if (item.action()) {
            addGold(-item.cost); // Reuse addGold logic
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