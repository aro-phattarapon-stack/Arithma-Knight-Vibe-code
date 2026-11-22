# Game Specification: Arithma Knight (Arithma Knights)

**Original Concept & Design:** Phattarapon Kakad (Group 16)  
**Genre:** Turn-based Tactical RPG / Dungeon Crawler  
**Engine & Tech:** HTML5 Canvas + Vanilla JavaScript (ES Modules) + HTML/CSS UI Overlay  
**Logical Canvas Resolution:** 1920 × 1080 (16:9 Aspect Ratio)

---

## 1. Game Overview & Concept
*Arithma Knight* is a turn-based dungeon crawler that transforms mathematical logic into strategic fantasy combat mechanics. Rather than presenting math as passive educational trivia, the game reinterprets arithmetic as an active tactical arsenal and a shared resource that players manage directly each round.

Players command a party of **four companion knights**, each bound to a fundamental arithmetic operator, navigating through a perilous 6-stage dungeon against hostile numerical anomalies.

---

## 2. Core Gameplay Loop

### Encounter & Stage Progression
- **Campaign Gauntlet:** 6 progressive stages (Stages 1–6), culminating in a climactic boss encounter at Stage 6.
- **Victory Condition:** Reduce the HP of all active enemies to 0 across all 6 stages.
- **Defeat Condition:** Total party wipeout (all 4 hero units reach 0 HP).

### 3-Phase Round Structure
Each combat round executes in three distinct phases:

1. **Roll Phase:**
   - A shared randomized number pool (4 numbers) is rolled and placed into the pool tray.
2. **Player Planning Phase (3 Action Points [AP]):**
   - The party is granted a fixed budget of **3 AP** per round.
   - Performing an action costs 1 AP.
   - **3-Step Action Control:**
     1. Select a number from the shared pool.
     2. Assign that number to an available hero (locking that hero's action slot for the turn).
     3. Select a target (enemy or ally depending on hero capability).
   - Real-time calculation previews display projected damage, heals, or multiplier buffs.
   - **End Turn:** The player may click "End Turn" at any time or automatically proceed when AP reaches 0. Unselected numbers in the pool are discarded.
3. **Enemy Execution Phase:**
   - Surviving enemies evaluate living heroes and execute their retaliation attacks.
   - Combat event log updates sequentially.

---

## 3. Party Roster & Mathematical Roles

| Hero Unit | Operator | Combat Role & Tactical Effect |
| :--- | :---: | :--- |
| **Knight** | **$-$** *(Subtraction)* | **Direct Striker:** Deals damage by subtracting the held number directly from the target enemy's current HP. |
| **Berserker** | **$/$** *(Division)* | **Heavy Buster:** Deals massive damage by dividing the target enemy's current HP by the held number (rounded appropriately). |
| **Cleric** | **$+$** *(Addition)* | **Healer:** Uses addition to restore a targeted ally's HP based on the held number. |
| **Paladin** | **$\times$** *(Multiplication)* | **Empowerer / Buffer:** Starts with a $\times 1$ multiplier, increasing by $+1$ each round (up to $\times 3$). Multiplies an ally's held number to magnify their action. |

---

## 4. Strict Architecture & Engineering Rules

### 1. Zero Heavy Engines
- Pure **HTML5 Canvas (2D Context)** + **Vanilla JavaScript (ES Modules)**.
- No Phaser, PixiJS, Three.js, or similar bloated frameworks.

### 2. Strict UI Separation (No Canvas Text/HUD)
- **Canvas is strictly a visual renderer** for backgrounds, characters, animations, and combat particle effects.
- **NEVER** draw menus, buttons, action bars, or HUD text directly onto the Canvas.
- All UI overlays (Start Menu, Action Point counter, Hero cards, Number pool tray, End Turn button, Pause menu, Game Over / Victory screens, and the Retro Combat Log) must be built with **HTML/CSS** and managed exclusively through `src/ui/HUD.js`.

### 3. No Magic Numbers
- All tunable gameplay parameters (speeds, sizes, colors, logical resolution, max AP, stage rosters, timers, multipliers) must reside inside `src/config.js`.

### 4. Separation of Concerns & Folder Structure
```
d:/ArithmaKnight_Vibecode/
├── docs/
│   └── GAME_SPEC.md            # Master game design & technical specifications
├── index.html                  # Container for Canvas and DOM UI overlays
├── style.css                   # Responsive layout, retro aesthetic, canvas centering
└── src/
    ├── config.js               # Central immutable configuration & tunables
    ├── main.js                 # Entry point bootstrapping the Game
    ├── core/
    │   ├── Game.js             # Main loop (requestAnimationFrame), state machine, reset()
    │   └── Input.js            # Unified keyboard, mouse, and touch event tracking
    ├── entities/
    │   ├── Player.js           # Player entity (used for greybox & knight representations)
    │   ├── Hero.js             # Companion hero class (Knight, Berserker, Cleric, Paladin)
    │   └── Enemy.js            # Numerical anomaly enemy classes
    ├── systems/
    │   ├── CombatSystem.js     # Turn evaluation, math calculations, AP budget tracking
    │   ├── StageManager.js     # Stage progression (1–6) & enemy spawner
    │   └── ParticleSystem.js   # Canvas visual feedback (sparks, numbers, slashes)
    └── ui/
        └── HUD.js              # DOM UI binder & event dispatcher
```

### 5. Technical Guardrails
1. **Delta Time Handling:**
   - Movement, timers, and animations must rely on `deltaTime` in seconds.
   - Capped at `0.05` to prevent frame-spike clipping:
     ```javascript
     const dt = Math.min((now - lastTime) / 1000, CONFIG.MAX_DELTA_TIME);
     ```
2. **Safe Entity Removal:**
   - Never `.splice()` inside a forward `for` loop.
   - Entities flag `markedForDeletion = true` and are pruned at the end of the update phase:
     ```javascript
     this.entities = this.entities.filter(entity => !entity.markedForDeletion);
     ```
3. **Resolution & Scaling:**
   - Canvas internal coordinates stay fixed at **1920 × 1080**.
   - Visually scaled via CSS with `max-width: 100%`, `max-height: 100%`, and `aspect-ratio: 16 / 9`, centered within the viewport.
   - Coordinate translation from screen mouse/touch events to logical 1920x1080 space is handled strictly inside `Input.js`.

---

## 5. Development Status & Implemented Systems

- [x] **Phase 1: Skeleton & Architecture**
  - Logical 1920x1080 canvas with responsive 16:9 viewport, delta-time normalization, zero external dependencies.
- [x] **Phase 2: Strict HTML/CSS UI Overlay & State Machine**
  - HUD overlay separated from Canvas rendering via `src/ui/HUD.js`, state handling (`TITLE`, `PLAYING`, `ENEMY_PHASE`, `STAGE_CLEAR`, `GAME_OVER`, `VICTORY`, `PAUSED`).
- [x] **Phase 3: Turn-Based Foundation & Shared Number Pool**
  - 3 AP budget per round, shared 4-number pool generation, free equip mechanics (0 AP), manual End Turn button.
- [x] **Phase 4: The 4 Knights & Tactical Arithmetic Combat**
  - Knight ($-$ Subtraction), Berserker ($/$ Division), Cleric ($+$ Addition), Paladin ($\times$ Multiplier charge & buff).
  - Real-time calculation previews, color-coded Battle Chronicle log.
- [x] **Phase 5: 6-Stage Dungeon Campaign & Boss Encounters**
  - Escalating counting-value anomalies across Stages 1–4.
  - Negative Number Entities (Stages 3 & 4): **Negabat** (-24 HP) & **Negabat Prime** (-36 HP), shadowy flying chiropters whose negative debt worsens from subtraction, requiring Berserker ($/$) division to shrink and Cleric ($+$) addition to restore to exactly 0 HP.
  - Stage 5 Boss: **Big Int** (colossal 1,024 HP binary titan, susceptible to Paladin + Berserker division combos).
  - Stage 6 Final Boss: **Factorio** (climactic factorial anomaly starting at 6! = 720 HP and collapsing sequentially into 5! ➔ 4! ➔ 3! ➔ 2! ➔ 1! ➔ 0 upon each defeat).
  - Official scoring formula: `max(0, (StageNumber * 1000) + (SumOfLivingHeroesHP * 10) - (RoundsTaken * 50))`.
- [x] **Phase 6: Audio Synthesizer & Particle Systems**
  - Procedural Web Audio API sound effects for slashes, division cleaves, healing chimes, and fanfare.
  - Particle System featuring floating combat numbers, dungeon torches, ambient flame embers, and magical spells.
- [x] **Phase 7: Stage Select & Enemy Bestiary Intelligence**
  - Main Menu integration with "SELECT STAGE".
  - Dedicated Overworld Map featuring 6 territory nodes, living atmospheric canvas, and parchment briefing scroll.
  - Full enemy intelligence display: Name, Title, Glyph, HP, ATK, and procedural canvas creature rendering.
  - Progressive unlock system with localStorage persistence and quick unlock toggle.
- [x] **Phase 8: Roguelike Mathematical Axioms & Theorems System**
  - Sanctum of Mathematical Axioms draft modal presented upon clearing Stages 1–5.
  - 3-card draft of unpicked theorems (Vitality Constant, Zero Barrier, Calculus AP Booster, Rebirth Formula, Euclidean Blade, Harmonic Resonance, Prime Cleave, Exponential Zeal, Infinity Number Well, Pythagorean Bulwark).
  - Canvas visuals for Zero Barrier hex-shield and Active Axioms ledger on Battle HUD.
