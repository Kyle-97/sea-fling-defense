# Sea Fling Defense - Architecture Context

## Project Structure
- **Modular ES6 Architecture**: No global variables in `window`. All state is centralized.
- **Rendering**: Decoupled from logic. Entities update data; `Renderer.js` draws it.

## File Responsibilities

### Core
- `js/main.js`: The game loop (`requestAnimationFrame`), initialization, and wave logic.
- `js/state.js`: **SINGLE SOURCE OF TRUTH**. Contains `GameState` object (ship, enemies array, gold, input state).
- `js/constants.js`: Magic numbers (Sea color, spawn rates, ship speed, damage values).

### Entities (Logic Only - No Canvas Calls)
- `js/entities/Ship.js`: Ship stats, upgrade logic, captain AI, and `takeShipDamage()`.
- `js/entities/Enemy.js`: Movement patterns (Raft/Gunboat/Boss), collision logic, and `takeDamage()`.
- `js/entities/Projectile.js`: Physics (gravity/velocity) and collision detection.
- `js/entities/Particle.js`: Visual effects data (life, color, velocity).

### Systems (IO & Presentation)
- `js/systems/Renderer.js`: **ALL** Canvas `ctx` calls go here. Stateless (reads `GameState`).
- `js/systems/Input.js`: Handles Mouse/Touch events. Updates `GameState.dragStartPos` & `isDraggingAmmo`.
- `js/systems/Audio.js`: WebAudioContext wrapper. Exports `playBoom`, `playSplash`, etc.
- `js/systems/UI.js`: DOM manipulation for HUD, Shop generation, and `addGold()`.

## Key Patterns
1. **Loop**: `main.js` calls `Entity.update()` -> then `Renderer.drawGame()`.
2. **Collision**: handled inside `Projectile.update()` or `Enemy.update()`.
3. **State Access**: Import `GameState` from `../state.js` to read/write data.