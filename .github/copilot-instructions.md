
# Copilot Instructions for Sea Fling: Captain's Defense

## Project Overview
- **Single-file HTML5/JS game**: All game logic, UI, and styles are in `index.html`.
- **Game type**: Top-down naval defense with upgrade/crew/AI mechanics and wave-based progression.
- **No build system**: Open `index.html` directly in a browser to play and develop.

## Key Architecture & Patterns
- **Game loop**: Driven by `requestAnimationFrame(gameLoop)`. All state and rendering are managed in JS within the HTML file.
- **State**: Main state objects are `ship`, `enemies`, `projectiles`, `particles`, and UI flags (`gameActive`, `inPort`, etc.).
- **Entities**: Classes for `Projectile`, `Enemy`, `Particle`, and `Splash` encapsulate game objects.
- **UI**: DOM elements (menus, overlays, HUD) are manipulated directly via JS. TailwindCSS is loaded via CDN for utility classes.
- **Upgrades/Shop**: `SHOP_ITEMS` array defines all upgradable items and their effects. Shop UI is generated dynamically.
- **AI**: Captain and crew logic are handled in `updateCaptain()` and `updateCrewLogistics()`.
- **Audio**: Uses Web Audio API, initialized on user interaction for compatibility.

## Developer Workflows
- **Edit/Debug**: Edit `index.html` and refresh browser. No build, test, or deployment scripts.
- **No external dependencies**: All logic is self-contained except for TailwindCSS and Google Fonts via CDN.
- **No module system**: All code is in the global scope of the HTML file.

## Project-Specific Conventions
- **Game state is reset via `resetGame()`**; starting a new game or returning to menu resets all state.
- **Wave progression**: `startNextWave()` and `spawnWave()` manage enemy spawning and boss logic.
- **Touch and mouse input**: Unified drag/flick logic for both desktop and mobile.
- **AI/automation**: Captain and crew AI are always active if unlocked; no manual override.
- **Shop pricing**: Upgrade costs increase by 20% after each purchase.

## Examples
- **Add a new upgrade**: Extend `SHOP_ITEMS` and implement its `action`.
- **Change enemy behavior**: Edit the `Enemy` class methods.
- **Modify UI**: Update HTML structure or JS DOM manipulation code.

## Integration Points
- **No server/backend**: Purely client-side.
- **No persistent storage**: All progress is lost on reload.

## Key File
- [`index.html`](../index.html): All code, styles, and markup.

---

**For AI agents:**
- Always update `index.html` directly.
- Follow the single-file pattern; do not split code into modules/files.
- Use browser refresh for testing; no CLI or build commands are needed.
- Reference and extend existing patterns for upgrades, AI, and UI.
