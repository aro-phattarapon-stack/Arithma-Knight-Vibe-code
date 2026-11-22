import { CONFIG } from '../config.js';
import { Hero } from '../entities/Hero.js';

/**
 * HUD Controller managing all HTML/CSS UI Overlays & Dedicated Screens.
 * STRICT RULE: Canvas is strictly for rendering world/characters/FX.
 * All menus, buttons, action bars, text, and logs reside in the DOM.
 *
 * PERFORMANCE & RELIABILITY GUARANTEE:
 * DOM elements are instantiated ONCE and updated in-place.
 * Elements are NEVER destroyed per frame so click/touch events never get dropped.
 */
export class HUD {
  /**
   * @param {HTMLElement} uiContainer
   */
  constructor(uiContainer) {
    this.container = uiContainer;

    // Screen Views
    this.titleScreen = this.container.querySelector('#title-screen');
    this.stageSelectScreen = this.container.querySelector('#stage-select-screen');
    this.gameplayHud = this.container.querySelector('#gameplay-hud');

    // Overworld Map Stage Select Elements
    this.stageMapBgCanvas = this.container.querySelector('#stage-map-bg-canvas');
    this.overworldNodesContainer = this.container.querySelector('#overworld-nodes-container');
    this.stageBriefingModalWrapper = this.container.querySelector('#stage-briefing-modal-wrapper');
    this.stageBriefingBackdrop = this.container.querySelector('#stage-briefing-backdrop');
    this.stageBriefingScroll = this.container.querySelector('#stage-briefing-scroll');
    this.partyRosterDock = this.container.querySelector('#party-roster-dock');
    this.heroFloatingDossier = this.container.querySelector('#hero-floating-dossier');
    this.heroDossierCanvas = this.container.querySelector('#hero-dossier-canvas');
    this.btnStageSelectBack = this.container.querySelector('#btn-stage-select-back');
    this.btnUnlockAll = this.container.querySelector('#btn-unlock-all');
    this.btnCloseBriefing = this.container.querySelector('#btn-close-briefing');
    this.btnBriefingDeploy = this.container.querySelector('#btn-briefing-deploy');
    this.btnCloseHeroDossier = this.container.querySelector('#btn-close-hero-dossier');
    this.btnBriefingPrev = this.container.querySelector('#btn-briefing-prev');
    this.btnBriefingNext = this.container.querySelector('#btn-briefing-next');
    this.btnRibbonPrev = this.container.querySelector('#btn-ribbon-prev');
    this.btnRibbonNext = this.container.querySelector('#btn-ribbon-next');
    this.territoryRibbonPills = this.container.querySelector('#territory-ribbon-pills');
    this.rosterPortraitBtns = this.container.querySelectorAll('.roster-portrait-btn');

    this.selectedStageNumber = 1;
    this.selectedHeroId = 'knight';
    this.cachedStages = null;
    this.cachedStageManager = null;
    this.mapBgAnimId = null;
    this.lastMapBgTime = 0;

    // Atmospheric Forest Living Background Fireflies (Option B)
    this.mapFireflies = [];
    for (let i = 0; i < 40; i++) {
      this.mapFireflies.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        size: 1.8 + Math.random() * 3.5,
        vx: (Math.random() - 0.5) * 16,
        vy: -10 - Math.random() * 20,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 1.4 + Math.random() * 2,
        color: Math.random() < 0.6 ? '#fbbf24' : (Math.random() < 0.5 ? '#6ee7b7' : '#fef08a'),
      });
    }

    // Standalone Hero entities used strictly for standing showcase rendering
    this.showcaseHeroes = {
      knight: new Hero(CONFIG.HEROES.KNIGHT),
      berserker: new Hero(CONFIG.HEROES.BERSERKER),
      cleric: new Hero(CONFIG.HEROES.CLERIC),
      paladin: new Hero(CONFIG.HEROES.PALADIN),
    };

    // Top HUD Bar Elements (Gameplay)
    this.stageTitleEl = this.container.querySelector('#hud-stage-title');
    this.stageDescEl = this.container.querySelector('#hud-stage-desc');
    this.roundEl = this.container.querySelector('#hud-round');
    this.apCrystalsEl = this.container.querySelector('#hud-ap-crystals');
    this.phaseBadgeEl = this.container.querySelector('#hud-phase-badge');
    this.scoreEl = this.container.querySelector('#hud-score');

    // Top Controls
    this.btnStages = this.container.querySelector('#btn-stages');
    this.btnMute = this.container.querySelector('#btn-mute');
    this.btnHelp = this.container.querySelector('#btn-help');
    this.btnPause = this.container.querySelector('#btn-pause');
    this.btnEndTurn = this.container.querySelector('#btn-end-turn');

    // Number Pool & Hero Cards Containers (Gameplay)
    this.numberPoolTray = this.container.querySelector('#number-pool-tray');
    this.heroCardsContainer = this.container.querySelector('#hero-cards-container');

    // Action Preview Tooltip
    this.actionPreviewEl = this.container.querySelector('#action-preview-tooltip');

    // Combat Log
    this.combatLogContainer = this.container.querySelector('#combat-log-entries');
    this.btnToggleLog = this.container.querySelector('#btn-toggle-log');
    this.combatLogWrapper = this.container.querySelector('#combat-log-wrapper');

    // In-Game Popups & Modals
    this.helpModal = this.container.querySelector('#help-modal');
    this.pauseModal = this.container.querySelector('#pause-modal');
    this.stageClearModal = this.container.querySelector('#stage-clear-modal');
    this.gameOverModal = this.container.querySelector('#game-over-modal');
    this.victoryModal = this.container.querySelector('#victory-modal');

    // Active Axioms Ledger & Draft Elements
    this.activeAxiomsLedger = this.container.querySelector('#active-axioms-ledger');
    this.activeAxiomsList = this.container.querySelector('#active-axioms-list');
    this.axiomDraftSection = this.container.querySelector('#axiom-draft-section');
    this.axiomDraftCards = this.container.querySelector('#axiom-draft-cards');
    this.axiomDraftHint = this.container.querySelector('#axiom-draft-hint');
    this.selectedAxiomId = null;
    this.hasActiveDraft = false;

    // Title / Main Menu Buttons
    this.btnStartGame = this.container.querySelector('#btn-start-game');
    this.btnTitleHelp = this.container.querySelector('#btn-title-help');
    this.btnCloseHelp = this.container.querySelector('#btn-close-help');

    // Pause Modal Buttons
    this.btnResume = this.container.querySelector('#btn-resume');
    this.btnPauseStageSelect = this.container.querySelector('#btn-pause-stage-select');
    this.btnPauseRestart = this.container.querySelector('#btn-pause-restart');
    this.btnPauseMenu = this.container.querySelector('#btn-pause-menu');

    // Stage Clear Buttons
    this.btnNextStage = this.container.querySelector('#btn-next-stage');
    this.btnClearStageSelect = this.container.querySelector('#btn-clear-stage-select');
    this.btnClearMenu = this.container.querySelector('#btn-clear-menu');

    // Game Over Buttons
    this.btnGameOverRestart = this.container.querySelector('#btn-game-over-restart');
    this.btnGameOverStageSelect = this.container.querySelector('#btn-gameover-stage-select');
    this.btnGameOverMenu = this.container.querySelector('#btn-gameover-menu');

    // Victory Buttons
    this.btnVictoryRestart = this.container.querySelector('#btn-victory-restart');
    this.btnVictoryStageSelect = this.container.querySelector('#btn-victory-stage-select');
    this.btnVictoryMenu = this.container.querySelector('#btn-victory-menu');

    // Persistent element registries
    this.heroCardElements = {};
    this.poolTileElements = [];
    this.apCrystalElements = [];

    // Callbacks to Game Controller
    this.callbacks = {};

    this._bindEvents();
    this._initAPCrystals();
    this._initNumberPoolTray();
  }

  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  _bindEvents() {
    // 1. Screen 1: Title Screen Buttons
    this.btnStartGame?.addEventListener('click', () => this.callbacks.onStartGame?.());
    this.btnTitleHelp?.addEventListener('click', () => this.showHelpModal(true));
    this.btnCloseHelp?.addEventListener('click', () => this.showHelpModal(false));

    // 2. Screen 2: Overworld Map Stage Select & Party Roster
    this.btnStageSelectBack?.addEventListener('click', () => this.callbacks.onGoToMainMenu?.());
    this.btnUnlockAll?.addEventListener('click', () => this.callbacks.onUnlockAllStages?.());

    const closeBriefingModal = () => {
      this.stageBriefingModalWrapper?.classList.add('hidden');
      this.stageBriefingScroll?.classList.add('hidden');
    };

    this.btnCloseBriefing?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeBriefingModal();
    });

    this.container.querySelector('#btn-briefing-close-footer')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeBriefingModal();
    });

    this.stageBriefingBackdrop?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeBriefingModal();
    });

    this.btnBriefingDeploy?.addEventListener('click', () => {
      if (this.cachedStageManager?.isStageUnlocked(this.selectedStageNumber)) {
        this.callbacks.onSelectStageDeploy?.(this.selectedStageNumber);
      }
    });

    const closeHeroDossier = () => {
      this.heroFloatingDossier?.classList.add('hidden');
      this.rosterPortraitBtns?.forEach((b) => b.classList.remove('active'));
    };

    this.btnCloseHeroDossier?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeHeroDossier();
    });

    // Territory Navigation (Previous / Next)
    const navigateStage = (delta) => {
      if (!this.cachedStages || this.cachedStages.length === 0) return;
      const total = this.cachedStages.length;
      const currentIdx = this.cachedStages.findIndex((s) => s.STAGE_NUMBER === this.selectedStageNumber);
      const nextIdx = (currentIdx + delta + total) % total;
      const nextStage = this.cachedStages[nextIdx];
      const isBriefingOpen = this.stageBriefingModalWrapper && !this.stageBriefingModalWrapper.classList.contains('hidden');
      this.selectAndInspectStage(nextStage.STAGE_NUMBER, isBriefingOpen);
    };

    this.btnBriefingPrev?.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateStage(-1);
    });

    this.btnBriefingNext?.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateStage(1);
    });

    this.btnRibbonPrev?.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateStage(-1);
    });

    this.btnRibbonNext?.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateStage(1);
    });

    // Keyboard navigation: Escape to close modals, Arrow keys to navigate stages
    window.addEventListener('keydown', (e) => {
      if (this.currentScreen === 'STAGE_SELECT') {
        if (e.key === 'Escape') {
          closeBriefingModal();
          closeHeroDossier();
        } else if (e.key === 'ArrowLeft') {
          navigateStage(-1);
        } else if (e.key === 'ArrowRight') {
          navigateStage(1);
        }
      }
    });

    // Clicking map background closes hero dossier if clicked outside
    this.container.querySelector('.overworld-map-viewport')?.addEventListener('click', (e) => {
      if (!e.target.closest('#party-roster-dock') && !e.target.closest('#hero-floating-dossier') && !e.target.closest('#stage-briefing-scroll') && !e.target.closest('#overworld-territory-ribbon')) {
        closeHeroDossier();
      }
    });

    this.rosterPortraitBtns?.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const heroId = e.currentTarget.getAttribute('data-hero');
        this.inspectHero(heroId);
      });
    });

    // 3. Screen 3: Gameplay Top Controls
    this.btnStages?.addEventListener('click', () => this.callbacks.onOpenStageSelect?.());
    this.btnMute?.addEventListener('click', () => this.callbacks.onToggleMute?.());
    this.btnPause?.addEventListener('click', () => this.callbacks.onTogglePause?.());
    this.btnHelp?.addEventListener('click', () => this.showHelpModal(true));
    this.btnResume?.addEventListener('click', () => this.callbacks.onTogglePause?.());

    // Pause Modal Actions
    this.btnPauseStageSelect?.addEventListener('click', () => this.callbacks.onOpenStageSelect?.());
    this.btnPauseRestart?.addEventListener('click', () => this.callbacks.onRestartStage?.());
    this.btnPauseMenu?.addEventListener('click', () => this.callbacks.onGoToMainMenu?.());

    // Stage Clear Actions
    this.btnEndTurn?.addEventListener('click', () => this.callbacks.onEndTurn?.());
    this.btnNextStage?.addEventListener('click', () => {
      if (this.hasActiveDraft && !this.selectedAxiomId) {
        this.axiomDraftHint?.classList.remove('hidden');
        this.axiomDraftHint?.classList.add('pulse-warn');
        this.axiomDraftCards?.classList.add('shake-cards');
        setTimeout(() => {
          this.axiomDraftCards?.classList.remove('shake-cards');
        }, 600);
        return;
      }
      this.callbacks.onNextStage?.();
    });
    this.btnClearStageSelect?.addEventListener('click', () => this.callbacks.onOpenStageSelect?.());
    this.btnClearMenu?.addEventListener('click', () => this.callbacks.onGoToMainMenu?.());

    // Game Over Actions
    this.btnGameOverRestart?.addEventListener('click', () => this.callbacks.onRestartStage?.());
    this.btnGameOverStageSelect?.addEventListener('click', () => this.callbacks.onOpenStageSelect?.());
    this.btnGameOverMenu?.addEventListener('click', () => this.callbacks.onGoToMainMenu?.());

    // Victory Actions
    this.btnVictoryRestart?.addEventListener('click', () => this.callbacks.onStartGame?.());
    this.btnVictoryStageSelect?.addEventListener('click', () => this.callbacks.onOpenStageSelect?.());
    this.btnVictoryMenu?.addEventListener('click', () => this.callbacks.onGoToMainMenu?.());

    // Chronicle toggle (collapse / expand)
    const toggleLog = () => {
      this.combatLogWrapper?.classList.toggle('collapsed');
      const isCollapsed = this.combatLogWrapper?.classList.contains('collapsed');
      if (this.btnToggleLog) {
        this.btnToggleLog.textContent = isCollapsed ? 'Chronicle ▲' : 'Chronicle ▼';
      }
    };
    this.btnToggleLog?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLog();
    });
    this.container.querySelector('.combat-log-header')?.addEventListener('click', toggleLog);
  }

  /**
   * Switches cleanly between the 3 main screen layouts:
   * - 'TITLE': Screen 1 (Main Menu)
   * - 'STAGE_SELECT': Screen 2 (Expedition Select with left hero info)
   * - 'GAMEPLAY': Screen 3 (Active turn-based battle HUD)
   * @param {'TITLE'|'STAGE_SELECT'|'GAMEPLAY'} screenName
   */
  setScreen(screenName) {
    if (this.titleScreen) {
      this.titleScreen.classList.toggle('hidden', screenName !== 'TITLE');
    }
    if (this.stageSelectScreen) {
      this.stageSelectScreen.classList.toggle('hidden', screenName !== 'STAGE_SELECT');
    }
    if (this.gameplayHud) {
      this.gameplayHud.classList.toggle('hidden', screenName !== 'GAMEPLAY');
    }

    // Hide any gameplay-specific modals when leaving gameplay
    if (screenName !== 'GAMEPLAY') {
      this.showPauseModal(false);
      this.showStageClearModal(false);
      this.showGameOverModal(false);
      this.showVictoryModal(false);
    }

    // Start or stop Overworld Map living background animation on Stage Select screen
    if (screenName === 'STAGE_SELECT') {
      this.startMapBgAnimation();
      this.stageBriefingModalWrapper?.classList.add('hidden');
      this.stageBriefingScroll?.classList.add('hidden');
      this.heroFloatingDossier?.classList.add('hidden');
      this.rosterPortraitBtns?.forEach((b) => b.classList.remove('active'));
    } else {
      this.stopMapBgAnimation();
      this.stageBriefingModalWrapper?.classList.add('hidden');
      this.stageBriefingScroll?.classList.add('hidden');
      this.heroFloatingDossier?.classList.add('hidden');
    }
  }

  _initAPCrystals() {
    if (!this.apCrystalsEl) return;
    this.apCrystalsEl.innerHTML = '';
    this.apCrystalElements = [];

    for (let i = 0; i < CONFIG.COMBAT.MAX_AP; i++) {
      const crystal = document.createElement('div');
      crystal.className = 'ap-crystal active';
      crystal.title = `Action Point ${i + 1}`;
      this.apCrystalsEl.appendChild(crystal);
      this.apCrystalElements.push(crystal);
    }
  }

  _initNumberPoolTray() {
    if (!this.numberPoolTray) return;
    this.numberPoolTray.innerHTML = '';
    this.poolTileElements = [];

    for (let i = 0; i < CONFIG.COMBAT.NUMBER_POOL_SIZE; i++) {
      const tile = document.createElement('button');
      tile.className = 'number-pool-tile';
      tile.type = 'button';
      tile.textContent = '-';

      tile.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onSelectPoolNumber?.(i);
      });

      this.numberPoolTray.appendChild(tile);
      this.poolTileElements.push(tile);
    }
  }

  /**
   * Builds persistent Hero Card elements once during game setup
   * @param {Hero[]} heroes
   */
  setupHeroCards(heroes) {
    if (!this.heroCardsContainer) return;
    this.heroCardsContainer.innerHTML = '';
    this.heroCardElements = {};

    heroes.forEach((hero) => {
      const card = document.createElement('div');
      card.className = `hero-card hero-${hero.id}`;

      // Header: Operator symbol, Name, Title
      const cardHeader = document.createElement('div');
      cardHeader.className = 'hero-card-header';
      cardHeader.innerHTML = `
        <div class="hero-name-badge">
          <span class="hero-op-symbol">${hero.operator}</span>
          <span class="hero-name">${hero.name}</span>
        </div>
        <span class="hero-role-title">${hero.title}</span>
      `;

      // Health bar
      const hpBar = document.createElement('div');
      hpBar.className = 'hero-hp-bar';
      const hpFill = document.createElement('div');
      hpFill.className = 'hero-hp-fill';
      const hpText = document.createElement('span');
      hpText.className = 'hero-hp-text';
      hpBar.appendChild(hpFill);
      hpBar.appendChild(hpText);

      // Held number slot
      const heldSlot = document.createElement('div');
      heldSlot.className = 'hero-held-slot';

      // Action button
      const actionBtn = document.createElement('button');
      actionBtn.className = 'hero-action-btn';
      actionBtn.type = 'button';

      card.appendChild(cardHeader);
      card.appendChild(hpBar);
      card.appendChild(heldSlot);
      card.appendChild(actionBtn);

      // Unified click handler on card and button
      const onCardClick = (e) => {
        e.stopPropagation();
        this.callbacks.onCardClick?.(hero);
      };

      card.addEventListener('click', onCardClick);
      actionBtn.addEventListener('click', onCardClick);

      this.heroCardsContainer.appendChild(card);

      this.heroCardElements[hero.id] = {
        card,
        hpFill,
        hpText,
        heldSlot,
        actionBtn,
      };
    });
  }

  showTitleModal(show) {
    this.setScreen(show ? 'TITLE' : 'GAMEPLAY');
  }

  showStageSelectModal(show, stages = null, stageManager = null) {
    if (show) {
      if (stages && stageManager) {
        this.renderStageSelectCards(stages, stageManager);
      }
      this.setScreen('STAGE_SELECT');
    } else {
      this.setScreen('GAMEPLAY');
    }
  }

  /**
   * Starts the living atmospheric forest background animation loop on the Overworld Map
   */
  startMapBgAnimation() {
    if (this.mapBgAnimId) return;
    this.lastMapBgTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - this.lastMapBgTime) / 1000, 0.05);
      this.lastMapBgTime = time;

      this.drawMapLivingBackground(dt);
      this.mapBgAnimId = requestAnimationFrame(loop);
    };

    this.mapBgAnimId = requestAnimationFrame(loop);
  }

  /**
   * Stops the Overworld Map living background animation loop
   */
  stopMapBgAnimation() {
    if (this.mapBgAnimId) {
      cancelAnimationFrame(this.mapBgAnimId);
      this.mapBgAnimId = null;
    }
  }

  /**
   * Option B: Multi-layer Atmospheric Medieval Forest Canvas Backdrop
   * Renders night sky, luminous moonbeams, silhouetted pines/oaks, winding trail, and drifting fireflies
   * @param {number} dt - delta time in seconds
   */
  drawMapLivingBackground(dt) {
    const canvas = this.stageMapBgCanvas || this.container.querySelector('#stage-map-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // 1. Deep Midnight Twilight Forest Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#040711');
    skyGrad.addColorStop(0.35, '#081420');
    skyGrad.addColorStop(0.7, '#0d1e29');
    skyGrad.addColorStop(1, '#081216');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. High Celestial Moon & Radial Ambient Glow
    const moonX = w * 0.72;
    const moonY = h * 0.16;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 260);
    moonGlow.addColorStop(0, 'rgba(240, 249, 255, 0.35)');
    moonGlow.addColorStop(0.3, 'rgba(186, 230, 253, 0.15)');
    moonGlow.addColorStop(0.7, 'rgba(56, 189, 248, 0.04)');
    moonGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 260, 0, Math.PI * 2);
    ctx.fill();

    // Solid silver moon disc
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 28, 0, Math.PI * 2);
    ctx.fill();

    // 3. Diagonal Volumetric Moonlight Beams (Streaming through canopy)
    ctx.save();
    const beams = [
      { x1: moonX - 40, x2: moonX + 30, bx1: w * 0.45, bx2: w * 0.75 },
      { x1: moonX + 60, x2: moonX + 110, bx1: w * 0.7, bx2: w * 0.95 },
    ];
    for (const b of beams) {
      const rayGrad = ctx.createLinearGradient(b.x1, moonY, b.bx1, h);
      rayGrad.addColorStop(0, 'rgba(224, 242, 254, 0.12)');
      rayGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.04)');
      rayGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(b.x1, 0);
      ctx.lineTo(b.x2, 0);
      ctx.lineTo(b.bx2, h);
      ctx.lineTo(b.bx1, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 4. Distant Mountain & Forest Ridge Silhouettes
    ctx.fillStyle = '#050f18';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.42);
    ctx.quadraticCurveTo(w * 0.25, h * 0.34, w * 0.5, h * 0.38);
    ctx.quadraticCurveTo(w * 0.78, h * 0.3, w, h * 0.35);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // 5. Forest Floor with Winding Earthen & Mossy Trail
    const floorGrad = ctx.createLinearGradient(0, h * 0.35, 0, h);
    floorGrad.addColorStop(0, '#0a1715');
    floorGrad.addColorStop(0.5, '#07120e');
    floorGrad.addColorStop(1, '#030806');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, h * 0.35, w, h * 0.65);

    // Broad Earthen / Cobblestone Road Curve (Matching the 6 nodes)
    ctx.save();
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.28)';
    ctx.lineWidth = 42;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(345, 740);
    ctx.quadraticCurveTo(480, 630, 614, 518);
    ctx.quadraticCurveTo(768, 590, 921, 734);
    ctx.quadraticCurveTo(1075, 640, 1228, 518);
    ctx.quadraticCurveTo(1382, 390, 1536, 367);
    ctx.quadraticCurveTo(1248, 237, 960, 216);
    ctx.stroke();

    // Inner Mossy Track
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.18)';
    ctx.lineWidth = 18;
    ctx.stroke();
    ctx.restore();

    // 6. Perimeter Framing Oak & Pine Tree Silhouettes (Left & Right)
    ctx.fillStyle = '#040b08';
    // Left grove
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(180, 0);
    ctx.bezierCurveTo(220, 240, 120, 480, 240, 800);
    ctx.lineTo(0, 800);
    ctx.closePath();
    ctx.fill();
    // Right grove
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w - 200, 0);
    ctx.bezierCurveTo(w - 240, 280, w - 140, 520, w - 260, 900);
    ctx.lineTo(w, 900);
    ctx.closePath();
    ctx.fill();

    // 7. Ambient Drifting Fireflies & Golden Embers
    for (const p of this.mapFireflies) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.pulsePhase += p.pulseSpeed * dt;

      // Wrap boundaries
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      const alpha = 0.35 + Math.sin(p.pulsePhase) * 0.35;
      if (alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 8. If Hero Dossier is open, render standing hero on pedestal
    if (this.heroFloatingDossier && !this.heroFloatingDossier.classList.contains('hidden')) {
      this.drawHeroOnDossierPedestal(dt);
    }
  }

  /**
   * Renders the inspected Knight standing proudly on their runic stone altar inside the floating dossier
   * @param {number} dt
   */
  drawHeroOnDossierPedestal(dt) {
    const canvas = this.heroDossierCanvas || this.container.querySelector('#hero-dossier-canvas');
    if (!canvas) return;
    const hero = this.showcaseHeroes[this.selectedHeroId];
    if (!hero) return;

    hero.idleTimer += dt * 2.2;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 16;

    ctx.save();
    ctx.translate(cx, cy);

    // Ambient Elemental Aura beneath Pedestal
    const glowRadius = 74;
    const glowGrad = ctx.createRadialGradient(0, 42, 10, 0, 42, glowRadius);
    glowGrad.addColorStop(0, hero.color + '55');
    glowGrad.addColorStop(0.5, hero.color + '18');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 42, glowRadius, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark Stone Altar Pedestal
    ctx.fillStyle = '#1c130d';
    ctx.strokeStyle = hero.accent || '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 44, 62, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner Runic Ring on Pedestal Top
    ctx.strokeStyle = hero.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 42, 50, 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hero Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 40, 44, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Breathing Bob
    const breatheY = Math.sin(hero.idleTimer) * 3;
    ctx.translate(0, breatheY);

    // Class Silhouette
    switch (hero.id) {
      case 'knight':
        hero._drawKnight(ctx);
        break;
      case 'berserker':
        hero._drawBerserker(ctx);
        break;
      case 'cleric':
        hero._drawCleric(ctx);
        break;
      case 'paladin':
        hero._drawPaladin(ctx);
        break;
    }

    ctx.restore();
  }

  /**
   * Inspects a companion Knight from the Order of Arithmetic dock (bottom-left)
   * Opens floating parchment dossier without code formulas
   * @param {'knight'|'berserker'|'cleric'|'paladin'} heroId
   */
  inspectHero(heroId) {
    // If clicking the same hero while dossier is open, toggle close!
    const dossier = this.heroFloatingDossier || this.container.querySelector('#hero-floating-dossier');
    if (this.selectedHeroId === heroId && dossier && !dossier.classList.contains('hidden')) {
      dossier.classList.add('hidden');
      this.rosterPortraitBtns?.forEach((b) => b.classList.remove('active'));
      return;
    }

    this.selectedHeroId = heroId;

    // Close stage briefing if open so they don't fight for space
    this.stageBriefingModalWrapper?.classList.add('hidden');
    this.stageBriefingScroll?.classList.add('hidden');

    // Synchronize portrait buttons
    this.rosterPortraitBtns?.forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-hero') === heroId);
    });

    if (!dossier) return;
    dossier.classList.remove('hidden');

    const HERO_LORE = {
      knight: {
        name: 'Sir Matthew the Subtractor',
        hp: '40 Vitality',
        title: 'Order of Subtraction • Frontline Striker',
        op: '−',
        desc: 'Armed with the sacred broadsword of subtraction. When unleashed against an anomaly, he directly subtracts his equipped number stone from corrupted enemy vitality, landing reliable armor-piercing damage and precise finishing blows.',
        tip: "Scholar's Lore: Reliable strike vanguard. Excels at eliminating low-health anomalies without wasted effort.",
      },
      berserker: {
        name: 'Gorr the Divider',
        hp: '35 Vitality',
        title: 'Order of Division • Heavy Buster',
        op: '÷',
        desc: "A fearsome barbarian wielding twin crescent war-axes of division. When striking, he divides the enemy's current vitality by his equipped stone, cleaving massive bosses in twain with colossal damage.",
        tip: "Scholar's Lore: Essential against colossal health pools (Big Int & Factorio). The greater their health, the more catastrophic his blow.",
      },
      cleric: {
        name: 'Lady Aurelia the Adder',
        hp: '30 Vitality',
        title: 'Order of Addition • High Priestess & Healer',
        op: '+',
        desc: 'Bearer of the celestial crystal cross-staff. Channels restorative sacred arithmetic, adding her equipped number stone directly to an ally’s vitality to mend grievous battle wounds and preserve the party gauntlet.',
        tip: "Scholar's Lore: Party vitality protector. Combine with Paladin holy fervor for emergency resurrection-tier heals.",
      },
      paladin: {
        name: 'Lord Justinian the Multiplier',
        hp: '45 Vitality',
        title: 'Order of Multiplication • Sacred Buffer',
        op: '×',
        desc: 'Clad in sun-forged plate armor. Relies not on stone rolling, but accumulates holy fervor (+1x each round, up to ×3). He channels this multiplier into an armed ally, magnifying their stone to achieve monumental strikes.',
        tip: "Scholar's Lore: Strategic vanguard. Multiply Berserker division or Cleric restoration for overwhelming tactical advantage.",
      },
    };

    const info = HERO_LORE[heroId] || HERO_LORE.knight;
    this.container.querySelector('#dossier-hero-name').textContent = info.name;
    this.container.querySelector('#dossier-hero-hp').textContent = info.hp;
    this.container.querySelector('#dossier-hero-title').textContent = info.title;
    this.container.querySelector('#dossier-hero-desc').textContent = info.desc;
    this.container.querySelector('#dossier-tactical-tip').textContent = info.tip;
    this.container.querySelector('#dossier-op-badge').textContent = info.op;
  }

  /**
   * Renders the Overworld Map with 6 interactive medieval territory medallions
   * @param {Object[]} stages
   * @param {import('../systems/StageManager.js').StageManager} stageManager
   */
  renderStageSelectCards(stages, stageManager) {
    this.cachedStages = stages;
    this.cachedStageManager = stageManager;

    const nodesContainer = this.overworldNodesContainer || this.container.querySelector('#overworld-nodes-container');
    if (!nodesContainer) return;
    nodesContainer.innerHTML = '';

    // Spatial Percent Coordinates on 1920x1080 Overworld Map
    const NODE_COORDS = [
      { left: 18, top: 68 }, // Stage 1: Monomial Threshold
      { left: 32, top: 48 }, // Stage 2: Binomial Crypt
      { left: 48, top: 68 }, // Stage 3: Polynomial Labyrinth
      { left: 64, top: 48 }, // Stage 4: Rational Vault
      { left: 80, top: 34 }, // Stage 5: Infinite Core (Boss Big Int)
      { left: 50, top: 20 }, // Stage 6: Factorial Abyss (Final Boss Factorio)
    ];

    const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    stages.forEach((stage, idx) => {
      const isUnlocked = stageManager.isStageUnlocked(stage.STAGE_NUMBER);
      const isBoss = stage.IS_BOSS_STAGE;
      const isFinal = stage.STAGE_NUMBER === CONFIG.COMBAT.MAX_STAGES;
      const isSelected = this.selectedStageNumber === stage.STAGE_NUMBER;
      const coords = NODE_COORDS[idx] || { left: 50, top: 50 };

      const nodeEl = document.createElement('div');
      nodeEl.className = `map-node-item ${isBoss ? 'boss-node' : ''} ${isFinal ? 'final-boss-node' : ''} ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'active-selected' : ''}`;
      nodeEl.style.left = `${coords.left}%`;
      nodeEl.style.top = `${coords.top}%`;
      nodeEl.setAttribute('data-stage', stage.STAGE_NUMBER);

      let crestHtml = `<span class="node-roman-numeral">${ROMAN_NUMERALS[idx]}</span>`;
      if (isFinal) {
        crestHtml = `
          <svg class="rpg-svg-icon node-crest-svg crown-svg" viewBox="0 0 24 24"><path d="M5 19h14v2H5v-2zm14-14l-4 7-3-5-3 5-4-7-2 12h18L19 5z"/></svg>
          <span class="node-roman-sub">FINAL</span>
        `;
      } else if (isBoss) {
        crestHtml = `
          <svg class="rpg-svg-icon node-crest-svg skull-svg" viewBox="0 0 24 24"><path d="M12 2C7.6 2 4 5.6 4 10c0 2.4 1 4.6 2.7 6.1.4.3.6.8.6 1.3V19c0 .6.4 1 1 1h1v1c0 .6.4 1 1 1h3c.6 0 1-.4 1-1v-1h1c.6 0 1-.4 1-1v-1.6c0-.5.2-1 .6-1.3C19 14.6 20 12.4 20 10c0-4.4-3.6-8-8-8zm-3 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>
          <span class="node-roman-sub">BOSS</span>
        `;
      }

      nodeEl.innerHTML = `
        <div class="node-beacon-aura"></div>
        <div class="node-medallion-rim">
          <div class="node-inner-plate">
            ${crestHtml}
          </div>
          ${!isUnlocked ? `
            <div class="node-padlock-overlay">
              <svg class="rpg-svg-icon node-lock-svg" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.7 1.4-3.1 3.1-3.1 1.7 0 3.1 1.4 3.1 3.1v2z"/></svg>
            </div>
          ` : ''}
        </div>
        <div class="node-plaque-banner">
          <span class="node-plaque-title">${stage.NAME}</span>
        </div>
      `;

      nodeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectAndInspectStage(stage.STAGE_NUMBER, true);
      });

      nodesContainer.appendChild(nodeEl);
    });

    // Populate bottom Territory Waypoint Navigation Ribbon ("เลื่อนดูด่านบนแผนที่")
    const ribbonPills = this.territoryRibbonPills || this.container.querySelector('#territory-ribbon-pills');
    if (ribbonPills) {
      ribbonPills.innerHTML = '';
      stages.forEach((stage, idx) => {
        const isBoss = stage.IS_BOSS_STAGE;
        const isFinal = stage.STAGE_NUMBER === CONFIG.COMBAT.MAX_STAGES;
        const isSelected = this.selectedStageNumber === stage.STAGE_NUMBER;
        const pill = document.createElement('button');
        pill.className = `territory-pill-btn ${isBoss || isFinal ? 'pill-boss' : ''} ${isSelected ? 'active' : ''}`;
        pill.type = 'button';
        pill.setAttribute('data-stage', stage.STAGE_NUMBER);
        pill.textContent = isFinal ? 'VI • FINAL' : isBoss ? 'V • BOSS' : `T • ${ROMAN_NUMERALS[idx]}`;
        pill.title = `Inspect ${stage.NAME}`;
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectAndInspectStage(stage.STAGE_NUMBER, true);
        });
        ribbonPills.appendChild(pill);
      });
    }

    // Mark current selected stage on map (DO NOT open briefing modal automatically on initial load!)
    this.selectAndInspectStage(this.selectedStageNumber, false);
  }

  /**
   * Focuses and inspects a stage, updating map medallions and ribbon pills
   * @param {number} stageNumber
   * @param {boolean} openModal
   */
  selectAndInspectStage(stageNumber, openModal = true) {
    if (!this.cachedStages || this.cachedStages.length === 0) return;
    this.selectedStageNumber = stageNumber;
    const stage = this.cachedStages.find((s) => s.STAGE_NUMBER === stageNumber) || this.cachedStages[0];

    // Synchronize map medallions
    const nodesContainer = this.overworldNodesContainer || this.container.querySelector('#overworld-nodes-container');
    nodesContainer?.querySelectorAll('.map-node-item').forEach((el) => {
      el.classList.toggle('active-selected', parseInt(el.getAttribute('data-stage'), 10) === stageNumber);
    });

    // Synchronize territory ribbon pills
    this.container.querySelectorAll('.territory-pill-btn').forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-stage'), 10) === stageNumber);
    });

    if (openModal) {
      // Close hero dossier if open
      if (this.heroFloatingDossier) {
        this.heroFloatingDossier.classList.add('hidden');
        this.rosterPortraitBtns?.forEach((b) => b.classList.remove('active'));
      }
      this.renderSelectedStageDetail(stage, this.cachedStageManager);
    }
  }

  /**
   * Renders the authentic Parchment Expedition Briefing Scroll for the selected territory
   * @param {Object} stage
   * @param {import('../systems/StageManager.js').StageManager} stageManager
   */
  renderSelectedStageDetail(stage, stageManager) {
    const scrollModal = this.stageBriefingScroll || this.container.querySelector('#stage-briefing-scroll');
    if (!scrollModal) return;

    const isUnlocked = stageManager.isStageUnlocked(stage.STAGE_NUMBER);
    const isBoss = stage.IS_BOSS_STAGE;
    const isFinal = stage.STAGE_NUMBER === CONFIG.COMBAT.MAX_STAGES;

    const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    const roman = ROMAN_NUMERALS[stage.STAGE_NUMBER - 1] || stage.STAGE_NUMBER;

    // 1. Rank Banner & Titles
    const badgeEl = this.container.querySelector('#briefing-stage-badge');
    if (badgeEl) {
      badgeEl.textContent = isFinal ? 'FINAL APOCALYPTIC CITADEL' : isBoss ? 'TITAN BOSS TERRITORY' : `TERRITORY ${roman}`;
      badgeEl.className = `scroll-rank-banner ${isFinal ? 'rank-final' : isBoss ? 'rank-boss' : ''}`;
    }

    const titleEl = this.container.querySelector('#briefing-stage-title');
    if (titleEl) titleEl.textContent = stage.NAME;

    const statusEl = this.container.querySelector('#briefing-stage-status');
    if (statusEl) {
      statusEl.textContent = isUnlocked ? 'GATE UNSEALED' : 'GATE SEALED';
      statusEl.className = `scroll-status-seal ${isUnlocked ? 'status-open' : 'status-locked'}`;
    }

    // 2. Lore Text
    const descEl = this.container.querySelector('#briefing-stage-desc');
    if (descEl) descEl.textContent = stage.DESCRIPTION;

    // 3. Enemy Bestiary Dossier
    const countEl = this.container.querySelector('#briefing-enemy-count');
    if (countEl) countEl.textContent = `${stage.ENEMIES.length} Corrupted Target${stage.ENEMIES.length > 1 ? 's' : ''}`;

    const enemiesGrid = this.container.querySelector('#briefing-enemies-grid');
    if (enemiesGrid) {
      enemiesGrid.innerHTML = '';
      stage.ENEMIES.forEach((enemy) => {
        const card = document.createElement('div');
        card.className = 'briefing-enemy-card';
        card.innerHTML = `
          <div class="briefing-enemy-head">
            <span class="briefing-glyph-seal" style="background: ${enemy.COLOR}; border-color: ${enemy.ACCENT};">${enemy.GLYPH}</span>
            <div class="briefing-enemy-identity">
              <strong class="briefing-enemy-name">${enemy.NAME}</strong>
              <span class="briefing-enemy-title">${enemy.TITLE}</span>
            </div>
            <div class="briefing-enemy-vitals">
              <span class="briefing-vital-pill vital-hp">
                <svg class="rpg-svg-icon vital-icon" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                ${enemy.IS_FACTORIAL_BOSS ? '6! (720) ➔ 0' : enemy.IS_NEGATIVE ? `${enemy.HP} ➔ 0 HP` : `${enemy.HP.toLocaleString()} HP`}
              </span>
              <span class="briefing-vital-pill vital-atk">
                <svg class="rpg-svg-icon vital-icon" viewBox="0 0 24 24"><path d="M14.7 3.3a1 1 0 0 0-1.4 0L8.6 8 4 6.7a1 1 0 0 0-1.2 1.2L4 12.6l-2.7 2.7a1 1 0 0 0 0 1.4l2 2a1 1 0 0 0 1.4 0L7.4 16l4.7 1.2a1 1 0 0 0 1.2-1.2L12 11.4l4.7-4.7a1 1 0 0 0 0-1.4l-2-2z"/></svg>
                ${enemy.ATTACK} ATK
              </span>
            </div>
          </div>
          <p class="briefing-scholar-lore">
            <em>Scholar's Lore:</em> ${enemy.TACTIC || 'A corrupted numerical manifestation. Destroy with arithmetic orders.'}
          </p>
        `;
        enemiesGrid.appendChild(card);
      });
    }

    // 4. Chunky 3D Action Button
    const deployBtn = this.btnBriefingDeploy || this.container.querySelector('#btn-briefing-deploy');
    const deployLabel = this.container.querySelector('#briefing-deploy-label');
    if (deployBtn) {
      if (isUnlocked) {
        deployBtn.className = 'chunky-rpg-btn btn-march-forth';
        deployBtn.disabled = false;
        if (deployLabel) deployLabel.textContent = isFinal ? 'CONFRONT FACTORIO' : 'MARCH INTO BATTLE';
      } else {
        deployBtn.className = 'chunky-rpg-btn btn-march-forth locked-btn';
        deployBtn.disabled = true;
        if (deployLabel) deployLabel.textContent = `GATE SEALED (Liberate Floor ${stage.STAGE_NUMBER - 1} First)`;
      }
    }

    // Unroll / reveal the scroll modal & backdrop
    if (this.stageBriefingModalWrapper) {
      this.stageBriefingModalWrapper.classList.remove('hidden');
    }
    scrollModal.classList.remove('hidden');
  }

  showHelpModal(show) {
    this.helpModal?.classList.toggle('hidden', !show);
  }

  showPauseModal(show) {
    this.pauseModal?.classList.toggle('hidden', !show);
  }

  showStageClearModal(show, record = null, draftOptions = []) {
    if (!this.stageClearModal) return;
    if (show && record) {
      this.container.querySelector('#clear-stage-name').textContent = `Stage ${record.stageNumber}: ${record.stageName}`;
      this.container.querySelector('#clear-stage-bonus').textContent = `+${record.stageBonus.toLocaleString()} pts`;
      this.container.querySelector('#clear-hp-bonus').textContent = `+${record.hpBonus.toLocaleString()} pts`;
      this.container.querySelector('#clear-round-penalty').textContent = `-${record.roundPenalty.toLocaleString()} pts (${record.roundsTaken} Rounds)`;
      this.container.querySelector('#clear-stage-score').textContent = `${record.stageScore.toLocaleString()} pts`;
      this.container.querySelector('#clear-total-score').textContent = `${record.totalScore.toLocaleString()} pts`;

      this.hasActiveDraft = draftOptions && draftOptions.length > 0;
      this.selectedAxiomId = null;

      if (this.hasActiveDraft && this.axiomDraftSection && this.axiomDraftCards) {
        this.axiomDraftSection.classList.remove('hidden');
        this.axiomDraftCards.innerHTML = '';
        if (this.btnNextStage) {
          this.btnNextStage.textContent = 'CHOOSE A THEOREM TO PROCEED';
          this.btnNextStage.classList.add('awaiting-draft');
        }
        this.axiomDraftHint?.classList.remove('hidden', 'pulse-warn');

        draftOptions.forEach((axiom) => {
          const card = document.createElement('div');
          card.className = 'axiom-draft-card';
          card.setAttribute('data-axiom-id', axiom.id);
          card.innerHTML = `
            <div class="axiom-card-header">
              <span class="axiom-card-crest" style="color: ${axiom.badgeColor};">
                ${axiom.iconSvg}
              </span>
              <span class="axiom-card-tag" style="background: ${axiom.badgeColor}22; color: ${axiom.badgeColor}; border: 1px solid ${axiom.badgeColor}66;">${axiom.tag}</span>
            </div>
            <h4 class="axiom-card-name">${axiom.name}</h4>
            <div class="axiom-glyph-badge">[ ${axiom.glyph} ]</div>
            <p class="axiom-card-desc">${axiom.desc}</p>
            <p class="axiom-card-flavor">${axiom.flavor}</p>
            <div class="axiom-card-action">
              <span class="axiom-seal-icon">✦</span>
              <span class="axiom-seal-text">CLAIM THEOREM</span>
            </div>
          `;

          card.addEventListener('click', (e) => {
            e.stopPropagation();
            this.container.querySelectorAll('.axiom-draft-card').forEach((c) => {
              c.classList.remove('selected-axiom-card');
              const t = c.querySelector('.axiom-seal-text');
              if (t) t.textContent = 'CLAIM THEOREM';
            });

            card.classList.add('selected-axiom-card');
            const sealText = card.querySelector('.axiom-seal-text');
            if (sealText) sealText.textContent = 'AXIOM CLAIMED ✓';

            this.selectedAxiomId = axiom.id;
            this.axiomDraftHint?.classList.add('hidden');
            if (this.btnNextStage) {
              this.btnNextStage.classList.remove('awaiting-draft');
              this.btnNextStage.innerHTML = `ADVANCE WITH <strong>${axiom.name.toUpperCase()}</strong>`;
            }

            this.callbacks.onClaimAxiom?.(axiom.id);
          });

          this.axiomDraftCards.appendChild(card);
        });
      } else {
        this.axiomDraftSection?.classList.add('hidden');
        if (this.btnNextStage) {
          this.btnNextStage.textContent = 'ADVANCE EXPEDITION';
          this.btnNextStage.classList.remove('awaiting-draft');
        }
      }

      this.stageClearModal.classList.remove('hidden');
    } else {
      this.stageClearModal.classList.add('hidden');
    }
  }

  showGameOverModal(show, stats = null) {
    if (!this.gameOverModal) return;
    if (show && stats) {
      this.container.querySelector('#gameover-stage-reached').textContent = `Stage ${stats.stageNumber}: ${stats.stageName}`;
      this.container.querySelector('#gameover-total-score').textContent = `${stats.totalScore.toLocaleString()} pts`;
      this.gameOverModal.classList.remove('hidden');
    } else {
      this.gameOverModal.classList.add('hidden');
    }
  }

  showVictoryModal(show, stats = null) {
    if (!this.victoryModal) return;
    if (show && stats) {
      this.container.querySelector('#victory-final-score').textContent = `${stats.totalScore.toLocaleString()} pts`;
      this.container.querySelector('#victory-total-rounds').textContent = `${stats.totalRounds} Rounds`;
      this.container.querySelector('#victory-survivors').textContent = `${stats.survivorCount} / 4 Knights Standing`;
      this.victoryModal.classList.remove('hidden');
    } else {
      this.victoryModal.classList.add('hidden');
    }
  }

  updateMuteButton(isMuted) {
    if (this.btnMute) {
      this.btnMute.innerHTML = isMuted
        ? '<svg class="rpg-svg-icon" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>'
        : '<svg class="rpg-svg-icon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
      this.btnMute.title = isMuted ? 'Unmute Sound' : 'Mute Sound';
    }
  }

  addCombatLog(entry) {
    if (!this.combatLogContainer) return;
    const item = document.createElement('div');
    item.className = `combat-log-line log-${entry.type}`;
    item.textContent = entry.text;
    this.combatLogContainer.appendChild(item);

    while (this.combatLogContainer.children.length > 40) {
      this.combatLogContainer.removeChild(this.combatLogContainer.firstChild);
    }
    this.combatLogContainer.scrollTop = this.combatLogContainer.scrollHeight;
  }

  clearCombatLog() {
    if (this.combatLogContainer) {
      this.combatLogContainer.innerHTML = '';
    }
  }

  /**
   * Main in-place HUD render frame (Non-destructive update)
   */
  render({
    stageNumber,
    stageConfig,
    round,
    ap,
    maxAp,
    isEnemyPhase,
    totalScore,
    heroes,
    numberPool,
    selectedPoolIndex,
    activeActor,
    previewInfo,
    activeAxioms = [],
  }) {
    // 1. Top HUD bar texts
    if (this.stageTitleEl && stageConfig) {
      this.stageTitleEl.textContent = `Stage ${stageNumber} / ${CONFIG.COMBAT.MAX_STAGES}: ${stageConfig.NAME}`;
    }
    if (this.stageDescEl && stageConfig) {
      this.stageDescEl.textContent = stageConfig.DESCRIPTION;
    }
    if (this.roundEl) {
      this.roundEl.textContent = `Round ${round}`;
    }
    if (this.scoreEl) {
      this.scoreEl.textContent = `Score: ${totalScore.toLocaleString()}`;
    }

    // Phase Badge
    if (this.phaseBadgeEl) {
      if (isEnemyPhase) {
        this.phaseBadgeEl.textContent = 'ENEMY PHASE';
        this.phaseBadgeEl.className = 'hud-badge phase-enemy';
      } else {
        this.phaseBadgeEl.textContent = 'PLAYER PHASE';
        this.phaseBadgeEl.className = 'hud-badge phase-player';
      }
    }

    // 2. AP Crystals dynamic synchronization & in-place update
    const targetCrystalCount = Math.max(ap, maxAp || CONFIG.COMBAT.MAX_AP);
    if (this.apCrystalsEl) {
      while (this.apCrystalElements.length < targetCrystalCount) {
        const crystalIdx = this.apCrystalElements.length;
        const crystal = document.createElement('div');
        crystal.className = 'ap-crystal active';
        this.apCrystalsEl.appendChild(crystal);
        this.apCrystalElements.push(crystal);
      }
      while (this.apCrystalElements.length > targetCrystalCount) {
        const crystal = this.apCrystalElements.pop();
        crystal?.remove();
      }
    }

    this.apCrystalElements.forEach((crystal, idx) => {
      const isActive = idx < ap;
      const isBoosterBonus = idx >= CONFIG.COMBAT.MAX_AP;
      crystal.className = `ap-crystal ${isActive ? 'active' : 'spent'} ${isBoosterBonus ? 'booster-crystal' : ''}`;
      crystal.title = isBoosterBonus
        ? `Action Point ${idx + 1} (Calculus AP Booster Bonus)`
        : `Action Point ${idx + 1}`;
    });

    // End Turn button state
    if (this.btnEndTurn) {
      this.btnEndTurn.disabled = isEnemyPhase;
    }

    // 3. Number Pool Tray dynamic synchronization & in-place update
    if (this.numberPoolTray) {
      while (this.poolTileElements.length < numberPool.length) {
        const tileIdx = this.poolTileElements.length;
        const tile = document.createElement('button');
        tile.className = 'pool-tile';
        tile.title = 'Click to select number, then click Hero to equip';
        tile.addEventListener('click', () => {
          this.callbacks.onSelectPoolNumber?.(tileIdx);
        });
        this.numberPoolTray.appendChild(tile);
        this.poolTileElements.push(tile);
      }
    }

    this.poolTileElements.forEach((tile, idx) => {
      if (idx < numberPool.length) {
        tile.style.display = 'flex';
        tile.textContent = numberPool[idx];
        tile.classList.toggle('selected', selectedPoolIndex === idx);
        tile.disabled = isEnemyPhase;
      } else {
        tile.style.display = 'none';
        tile.classList.remove('selected');
      }
    });

    // 4. Hero Cards in-place update
    const buffableAllyExists = heroes.some(
      (h) => h.isAlive() && h.id !== 'paladin' && h.heldValue !== null
    );

    heroes.forEach((hero) => {
      const els = this.heroCardElements[hero.id];
      if (!els) return;

      const isSelected = activeActor === hero;
      const isAlive = hero.isAlive();
      // Paladin can never equip pool numbers; relies solely on turn multiplier
      const canEquip = isAlive && selectedPoolIndex !== null && !isEnemyPhase && hero.id !== 'paladin';

      // Card class states
      els.card.classList.toggle('active-actor', isSelected);
      els.card.classList.toggle('hero-dead', !isAlive);
      els.card.classList.toggle('can-equip', canEquip);

      // HP bar fill & text
      const hpPercent = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));
      els.hpFill.style.width = `${hpPercent}%`;
      els.hpText.textContent = `${hero.hp} / ${hero.maxHp} HP`;

      // Held number slot
      if (!isAlive) {
        els.heldSlot.innerHTML = `<span class="held-tag dead">FALLEN</span>`;
      } else if (hero.id === 'paladin') {
        els.heldSlot.innerHTML = `
          <div class="paladin-charge-box">
            <span class="paladin-charge-text">Multiplier: <strong>×${hero.multiplier}</strong></span>
            <span class="paladin-subtext">+1/turn (Max ×3)</span>
          </div>
        `;
      } else if (hero.heldValue !== null) {
        els.heldSlot.innerHTML = `<span class="held-tag equipped">Held: <strong>${hero.heldValue}</strong></span>`;
      } else {
        els.heldSlot.innerHTML = `<span class="held-tag empty">${canEquip ? 'Click to Equip!' : 'No Number'}</span>`;
      }

      // Action button
      if (!isAlive) {
        els.actionBtn.textContent = 'Defeated';
        els.actionBtn.disabled = true;
      } else if (canEquip) {
        els.actionBtn.textContent = 'Click to Equip';
        els.actionBtn.disabled = false;
      } else if (hero.id === 'paladin') {
        if (isSelected) {
          els.actionBtn.textContent = 'READY (Click Ally)';
          els.actionBtn.disabled = false;
        } else if (!buffableAllyExists) {
          els.actionBtn.textContent = `BUFF ALLY (×${hero.multiplier})`;
          els.actionBtn.disabled = true;
          els.actionBtn.title = 'Need an ally holding a number to buff';
        } else {
          els.actionBtn.textContent = `BUFF ALLY (×${hero.multiplier})`;
          els.actionBtn.disabled = isEnemyPhase || ap <= 0;
          els.actionBtn.title = 'Multiply an ally\'s held number';
        }
      } else if (hero.heldValue === null) {
        els.actionBtn.textContent = 'Needs Number';
        els.actionBtn.disabled = true;
      } else {
        els.actionBtn.textContent = isSelected ? 'READY (Select Target)' : 'READY TO ACT';
        els.actionBtn.disabled = isEnemyPhase || ap <= 0;
      }
    });

    // 5. Action Preview Tooltip in-place update
    if (this.actionPreviewEl) {
      if (previewInfo) {
        this.actionPreviewEl.innerHTML = `
          <div class="preview-header">${previewInfo.actorName} ➔ ${previewInfo.targetName}</div>
          <div class="preview-calc">${previewInfo.formula}</div>
          <div class="preview-summary">${previewInfo.summary}</div>
        `;
        this.actionPreviewEl.classList.remove('hidden');
      } else {
        this.actionPreviewEl.classList.add('hidden');
      }
    }

    // 6. Active Mathematical Axioms Compact Corner Widget
    if (this.activeAxiomsLedger && this.activeAxiomsList) {
      if (activeAxioms && activeAxioms.length > 0) {
        this.activeAxiomsLedger.classList.remove('hidden');
        this.activeAxiomsList.innerHTML = activeAxioms
          .map(
            (axiom) => `
              <div class="axiom-mini-chip" title="${axiom.name}: ${axiom.desc}">
                <span class="chip-icon" style="color: ${axiom.badgeColor};">${axiom.iconSvg}</span>
                <span class="chip-name">${axiom.name}</span>
              </div>
            `
          )
          .join('');
      } else {
        this.activeAxiomsLedger.classList.add('hidden');
        this.activeAxiomsList.innerHTML = '';
      }
    }
  }
}
