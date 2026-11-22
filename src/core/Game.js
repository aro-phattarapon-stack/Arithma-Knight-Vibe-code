import { CONFIG } from '../config.js';
import { Input } from './Input.js';
import { HUD } from '../ui/HUD.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { StageManager } from '../systems/StageManager.js';
import { AxiomSystem } from '../systems/AxiomSystem.js';
import { Hero } from '../entities/Hero.js';

/**
 * Main Controller for Arithma Knights
 * Orchestrates rendering, turn flow, user input, audio, and state machine.
 */
export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLElement} uiContainer
   */
  constructor(canvas, uiContainer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.uiContainer = uiContainer;

    // Strict Canvas Logical Resolution
    this.canvas.width = CONFIG.CANVAS.WIDTH;
    this.canvas.height = CONFIG.CANVAS.HEIGHT;

    // Subsystems
    this.input = new Input(this.canvas);
    this.hud = new HUD(this.uiContainer);
    this.audio = new AudioSystem();
    this.particles = new ParticleSystem();
    this.combat = new CombatSystem();
    this.stageManager = new StageManager();
    this.axiomSystem = new AxiomSystem();
    this.combat.setAxiomSystem(this.axiomSystem);

    // Game Entities
    this.heroes = [
      new Hero(CONFIG.HEROES.KNIGHT),
      new Hero(CONFIG.HEROES.BERSERKER),
      new Hero(CONFIG.HEROES.CLERIC),
      new Hero(CONFIG.HEROES.PALADIN),
    ];
    this.enemies = [];

    // State Machine
    this.state = CONFIG.GAME_STATES.TITLE;
    this.isEnemyPhase = false;

    // Turn tracking per stage
    this.stageRoundsTaken = 1;
    this.totalCampaignRounds = 0;

    // Telemetry & Loop timing
    this.lastTime = 0;
    this.animationFrameId = null;
    this.isRunning = false;

    // Hover & preview cache
    this.hoveredEntity = null;
    this.previewInfo = null;

    this._loop = this._loop.bind(this);
    this._setupHUDCallbacks();
    this.init();
  }

  _setupHUDCallbacks() {
    this.hud.setCallbacks({
      onStartGame: () => this.openStageSelect(),
      onOpenStageSelect: () => this.openStageSelect(),
      onSelectStageDeploy: (stageNumber) => this.deployStage(stageNumber),
      onUnlockAllStages: () => {
        this.stageManager.unlockAllStages();
        this.hud.renderStageSelectCards(CONFIG.STAGES, this.stageManager);
        this.audio.playSelect();
      },
      onGoToMainMenu: () => this.goToMainMenu(),
      onRestartStage: () => this.restartCurrentStage(),
      onSelectPoolNumber: (index) => this.handleSelectPoolNumber(index),
      onEquipHero: (hero) => this.handleEquipHero(hero),
      onSelectHero: (hero) => this.handleSelectHero(hero),
      onCardClick: (hero) => this.handleCardClick(hero),
      onEndTurn: () => this.handleManualEndTurn(),
      onTogglePause: () => this.togglePause(),
      onToggleMute: () => this.toggleMute(),
      onRestart: () => this.startCampaign(),
      onNextStage: () => this.advanceStage(),
      onClaimAxiom: (axiomId) => this.handleClaimAxiom(axiomId),
    });

    this.combat.setLogCallback((entry) => {
      this.hud.addCombatLog(entry);
    });
  }

  init() {
    this.hud.setupHeroCards(this.heroes);
    this.hud.setScreen('TITLE');
  }

  openStageSelect() {
    this.state = CONFIG.GAME_STATES.STAGE_SELECT;
    this.hud.showStageSelectModal(true, CONFIG.STAGES, this.stageManager);
    this.audio.playSelect();
  }

  deployStage(stageNumber) {
    this.stageManager.setStage(stageNumber);
    this.combat.reset();
    this.particles.reset();
    this.hud.clearCombatLog();

    for (const hero of this.heroes) {
      hero.reset();
    }

    this.stageRoundsTaken = 1;
    this.isEnemyPhase = false;
    this.loadCurrentStage();

    this.state = CONFIG.GAME_STATES.PLAYING;
    this.hud.setScreen('GAMEPLAY');
    this.audio.playRoundStart();
  }

  restartCurrentStage() {
    this.combat.reset();
    this.particles.reset();

    for (const hero of this.heroes) {
      hero.reset();
    }

    this.stageRoundsTaken = 1;
    this.isEnemyPhase = false;
    this.loadCurrentStage();

    this.state = CONFIG.GAME_STATES.PLAYING;
    this.hud.setScreen('GAMEPLAY');
    this.audio.playRoundStart();
  }

  goToMainMenu() {
    this.state = CONFIG.GAME_STATES.TITLE;
    this.hud.setScreen('TITLE');
    this.audio.playClick();
  }

  /**
   * Begins a fresh Campaign run at Stage 1
   */
  startCampaign() {
    this.stageManager.reset();
    this.combat.reset();
    this.particles.reset();
    this.hud.clearCombatLog();
    this.axiomSystem.reset();

    // Reset Heroes to maximum HP and clear barriers
    for (const hero of this.heroes) {
      hero.resetToDefault();
    }

    this.stageRoundsTaken = 1;
    this.totalCampaignRounds = 0;
    this.isEnemyPhase = false;

    // Load Stage 1
    this.loadCurrentStage();

    this.state = CONFIG.GAME_STATES.PLAYING;
    this.hud.showTitleModal(false);
    this.hud.showGameOverModal(false);
    this.hud.showVictoryModal(false);
    this.hud.showStageClearModal(false);
    this.hud.showPauseModal(false);

    this.audio.playRoundStart();
  }

  loadCurrentStage() {
    this.enemies = this.stageManager.spawnCurrentStageEnemies();
    this.stageRoundsTaken = 1;
    this.combat.round = 1;

    // Trigger stage start axioms (e.g. Zero Barrier, Exponential Zeal)
    this.axiomSystem.onStageStart(this.stageManager.getCurrentStageNumber(), this.heroes, this.combat);

    // Start Round 1 of this stage
    this.combat.startNewRound(this.heroes, this.axiomSystem);

    const stageConfig = this.stageManager.getCurrentStageConfig();
    this.combat.log(`[EXPEDITION] Entering Stage ${this.stageManager.getCurrentStageNumber()}: ${stageConfig.NAME}`, 'round');
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this._loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  togglePause() {
    if (this.state === CONFIG.GAME_STATES.PLAYING) {
      this.state = CONFIG.GAME_STATES.PAUSED;
      this.hud.showPauseModal(true);
    } else if (this.state === CONFIG.GAME_STATES.PAUSED) {
      this.state = CONFIG.GAME_STATES.PLAYING;
      this.hud.showPauseModal(false);
    }
  }

  toggleMute() {
    const isMuted = this.audio.toggleMute();
    this.hud.updateMuteButton(isMuted);
  }

  handleSelectPoolNumber(index) {
    if (this.state !== CONFIG.GAME_STATES.PLAYING || this.isEnemyPhase) return;
    const selected = this.combat.selectPoolNumber(index);
    if (selected) {
      this.audio.playSelect();
    } else {
      this.audio.playClick();
    }
  }

  handleEquipHero(hero) {
    if (this.state !== CONFIG.GAME_STATES.PLAYING || this.isEnemyPhase) return;
    if (hero.id === 'paladin') {
      this.audio.playBlip();
      this.particles.spawnFloatingText(
        hero.x,
        hero.y - 40,
        `Cannot Equip Paladin! (Uses Turn Multiplier ×${hero.multiplier})`,
        '#f59e0b',
        28
      );
      this.combat.log(`[HONOR] Paladin cannot hold numbers! Uses Turn Multiplier (currently ×${hero.multiplier})`, 'info');
      return;
    }
    const val = this.combat.equipHeroFromPool(hero);
    if (val !== null) {
      this.audio.playEquip();
      this.particles.spawnFloatingText(hero.x, hero.y - 40, `Equipped [${val}]`, '#38bdf8', 36);
    }
  }

  handleSelectHero(hero) {
    if (this.state !== CONFIG.GAME_STATES.PLAYING || this.isEnemyPhase) return;
    if (hero.id === 'paladin') {
      const buffable = this.heroes.some(
        (h) => h.isAlive() && h.id !== 'paladin' && h.heldValue !== null
      );
      if (!buffable && this.combat.activeActor !== hero) {
        this.audio.playBlip();
        this.particles.spawnFloatingText(hero.x, hero.y - 40, 'Equip an ally first to buff!', '#f59e0b', 28);
        this.combat.log('[TACTIC] Paladin needs an ally holding a number to multiply!', 'info');
        return;
      }
    }
    const selected = this.combat.selectActor(hero);
    if (selected) {
      this.audio.playSelect();
    } else {
      this.audio.playClick();
    }
  }

  handleCardClick(hero) {
    if (this.state !== CONFIG.GAME_STATES.PLAYING || this.isEnemyPhase) return;

    // 1. If a pool number is selected, equip it!
    if (this.combat.selectedPoolIndex !== null) {
      this.handleEquipHero(hero);
      return;
    }

    // 2. If an actor is active and this hero is a valid target (Cleric heal or Paladin buff), execute!
    const validTargets = this.combat.getValidTargets(this.heroes, this.enemies);
    if (this.combat.activeActor && validTargets.includes(hero)) {
      const result = this.combat.executeAction(
        hero,
        this.heroes,
        this.enemies,
        this.particles,
        this.audio
      );

      if (result.allEnemiesDead) {
        this.handleStageClear();
        return;
      }

      if (result.autoEndTurn) {
        this.startEnemyPhase();
        return;
      }
      return;
    }

    // 3. Otherwise toggle hero READY mode
    this.handleSelectHero(hero);
  }

  handleManualEndTurn() {
    if (this.state !== CONFIG.GAME_STATES.PLAYING || this.isEnemyPhase) return;
    this.startEnemyPhase();
  }

  startEnemyPhase() {
    this.isEnemyPhase = true;
    this.state = CONFIG.GAME_STATES.ENEMY_PHASE;
    this.combat.cancelActorSelection();
    this.previewInfo = null;

    this.combat.executeEnemyPhase(
      this.heroes,
      this.enemies,
      this.particles,
      this.audio,
      () => {
        // Step tick
      },
      ({ gameOver }) => {
        if (gameOver) {
          this.handleGameOver();
        } else {
          // Advance to next combat round
          this.stageRoundsTaken++;
          this.totalCampaignRounds++;
          this.combat.round++;
          this.combat.startNewRound(this.heroes);
          this.isEnemyPhase = false;
          this.state = CONFIG.GAME_STATES.PLAYING;
          this.audio.playRoundStart();
        }
      }
    );
  }

  handleGameOver() {
    this.state = CONFIG.GAME_STATES.GAME_OVER;
    this.audio.playGameOver();
    const stageConfig = this.stageManager.getCurrentStageConfig();
    this.hud.showGameOverModal(true, {
      stageNumber: this.stageManager.getCurrentStageNumber(),
      stageName: stageConfig ? stageConfig.NAME : 'Dungeon',
      totalScore: this.stageManager.totalScore,
    });
  }

  handleStageClear() {
    this.state = CONFIG.GAME_STATES.STAGE_CLEAR;
    this.isEnemyPhase = false;
    this.combat.cancelActorSelection();

    // Calculate score
    const livingHpSum = this.heroes
      .filter((h) => h.isAlive())
      .reduce((sum, h) => sum + h.hp, 0);

    const record = this.stageManager.recordStageClear(livingHpSum, this.stageRoundsTaken);
    this.audio.playStageClear();

    // Roll 3 random Mathematical Axioms for drafting if not final boss stage
    const isFinal = this.stageManager.isFinalStage();
    const draftOptions = isFinal ? [] : this.axiomSystem.getRandomDraftOptions(3);

    this.hud.showStageClearModal(true, record, draftOptions);
  }

  handleClaimAxiom(axiomId) {
    const claimed = this.axiomSystem.claimAxiom(axiomId, this.heroes, this.combat);
    if (claimed) {
      this.audio.playEquip();
      this.particles.spawnDeathBurst(CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2, claimed.badgeColor);
    }
    return claimed;
  }

  advanceStage() {
    if (this.stageManager.isFinalStage()) {
      // Victory!
      this.handleCampaignVictory();
      return;
    }

    // Advance to next stage
    this.stageManager.advanceToNextStage();

    // Trigger stage clear axioms (like Rebirth Formula resurrecting fallen heroes)
    this.axiomSystem.onStageClear(this.heroes, this.combat);

    // In between stages, reward players with a party health restoration and reset held numbers & Paladin charge
    for (const hero of this.heroes) {
      if (hero.isAlive()) {
        hero.heal(Math.round(hero.maxHp * 0.5)); // +50% recovery
      }
      hero.clearHeld();
      if (hero.id === 'paladin') {
        hero.resetPaladin();
      }
    }

    this.hud.showStageClearModal(false);
    this.loadCurrentStage();
    this.state = CONFIG.GAME_STATES.PLAYING;
    this.audio.playRoundStart();
  }

  handleCampaignVictory() {
    this.state = CONFIG.GAME_STATES.VICTORY;
    this.audio.playVictory();
    const survivors = this.heroes.filter((h) => h.isAlive()).length;
    this.hud.showStageClearModal(false);
    this.hud.showVictoryModal(true, {
      totalScore: this.stageManager.totalScore,
      totalRounds: this.totalCampaignRounds + this.stageRoundsTaken,
      survivorCount: survivors,
    });
  }

  _loop(timestamp) {
    if (!this.isRunning) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, CONFIG.MAX_DELTA_TIME);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.input.resetPerFrame();
    this.animationFrameId = requestAnimationFrame(this._loop);
  }

  update(dt) {
    // 1. Hotkey Checks
    if (this.input.isAnyKeyJustPressed(CONFIG.KEYS.PAUSE)) {
      this.togglePause();
    }
    if (this.input.isAnyKeyJustPressed(CONFIG.KEYS.MUTE)) {
      this.toggleMute();
    }
    if (this.input.isAnyKeyJustPressed(CONFIG.KEYS.RESTART)) {
      this.startCampaign();
    }
    if (this.input.isAnyKeyJustPressed(CONFIG.KEYS.END_TURN)) {
      this.handleManualEndTurn();
    }

    // 2. Active Combat Updates
    if (this.state === CONFIG.GAME_STATES.PLAYING || this.state === CONFIG.GAME_STATES.ENEMY_PHASE) {
      for (const hero of this.heroes) {
        hero.update(dt);
      }
      for (const enemy of this.enemies) {
        enemy.update(dt);
      }
      this.particles.update(dt);

      // Handle Pointer Targeting & Previews
      if (this.state === CONFIG.GAME_STATES.PLAYING && !this.isEnemyPhase) {
        this._handleCanvasPointerInteraction();
      }
    }

    // 3. Update DOM HUD
    this.hud.render({
      stageNumber: this.stageManager.getCurrentStageNumber(),
      stageConfig: this.stageManager.getCurrentStageConfig(),
      round: this.combat.round,
      ap: this.combat.ap,
      maxAp: this.combat.maxAp || CONFIG.COMBAT.MAX_AP,
      isEnemyPhase: this.isEnemyPhase,
      totalScore: this.stageManager.totalScore,
      heroes: this.heroes,
      numberPool: this.combat.numberPool,
      selectedPoolIndex: this.combat.selectedPoolIndex,
      activeActor: this.combat.activeActor,
      previewInfo: this.previewInfo,
      activeAxioms: this.axiomSystem.getActiveAxioms(),
    });
  }

  /**
   * Checks pointer collision with heroes and enemies on Canvas
   */
  _handleCanvasPointerInteraction() {
    const px = this.input.pointer.x;
    const py = this.input.pointer.y;
    const clicked = this.input.pointer.justClicked;

    // Find entity under cursor
    let hovered = null;
    const validTargets = this.combat.getValidTargets(this.heroes, this.enemies);

    // Check enemies
    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        const dist = Math.hypot(px - enemy.x, py - enemy.y);
        if (dist <= enemy.radius + 15) {
          hovered = enemy;
          break;
        }
      }
    }

    // Check heroes
    if (!hovered) {
      for (const hero of this.heroes) {
        if (hero.isAlive()) {
          const dist = Math.hypot(px - hero.x, py - hero.y);
          if (dist <= hero.radius + 15) {
            hovered = hero;
            break;
          }
        }
      }
    }

    this.hoveredEntity = hovered;

    // Calculation preview
    if (this.combat.activeActor && hovered && validTargets.includes(hovered)) {
      this.previewInfo = this.combat.getCalculationPreview(hovered);
    } else {
      this.previewInfo = null;
    }

    // Handle clicks on canvas entities
    if (clicked && hovered) {
      // 1. If pool number is selected and clicked on a hero -> equip!
      if (this.combat.selectedPoolIndex !== null && this.heroes.includes(hovered)) {
        this.handleEquipHero(hovered);
        return;
      }

      // 2. If an actor is active and clicked on a valid target -> EXECUTE!
      if (this.combat.activeActor && validTargets.includes(hovered)) {
        const result = this.combat.executeAction(
          hovered,
          this.heroes,
          this.enemies,
          this.particles,
          this.audio
        );

        if (result.allEnemiesDead) {
          this.handleStageClear();
          return;
        }

        if (result.autoEndTurn) {
          this.startEnemyPhase();
          return;
        }
        return;
      }

      // 3. If clicked on a hero -> select that hero
      if (this.heroes.includes(hovered)) {
        this.handleSelectHero(hovered);
      }
    }
  }

  render() {
    const ctx = this.ctx;

    // Clear background
    ctx.fillStyle = CONFIG.CANVAS.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);

    // 1. Draw dynamic atmospheric stage background:
    // Stages 1-3: Enchanted Fantasy Forest
    // Stages 4-5: Deep Medieval Dungeon
    // Stage 6: Grand Golden Astral Sanctuary (Factorio Final Boss)
    const stageNum = this.stageManager ? this.stageManager.getCurrentStageNumber() : 1;
    this.particles.drawStageBackground(ctx, stageNum);

    // 2. Draw active entities only during combat views
    const inCombat =
      this.state !== CONFIG.GAME_STATES.TITLE &&
      this.state !== CONFIG.GAME_STATES.STAGE_SELECT;

    if (inCombat) {
      const validTargets = this.combat.getValidTargets(this.heroes, this.enemies);

      // Draw Heroes
      for (const hero of this.heroes) {
        const isSelected = this.combat.activeActor === hero;
        const isCandidate = validTargets.includes(hero);
        const isHovered = this.hoveredEntity === hero;
        hero.draw(ctx, isSelected, isCandidate, isHovered);
      }

      // Draw Enemies
      for (const enemy of this.enemies) {
        const isCandidate = validTargets.includes(enemy);
        const isHovered = this.hoveredEntity === enemy;
        enemy.draw(ctx, isCandidate, isHovered);
      }

      // 3. Draw combat spell effects, beams, floating numbers, particles
      this.particles.drawOverlays(ctx);
    }
  }
}
