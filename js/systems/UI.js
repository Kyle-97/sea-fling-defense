// UI system for Sea Fling Defense
import { GameState } from '../state.js';
import { updateShipStats } from '../entities/Ship.js';

export function updateHUD() {
    document.getElementById('goldDisplay').innerText = GameState.gold;
    document.getElementById('hpDisplay').innerText = Math.floor(GameState.ship.hp);
    // ...
}

export function initShop() {
    const grid = document.getElementById('shopGrid');
    grid.innerHTML = '';
    // ... Shop generation logic using SHOP_ITEMS array ...
}