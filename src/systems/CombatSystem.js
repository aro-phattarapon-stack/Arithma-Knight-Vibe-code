import { CONFIG } from '../config.js';

/**
 * CombatSystem manages turn flow, AP budget, arithmetic calculations,
 * targeting validations, real-time calculation previews, and enemy retaliation.
 */
export class CombatSystem {
  constructor() {
    this.maxAp = CONFIG.COMBAT.MAX_AP;
    this.ap = CONFIG.COMBAT.MAX_AP;
    this.round = 1;
    this.numberPool = [];
    this.selectedPoolIndex = null;
    this.activeActor = null; // Hero currently in READY / targeting mode
    this.hoveredTarget = null;
    this.combatLogs = [];
    this.onLogCallback = null;
    this.axiomSystem = null;
  }

  setAxiomSystem(axiomSystem) {
    this.axiomSystem = axiomSystem;
  }

  reset() {
    this.maxAp = CONFIG.COMBAT.MAX_AP;
    this.ap = CONFIG.COMBAT.MAX_AP;
    this.round = 1;
    this.numberPool = [];
    this.selectedPoolIndex = null;
    this.activeActor = null;
    this.hoveredTarget = null;
    this.combatLogs = [];
  }

  setLogCallback(cb) {
    this.onLogCallback = cb;
  }

  log(message, type = 'info') {
    const entry = { text: message, type, time: Date.now() };
    this.combatLogs.push(entry);
    if (this.onLogCallback) {
      this.onLogCallback(entry);
    }
  }

  /**
   * Generates a fresh shared random number pool
   * Supports Infinity Well axiom (5 numbers instead of 4)
   * @param {number|null} customSize
   */
  rollNumberPool(customSize = null) {
    let poolSize = customSize;
    if (poolSize === null) {
      poolSize = this.axiomSystem?.hasAxiom('infinity_well') ? 5 : CONFIG.COMBAT.NUMBER_POOL_SIZE;
    }

    this.numberPool = [];
    for (let i = 0; i < poolSize; i++) {
      const min = CONFIG.COMBAT.POOL_MIN_VALUE;
      const max = CONFIG.COMBAT.POOL_MAX_VALUE;
      const rolled = Math.floor(Math.random() * (max - min + 1)) + min;
      this.numberPool.push(rolled);
    }
    this.selectedPoolIndex = null;
  }

  /**
   * Begins a new round: resets AP, charges Paladin, rolls pool, clears non-Paladin held numbers
   * Supports Calculus AP Booster axiom (4 AP on Round 1)
   * @param {Hero[]} heroes
   * @param {import('./AxiomSystem.js').AxiomSystem|null} axiomSystem
   */
  startNewRound(heroes, axiomSystem = null) {
    if (axiomSystem) {
      this.axiomSystem = axiomSystem;
    }

    let roundAp = CONFIG.COMBAT.MAX_AP;
    if (this.round === 1 && this.axiomSystem?.hasAxiom('calculus_ap')) {
      roundAp = CONFIG.COMBAT.MAX_AP + 1; // 4 AP on Round 1!
    }

    this.maxAp = roundAp;
    this.ap = roundAp;
    this.selectedPoolIndex = null;
    this.activeActor = null;
    this.hoveredTarget = null;

    // Clear unused held numbers on non-Paladin heroes; handle Paladin multiplier charge / reset
    for (const hero of heroes) {
      if (hero.id !== 'paladin') {
        hero.clearHeld();
      } else {
        if (this.round === 1) {
          hero.resetPaladin();
        } else {
          // Paladin charges +1x each round up to 3x
          hero.chargePaladin();
        }
      }
    }

    this.rollNumberPool();

    if (this.round === 1 && this.axiomSystem?.hasAxiom('calculus_ap')) {
      this.log(`[ROUND 1] Calculus AP Booster active! 4 Action Points granted.`, 'round');
    } else {
      this.log(`[ROUND ${this.round}] ${this.ap} Action Points granted to the party.`, 'round');
    }
  }

  selectPoolNumber(index) {
    if (index >= 0 && index < this.numberPool.length) {
      this.selectedPoolIndex = this.selectedPoolIndex === index ? null : index;
      return this.selectedPoolIndex !== null;
    }
    return false;
  }

  /**
   * Free Action (0 AP): Equips selected pool number to living hero
   * Note: Paladin cannot hold numbers; charges multiplier automatically per turn.
   * @param {Hero} hero
   * @returns {number|null} Equipped number, or null if failed
   */
  equipHeroFromPool(hero) {
    if (this.selectedPoolIndex === null) return null;
    if (!hero || !hero.isAlive()) return null;

    if (hero.id === 'paladin') {
      this.log(`[HONOR] Paladin cannot hold numbers! Charges turn multiplier automatically (currently ×${hero.multiplier}).`, 'info');
      return null;
    }

    const equippedVal = this.numberPool.splice(this.selectedPoolIndex, 1)[0];
    hero.equip(equippedVal);
    this.selectedPoolIndex = null;

    this.log(`Equipped [${equippedVal}] to ${hero.name}.`, 'equip');
    return equippedVal;
  }

  /**
   * Put equipped hero into READY / targeting mode
   * @param {Hero} hero
   */
  selectActor(hero) {
    if (!hero || !hero.isAlive()) return false;

    // Non-Paladins must have a held value. Paladin can act if they have a multiplier or held value.
    if (hero.id !== 'paladin' && hero.heldValue === null) {
      return false;
    }

    if (this.activeActor === hero) {
      // Toggle off
      this.activeActor = null;
      return false;
    }

    this.activeActor = hero;
    return true;
  }

  cancelActorSelection() {
    this.activeActor = null;
    this.hoveredTarget = null;
  }

  /**
   * Gets list of valid targets for the currently selected actor
   * @param {Hero[]} heroes
   * @param {Enemy[]} enemies
   * @returns {Array<Hero|Enemy>}
   */
  getValidTargets(heroes, enemies) {
    if (!this.activeActor) return [];

    switch (this.activeActor.id) {
      case 'knight':
      case 'berserker':
        return enemies.filter((e) => e.isAlive());

      case 'cleric':
        // Cleric can target living allies to heal OR living negative entities to cleanse/annihilate towards 0
        const livingHeroes = heroes.filter((h) => h.isAlive());
        const negativeEnemies = enemies.filter((e) => e.isAlive() && e.isNegative);
        return [...livingHeroes, ...negativeEnemies];

      case 'paladin':
        // Paladin can target any living ally that is currently holding a number (excluding self)
        return heroes.filter((h) => h.isAlive() && h.id !== 'paladin' && h.heldValue !== null);

      default:
        return [];
    }
  }

  /**
   * Real-time calculation preview for currently active actor hovering a candidate target
   * @param {Hero|Enemy} target
   * @returns {Object|null}
   */
  getCalculationPreview(target) {
    if (!this.activeActor || !target) return null;

    const actor = this.activeActor;

    if (actor.id === 'knight' && target.hp !== undefined) {
      const held = actor.heldValue || 0;
      const euclideanBonus = this.axiomSystem?.hasAxiom('euclidean_blade') ? 6 : 0;
      const totalStrike = held + euclideanBonus;

      if (target.isNegative) {
        const projectedHp = target.hp - totalStrike;
        return {
          actorName: actor.name,
          targetName: target.name,
          type: 'subtract',
          formula: `${target.hp} − ${totalStrike} = ${projectedHp}`,
          currentVal: target.hp,
          projectedVal: projectedHp,
          diff: `-${totalStrike}`,
          summary: `NEGATIVE DEBT! Subtraction drives HP to ${projectedHp} (further from 0). Use Cleric (+) or Berserker (÷)!`,
        };
      }

      const projectedHp = Math.max(0, target.hp - totalStrike);
      const diff = target.hp - projectedHp;
      let summary = euclideanBonus > 0 ? `Deals ${diff} damage (+6 Euclidean Blade bonus)` : `Deals ${diff} damage`;
      if (
        projectedHp === 0 &&
        target.isFactorialBoss &&
        target.factorialPhases &&
        target.currentPhaseIndex < target.factorialPhases.length - 1
      ) {
        const next = target.factorialPhases[target.currentPhaseIndex + 1];
        summary = `Breaches ${target.glyph}! Triggers Collapse into ${next.glyph} (${next.hp} HP)!`;
      }
      return {
        actorName: actor.name,
        targetName: target.name,
        type: 'subtract',
        formula: euclideanBonus > 0 ? `${target.hp} − (${held} + 6)` : `${target.hp} − ${held}`,
        currentVal: target.hp,
        projectedVal: projectedHp,
        diff: `-${diff}`,
        summary,
      };
    }

    if (actor.id === 'berserker' && target.hp !== undefined) {
      const held = Math.max(1, actor.heldValue || 1);

      if (target.isNegative) {
        let normalProjectedHp = Math.trunc(target.hp / held);
        if (normalProjectedHp > 0) normalProjectedHp = 0;
        const isKill = normalProjectedHp === 0;
        return {
          actorName: actor.name,
          targetName: target.name,
          type: 'divide',
          formula: `trunc(${target.hp} ÷ ${held}) = ${normalProjectedHp}`,
          currentVal: target.hp,
          projectedVal: normalProjectedHp,
          diff: `${normalProjectedHp - target.hp > 0 ? '+' : ''}${normalProjectedHp - target.hp}`,
          summary: isKill
            ? `DIVIDES TO 0! Banishes ${target.name}!`
            : `Shrinks negative debt: ${target.hp} ➔ ${normalProjectedHp} HP`,
        };
      }

      let normalProjectedHp = Math.floor(target.hp / held);
      let diff = target.hp - normalProjectedHp;

      let hasPrimeCleave = false;
      if (this.axiomSystem?.hasAxiom('prime_cleave') && diff < 12) {
        diff = Math.min(target.hp, 12);
        normalProjectedHp = target.hp - diff;
        hasPrimeCleave = true;
      }

      let summary = hasPrimeCleave
        ? `Prime Cleave active! Deals ${diff} damage (min 12 floor)`
        : `Divides HP! Deals ${diff} damage`;
      if (
        normalProjectedHp === 0 &&
        target.isFactorialBoss &&
        target.factorialPhases &&
        target.currentPhaseIndex < target.factorialPhases.length - 1
      ) {
        const next = target.factorialPhases[target.currentPhaseIndex + 1];
        summary = `Breaches ${target.glyph}! Triggers Collapse into ${next.glyph} (${next.hp} HP)!`;
      }
      return {
        actorName: actor.name,
        targetName: target.name,
        type: 'divide',
        formula: hasPrimeCleave ? `max(12, floor(${target.hp} ÷ ${held}))` : `floor(${target.hp} ÷ ${held})`,
        currentVal: target.hp,
        projectedVal: normalProjectedHp,
        diff: `-${diff}`,
        summary,
      };
    }

    if (actor.id === 'cleric' && (target.maxHp !== undefined || target.isNegative)) {
      const held = actor.heldValue || 0;

      if (target.isNegative) {
        const projectedHp = Math.min(0, target.hp + held);
        const isKill = projectedHp === 0;
        const diff = projectedHp - target.hp;
        return {
          actorName: actor.name,
          targetName: target.name,
          type: 'heal',
          formula: `${target.hp} + ${held} = ${projectedHp}`,
          currentVal: target.hp,
          projectedVal: projectedHp,
          diff: `+${diff}`,
          summary: isKill
            ? `CLEANSES TO 0! Restores debt and banishes ${target.name}!`
            : `Adds positive essence: ${target.hp} ➔ ${projectedHp} HP (closer to 0)`,
        };
      }

      const projectedHp = Math.min(target.maxHp, target.hp + held);
      const diff = projectedHp - target.hp;
      const hasResonance = this.axiomSystem?.hasAxiom('harmonic_resonance');
      const resonanceText = hasResonance ? ' (+4 splash to all living allies)' : '';
      return {
        actorName: actor.name,
        targetName: target.name,
        type: 'heal',
        formula: `${target.hp} + ${held}`,
        currentVal: target.hp,
        projectedVal: projectedHp,
        diff: `+${diff}`,
        summary: `Restores ${diff} HP (${projectedHp}/${target.maxHp})${resonanceText}`,
      };
    }

    if (actor.id === 'paladin' && target.heldValue !== undefined) {
      const mult = actor.multiplier;
      const oldHeld = target.heldValue;
      const projectedHeld = oldHeld * mult;
      return {
        actorName: actor.name,
        targetName: target.name,
        type: 'buff',
        formula: `${oldHeld} × ${mult}`,
        currentVal: oldHeld,
        projectedVal: projectedHeld,
        diff: `×${mult}`,
        summary: `Multiplies held number to ${projectedHeld}!`,
      };
    }

    return null;
  }

  /**
   * Executes combat action (Costs 1 AP)
   * @param {Hero|Enemy} target
   * @param {Hero[]} heroes
   * @param {Enemy[]} enemies
   * @param {import('./ParticleSystem.js').ParticleSystem} particles
   * @param {import('./AudioSystem.js').AudioSystem} audio
   * @returns {{ success: boolean, autoEndTurn: boolean, allEnemiesDead: boolean }}
   */
  executeAction(target, heroes, enemies, particles, audio) {
    if (!this.activeActor || this.ap <= 0) {
      return { success: false, autoEndTurn: false, allEnemiesDead: false };
    }

    const actor = this.activeActor;
    this.ap--;

    actor.triggerAttackLunge(target.x, target.y);

    switch (actor.id) {
      case 'knight': {
        const held = actor.heldValue;
        const euclideanBonus = this.axiomSystem?.hasAxiom('euclidean_blade') ? 6 : 0;
        const strikeDamage = held + euclideanBonus;

        if (target.isNegative) {
          target.takeDamage(strikeDamage);
          actor.clearHeld();
          audio.playKnightSlash();
          particles.spawnSlash(target.x, target.y, actor.color, 'slash');
          particles.spawnFloatingText(target.x, target.y, `-${strikeDamage} (${target.hp})`, '#f87171', 44);
          this.log(`[WARNING] ${actor.name}'s subtraction pushed ${target.name}'s debt deeper to ${target.hp} HP! Use Cleric (+) or Berserker (÷)!`, 'warning');
          break;
        }

        const damage = target.takeDamage(strikeDamage);
        actor.clearHeld();

        audio.playKnightSlash();
        particles.spawnSlash(target.x, target.y, actor.color, 'slash');
        particles.spawnFloatingText(target.x, target.y, `-${damage}`, '#f87171', 44);

        if (euclideanBonus > 0) {
          this.log(`[STRIKE] ${actor.name} strikes with Euclidean Blade (+6)! Deals ${damage} damage to ${target.name}! (${target.hp}/${target.maxHp} HP left)`, 'attack');
        } else {
          this.log(`[STRIKE] ${actor.name} strikes ${target.name} for ${damage} damage! (${target.hp}/${target.maxHp} HP left)`, 'attack');
        }

        if (target.lastPhaseShift) {
          const shift = target.lastPhaseShift;
          audio.playBossPhaseShift?.() || audio.playStageClear?.();
          particles.spawnDeathBurst(target.x, target.y, '#ec4899');
          particles.spawnFloatingText(
            target.x,
            target.y - 75,
            `FACTORIAL COLLAPSE! ${shift.from} ➔ ${shift.to} (${shift.hp} HP)`,
            '#f43f5e',
            34
          );
          this.log(`[COLLAPSE] Factorio undergoes Factorial Collapse! ${shift.from} breached ➔ Collapses into ${shift.to} (${shift.hp} HP)!`, 'boss');
        } else if (!target.isAlive()) {
          particles.spawnDeathBurst(target.x, target.y, target.color);
          this.log(`[PURGE] ${target.name} was purged!`, 'kill');
        }
        break;
      }

      case 'berserker': {
        const held = Math.max(1, actor.heldValue);
        let normalNewHp;
        if (target.isNegative) {
          normalNewHp = Math.trunc(target.hp / held);
          if (normalNewHp > 0) normalNewHp = 0;
        } else {
          normalNewHp = Math.floor(target.hp / held);
        }
        let damageDealt = target.hp - normalNewHp;

        let hasPrimeCleave = false;
        if (!target.isNegative && this.axiomSystem?.hasAxiom('prime_cleave') && damageDealt < 12) {
          damageDealt = Math.min(target.hp, 12);
          normalNewHp = target.hp - damageDealt;
          hasPrimeCleave = true;
        }

        const damage = target.setHp(normalNewHp);
        actor.clearHeld();

        audio.playBerserkerDivision();
        particles.spawnSlash(target.x, target.y, '#ef4444', 'divide');
        particles.spawnFloatingText(target.x, target.y, `÷${held} (${normalNewHp})`, '#ef4444', 46);

        if (target.isNegative) {
          if (normalNewHp === 0) {
            particles.spawnDeathBurst(target.x, target.y, target.color);
            this.log(`[SHATTER] ${actor.name} divides ${target.name} by ${held} directly to 0! Negative anomaly destroyed!`, 'kill');
          } else {
            this.log(`[CLEAVE] ${actor.name} divides ${target.name} by ${held}! Negative debt shrunk: ${target.hp} HP left!`, 'divide');
          }
        } else if (hasPrimeCleave) {
          this.log(`[CLEAVE] ${actor.name} cleaves ${target.name} with Prime Cleave! (Dealt guaranteed ${damage} damage)`, 'divide');
        } else {
          this.log(`[CLEAVE] ${actor.name} cleaves ${target.name} with ÷${held}! Dealt ${damage} damage (${target.hp}/${target.maxHp} HP left)`, 'divide');
        }

        if (target.lastPhaseShift) {
          const shift = target.lastPhaseShift;
          audio.playBossPhaseShift?.() || audio.playStageClear?.();
          particles.spawnDeathBurst(target.x, target.y, '#ec4899');
          particles.spawnFloatingText(
            target.x,
            target.y - 75,
            `FACTORIAL COLLAPSE! ${shift.from} ➔ ${shift.to} (${shift.hp} HP)`,
            '#f43f5e',
            34
          );
          this.log(`[COLLAPSE] Factorio undergoes Factorial Collapse! ${shift.from} breached ➔ Collapses into ${shift.to} (${shift.hp} HP)!`, 'boss');
        } else if (!target.isAlive()) {
          particles.spawnDeathBurst(target.x, target.y, target.color);
          this.log(`[SHATTER] ${target.name} was shattered!`, 'kill');
        }
        break;
      }

      case 'cleric': {
        const held = actor.heldValue;
        if (target.isNegative) {
          const oldHp = target.hp;
          const newHp = Math.min(0, target.hp + held);
          const added = newHp - oldHp;
          target.hp = newHp;
          actor.clearHeld();

          audio.playClericHeal();
          particles.spawnHealMotes(target.x, target.y);
          particles.spawnFloatingText(target.x, target.y, `+${added} (➔ ${newHp})`, '#34d399', 46);

          if (newHp === 0) {
            target.isDead = true;
            particles.spawnDeathBurst(target.x, target.y, '#34d399');
            this.log(`[NULLIFY] ${actor.name} restores ${target.name} with +${added} to 0 HP! Negative anomaly banished!`, 'kill');
          } else {
            this.log(`[CLEANSE] ${actor.name} adds +${added} to ${target.name}! Negative debt reduced: ${oldHp} ➔ ${newHp} HP!`, 'heal');
          }
        } else {
          const healed = target.heal(held);
          actor.clearHeld();

          audio.playClericHeal();
          particles.spawnHealMotes(target.x, target.y);
          particles.spawnFloatingText(target.x, target.y, `+${healed} HP`, '#34d399', 42);

          this.log(`[HEAL] ${actor.name} heals ${target.name} for +${healed} HP! (${target.hp}/${target.maxHp} HP)`, 'heal');

          if (this.axiomSystem?.hasAxiom('harmonic_resonance')) {
            const splashAllies = heroes.filter((h) => h.isAlive() && h !== target);
            for (const ally of splashAllies) {
              const splashAmt = ally.heal(4);
              if (splashAmt > 0) {
                particles.spawnHealMotes(ally.x, ally.y);
                particles.spawnFloatingText(ally.x, ally.y, `+${splashAmt} Splash`, '#6ee7b7', 30);
              }
            }
            if (splashAllies.length > 0) {
              this.log(`[HARMONIC RESONANCE] Healing harmonics spread +4 HP to all other living allies!`, 'heal');
            }
          }
        }
        break;
      }

      case 'paladin': {
        const mult = actor.multiplier;
        const oldHeld = target.heldValue;
        target.heldValue = oldHeld * mult;
        actor.resetPaladin();

        audio.playPaladinBuff();
        particles.spawnPaladinBuffBeam(actor.x, actor.y, target.x, target.y, '#f59e0b');
        particles.spawnFloatingText(target.x, target.y, `×${mult} BUFF! (${target.heldValue})`, '#fbbf24', 42);

        this.log(`[EMPOWER] ${actor.name} empowers ${target.name}! Held value multiplied from ${oldHeld} to ${target.heldValue}!`, 'buff');
        break;
      }
    }

    this.activeActor = null;
    this.hoveredTarget = null;

    // Check Victory
    const allEnemiesDead = enemies.every((e) => !e.isAlive());

    // Check Auto-End Turn Condition:
    // AP reaches 0, OR both Number Pool AND all non-Paladin held numbers are empty
    const nonPaladinHasHeld = heroes.some((h) => h.id !== 'paladin' && h.heldValue !== null);
    const poolEmpty = this.numberPool.length === 0;
    const autoEndTurn = this.ap <= 0 || (poolEmpty && !nonPaladinHasHeld);

    return {
      success: true,
      autoEndTurn,
      allEnemiesDead,
    };
  }

  /**
   * Executes Enemy Phase sequentially
   * @param {Hero[]} heroes
   * @param {Enemy[]} enemies
   * @param {import('./ParticleSystem.js').ParticleSystem} particles
   * @param {import('./AudioSystem.js').AudioSystem} audio
   * @param {Function} onStep
   * @param {Function} onComplete
   */
  executeEnemyPhase(heroes, enemies, particles, audio, onStep, onComplete) {
    const livingEnemies = enemies.filter((e) => e.isAlive());
    if (livingEnemies.length === 0) {
      if (onComplete) onComplete({ gameOver: false });
      return;
    }

    this.log(`[RETALIATION] ${livingEnemies.length} anomaly entities stir for counter-assault!`, 'enemy_phase');

    let idx = 0;
    const step = () => {
      if (idx >= livingEnemies.length) {
        // Check defeat
        const allHeroesDead = heroes.every((h) => !h.isAlive());
        if (onComplete) onComplete({ gameOver: allHeroesDead });
        return;
      }

      const enemy = livingEnemies[idx];
      idx++;

      if (!enemy.isAlive()) {
        step();
        return;
      }

      // Pick living hero target (prioritize knight frontline or lowest HP)
      const livingHeroes = heroes.filter((h) => h.isAlive());
      if (livingHeroes.length === 0) {
        if (onComplete) onComplete({ gameOver: true });
        return;
      }

      // 60% chance to attack lowest HP hero, 40% random
      let targetHero = livingHeroes[0];
      if (Math.random() < 0.6) {
        targetHero = [...livingHeroes].sort((a, b) => a.hp - b.hp)[0];
      } else {
        targetHero = livingHeroes[Math.floor(Math.random() * livingHeroes.length)];
      }

      enemy.triggerAttackLunge(targetHero.x, targetHero.y);

      let incomingAttack = enemy.attack;
      if (this.axiomSystem?.hasAxiom('pythagorean_bulwark') && targetHero.hp <= targetHero.maxHp * 0.3) {
        incomingAttack = Math.max(1, Math.ceil(incomingAttack * 0.6));
      }

      const hadBarrier = targetHero.barrier > 0;
      const dmg = targetHero.takeDamage(incomingAttack);

      if (hadBarrier && dmg === 0) {
        audio.playPaladinBuff?.() || audio.playEnemyAttack();
        particles.spawnSlash(targetHero.x, targetHero.y, '#38bdf8', 'slash');
        particles.spawnFloatingText(targetHero.x, targetHero.y, 'BARRIER NULLIFIED (×0)', '#38bdf8', 36);
        this.log(`[ZERO BARRIER] ${targetHero.name}'s Zero Barrier nullified ${enemy.name}'s ${enemy.attack} damage! (0 damage taken)`, 'buff');
      } else {
        audio.playEnemyAttack();
        particles.spawnSlash(targetHero.x, targetHero.y, enemy.color, 'slash');
        particles.spawnFloatingText(targetHero.x, targetHero.y, `-${dmg}`, '#ef4444', 40);

        if (incomingAttack < enemy.attack) {
          this.log(`[COUNTER] ${enemy.name} strikes ${targetHero.name} for ${dmg} damage! (Reduced by Pythagorean Bulwark, ${targetHero.hp}/${targetHero.maxHp} HP left)`, 'enemy_attack');
        } else {
          this.log(`[COUNTER] ${enemy.name} strikes ${targetHero.name} for ${dmg} damage! (${targetHero.hp}/${targetHero.maxHp} HP left)`, 'enemy_attack');
        }
      }

      if (!targetHero.isAlive()) {
        this.log(`[FALLEN] ${targetHero.name} has fallen in battle!`, 'hero_fall');
      }

      if (onStep) onStep();

      setTimeout(step, CONFIG.COMBAT.ENEMY_TURN_DELAY_MS);
    };

    setTimeout(step, CONFIG.COMBAT.ROUND_START_DELAY_MS);
  }
}
