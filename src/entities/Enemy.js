import { CONFIG } from '../config.js';

/**
 * Enemy Entity representing hostile Numerical Anomalies:
 * - Constanta, Positron, Nullifier, Monomial, Radical, Polynome, Matrix Golem
 * - Stage 5 Boss: Big Int (massive integer values)
 * - Stage 6 Final Boss: Factorio (climactic factorial anomaly)
 */
export class Enemy {
  /**
   * @param {Object} enemyConfig - Enemy configuration from CONFIG.STAGES
   */
  constructor(enemyConfig) {
    this.id = enemyConfig.ID;
    this.name = enemyConfig.NAME;
    this.title = enemyConfig.TITLE;
    this.maxHp = enemyConfig.HP;
    this.hp = enemyConfig.HP;
    this.attack = enemyConfig.ATTACK;
    this.color = enemyConfig.COLOR;
    this.accent = enemyConfig.ACCENT;
    this.glyph = enemyConfig.GLYPH;
    this.scale = enemyConfig.SCALE || 1.0;
    this.isBoss = !!enemyConfig.IS_BOSS;
    this.isFactorialBoss = !!enemyConfig.IS_FACTORIAL_BOSS;
    this.isNegative = !!enemyConfig.IS_NEGATIVE || (enemyConfig.HP < 0);
    this.factorialPhases = enemyConfig.FACTORIAL_PHASES ? [...enemyConfig.FACTORIAL_PHASES] : null;
    this.currentPhaseIndex = 0;
    this.lastPhaseShift = null;

    this.baseX = enemyConfig.X;
    this.baseY = enemyConfig.Y;
    this.x = this.baseX;
    this.y = this.baseY;
    this.radius = 50 * this.scale;

    // Visual animation states
    this.lungeX = 0;
    this.lungeY = 0;
    this.hitFlashTimer = 0;
    this.shakeTimer = 0;
    this.idleTimer = Math.random() * 10;
    this.isDead = false;
  }

  isAlive() {
    if (this.isNegative) {
      return this.hp < 0 && !this.isDead;
    }
    return this.hp > 0 && !this.isDead;
  }

  takeDamage(amount) {
    if (this.isDead) return 0;
    this.lastPhaseShift = null;

    if (this.isNegative) {
      // Subtraction on negative numbers pushes HP further into the negative debt
      this.hp -= amount;
      this.hitFlashTimer = 0.25;
      this.shakeTimer = 0.3;
      return amount;
    }

    const actualDamage = Math.min(this.hp, Math.max(0, amount));
    this.hp -= actualDamage;
    this.hitFlashTimer = 0.25;
    this.shakeTimer = 0.3;

    if (this.hp <= 0) {
      if (
        this.isFactorialBoss &&
        this.factorialPhases &&
        this.currentPhaseIndex < this.factorialPhases.length - 1
      ) {
        // Trigger Factorial Collapse to next lower phase!
        const prevPhase = this.factorialPhases[this.currentPhaseIndex];
        this.currentPhaseIndex++;
        const nextPhase = this.factorialPhases[this.currentPhaseIndex];

        this.hp = nextPhase.hp;
        this.maxHp = nextPhase.hp;
        this.glyph = nextPhase.glyph;
        this.title = nextPhase.title;
        this.shakeTimer = 0.65;
        this.hitFlashTimer = 0.5;

        this.lastPhaseShift = {
          from: prevPhase.glyph,
          to: nextPhase.glyph,
          hp: nextPhase.hp,
          phaseNum: this.currentPhaseIndex + 1,
          totalPhases: this.factorialPhases.length,
        };
      } else {
        this.hp = 0;
        this.isDead = true;
      }
    }
    return actualDamage;
  }

  /**
   * Used for Berserker division (direct new HP calculation)
   */
  setHp(newHp) {
    if (this.isDead) return 0;
    this.lastPhaseShift = null;
    const prevHp = this.hp;

    if (this.isNegative) {
      // For negative enemies, Berserker division / Cleric addition moves HP towards 0
      this.hp = Math.min(0, newHp);
      const damageDealt = prevHp - this.hp;
      this.hitFlashTimer = 0.3;
      this.shakeTimer = 0.35;
      if (this.hp === 0) {
        this.isDead = true;
      }
      return damageDealt;
    }

    this.hp = Math.max(0, Math.min(this.maxHp, newHp));
    const damageDealt = prevHp - this.hp;

    this.hitFlashTimer = 0.3;
    this.shakeTimer = 0.35;

    if (this.hp <= 0) {
      if (
        this.isFactorialBoss &&
        this.factorialPhases &&
        this.currentPhaseIndex < this.factorialPhases.length - 1
      ) {
        // Trigger Factorial Collapse to next lower phase!
        const prevPhase = this.factorialPhases[this.currentPhaseIndex];
        this.currentPhaseIndex++;
        const nextPhase = this.factorialPhases[this.currentPhaseIndex];

        this.hp = nextPhase.hp;
        this.maxHp = nextPhase.hp;
        this.glyph = nextPhase.glyph;
        this.title = nextPhase.title;
        this.shakeTimer = 0.65;
        this.hitFlashTimer = 0.5;

        this.lastPhaseShift = {
          from: prevPhase.glyph,
          to: nextPhase.glyph,
          hp: nextPhase.hp,
          phaseNum: this.currentPhaseIndex + 1,
          totalPhases: this.factorialPhases.length,
        };
      } else {
        this.hp = 0;
        this.isDead = true;
      }
    }
    return damageDealt;
  }

  triggerAttackLunge(targetX, targetY) {
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    this.lungeX = Math.cos(angle) * (CONFIG.VISUALS.HERO_ATTACK_LUNGE * 1.2);
    this.lungeY = Math.sin(angle) * (CONFIG.VISUALS.HERO_ATTACK_LUNGE * 1.2);
  }

  update(dt) {
    this.idleTimer += dt * 2.2;

    // Decay lunge offset back to slot
    this.lungeX *= Math.pow(0.001, dt);
    this.lungeY *= Math.pow(0.001, dt);

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    // Floating hover motion
    const hoverY = this.isAlive() ? Math.sin(this.idleTimer) * 8 : 0;
    const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * 14 : 0;
    const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * 14 : 0;

    this.x = this.baseX + this.lungeX + shakeX;
    this.y = this.baseY + this.lungeY + hoverY + shakeY;
  }

  /**
   * Render anomaly monster
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} isTargetCandidate - Valid target for selected hero
   * @param {boolean} isHovered - Cursor hovering over this enemy
   */
  draw(ctx, isTargetCandidate = false, isHovered = false) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Target Reticle / Crosshair Indicator
    if (isTargetCandidate) {
      ctx.save();
      ctx.strokeStyle = isHovered ? '#ef4444' : 'rgba(239, 68, 68, 0.65)';
      ctx.lineWidth = isHovered ? 5 : 3;
      ctx.setLineDash([12, 8]);
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = isHovered ? 24 : 12;

      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 18, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      const crossSize = this.radius + 24;
      ctx.beginPath();
      ctx.moveTo(-crossSize, 0);
      ctx.lineTo(-this.radius - 8, 0);
      ctx.moveTo(this.radius + 8, 0);
      ctx.lineTo(crossSize, 0);
      ctx.moveTo(0, -crossSize);
      ctx.lineTo(0, -this.radius - 8);
      ctx.moveTo(0, this.radius + 8);
      ctx.lineTo(0, crossSize);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Floor Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius + 25, this.radius * 0.9, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Boss Crown / Aura
    if (this.isBoss) {
      ctx.save();
      const auraGrad = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius * 1.5);
      auraGrad.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Crown over boss
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-24, -this.radius - 30);
      ctx.lineTo(-30, -this.radius - 50);
      ctx.lineTo(-12, -this.radius - 40);
      ctx.lineTo(0, -this.radius - 56);
      ctx.lineTo(12, -this.radius - 40);
      ctx.lineTo(30, -this.radius - 50);
      ctx.lineTo(24, -this.radius - 30);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 4. Anomaly Geometric Body
    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 30;
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.isBoss ? 35 : 20;
    }

    if (this.isBoss && this.id === 'final_boss_factorio') {
      this._drawFactorioBody(ctx);
    } else if (this.isBoss && this.id === 'boss_big_int') {
      this._drawBigIntBody(ctx);
    } else if (this.id.startsWith('negabat') || this.isNegative) {
      this._drawNegabat(ctx);
    } else if (this.id.startsWith('constanta')) {
      this._drawConstanta(ctx);
    } else if (this.id.startsWith('positron')) {
      this._drawPositron(ctx);
    } else if (this.id.startsWith('nullifier')) {
      this._drawNullifier(ctx);
    } else if (this.id.startsWith('monomial')) {
      this._drawMonomial(ctx);
    } else if (this.id.startsWith('radical')) {
      this._drawRadical(ctx);
    } else if (this.id.startsWith('polynome')) {
      this._drawPolynome(ctx);
    } else if (this.id.startsWith('vector')) {
      this._drawVector(ctx);
    } else if (this.id.startsWith('matrix_golem')) {
      this._drawMatrixGolem(ctx);
    } else if (this.id.startsWith('scalar_imp')) {
      this._drawScalarImp(ctx);
    } else if (this.id.startsWith('bit_warden')) {
      this._drawBitWarden(ctx);
    } else if (this.id.startsWith('permutation')) {
      this._drawPermutationSpark(ctx);
    } else {
      this._drawStandardAnomalyBody(ctx);
      // Central Mathematical Glyph Core for generic fallback
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(28 * this.scale)}px 'Consolas', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.fillText(this.glyph, 0, 0);
      ctx.restore();
    }

    // Overhead Health Bar & Numeric Value
    this._drawHealthBar(ctx);

    ctx.restore();
  }

  // 1. Constanta: Ancient Runic Stone Obelisk Gargoyle
  _drawConstanta(ctx) {
    const r = this.radius;
    const hover = Math.sin(this.idleTimer * 2.2) * 3;
    ctx.save();
    ctx.translate(0, hover);

    // Orbiting Floating Stone Shards
    for (let i = 0; i < 3; i++) {
      const a = this.idleTimer * 1.2 + (i * Math.PI * 2) / 3;
      const sx = Math.cos(a) * (r * 1.25);
      const sy = Math.sin(a) * (r * 0.5);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(a);
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Heavy Faceted Granite Obelisk Body
    const stoneGrad = ctx.createLinearGradient(-r * 0.6, -r, r * 0.6, r);
    stoneGrad.addColorStop(0, '#475569');
    stoneGrad.addColorStop(0.5, '#334155');
    stoneGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = stoneGrad;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 12;

    // Tapered Monolith
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.55, -r * 0.4);
    ctx.lineTo(r * 0.45, r * 0.85);
    ctx.lineTo(-r * 0.45, r * 0.85);
    ctx.lineTo(-r * 0.55, -r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stone Shoulder Armor Slabs
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.4);
    ctx.lineTo(-r * 0.75, -r * 0.1);
    ctx.lineTo(-r * 0.45, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(r * 0.55, -r * 0.4);
    ctx.lineTo(r * 0.75, -r * 0.1);
    ctx.lineTo(r * 0.45, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Cyan Visor Eyes
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillRect(-r * 0.28, -r * 0.52, r * 0.2, 5);
    ctx.fillRect(r * 0.08, -r * 0.52, r * 0.2, 5);

    // Etched Constant Glyph Core (c or k)
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(20 * this.scale)}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillText(this.glyph || 'c', 0, r * 0.15);

    ctx.restore();
  }

  // 2. Positron: Blazing Plasma Wisp Demon
  _drawPositron(ctx) {
    const r = this.radius;
    const pulse = Math.sin(this.idleTimer * 4) * 0.08 + 1.0;
    const flicker = Math.sin(this.idleTimer * 8) * 3;
    ctx.save();
    ctx.scale(pulse, pulse);

    // Outer Crackling Fire / Plasma Tendrils
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + this.idleTimer * 1.5;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 191, 36, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.cos(a + 0.3) * (r * 1.3), Math.sin(a + 0.3) * (r * 1.3), Math.cos(a) * (r * 1.5), Math.sin(a) * (r * 1.5));
      ctx.stroke();
    }
    ctx.restore();

    // Blazing Core Gradient
    const fireGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.85);
    fireGrad.addColorStop(0, '#fef08a');
    fireGrad.addColorStop(0.35, '#f97316');
    fireGrad.addColorStop(0.75, '#dc2626');
    fireGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = fireGrad;
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 18;

    // Demon Silhouette with Fiery Horns
    ctx.beginPath();
    ctx.moveTo(0, r * 0.85 + flicker);
    ctx.quadraticCurveTo(r * 0.7, r * 0.4, r * 0.65, -r * 0.1);
    ctx.quadraticCurveTo(r * 0.85, -r * 0.6, r * 0.45, -r * 0.85); // Right Horn
    ctx.lineTo(r * 0.2, -r * 0.45);
    ctx.lineTo(0, -r * 0.55);
    ctx.lineTo(-r * 0.2, -r * 0.45);
    ctx.lineTo(-r * 0.45, -r * 0.85); // Left Horn
    ctx.quadraticCurveTo(-r * 0.85, -r * 0.6, -r * 0.65, -r * 0.1);
    ctx.quadraticCurveTo(-r * 0.7, r * 0.4, 0, r * 0.85 + flicker);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fiery Angled Eyes
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-r * 0.32, -r * 0.18);
    ctx.lineTo(-r * 0.12, -r * 0.08);
    ctx.lineTo(-r * 0.3, -r * 0.04);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(r * 0.32, -r * 0.18);
    ctx.lineTo(r * 0.12, -r * 0.08);
    ctx.lineTo(r * 0.3, -r * 0.04);
    ctx.closePath();
    ctx.fill();

    // Positive Charge Glyph (+ or +e)
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(22 * this.scale)}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(this.glyph || '+e', 0, r * 0.3);

    ctx.restore();
  }

  // 3. Nullifier: Void Shadow Wraith (Zero Phantom)
  _drawNullifier(ctx) {
    const r = this.radius;
    const floatY = Math.sin(this.idleTimer * 2.5) * 4;
    ctx.save();
    ctx.translate(0, floatY);

    // Shadowy Tattered Cloak / Tail
    const voidGrad = ctx.createLinearGradient(0, -r * 0.8, 0, r * 1.1);
    voidGrad.addColorStop(0, '#1e1b4b');
    voidGrad.addColorStop(0.5, '#0f172a');
    voidGrad.addColorStop(1, '#020617');
    ctx.fillStyle = voidGrad;
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4338ca';
    ctx.shadowBlur = 16;

    // Phantom Hood & Trailing Cloak
    const sway = Math.sin(this.idleTimer * 3) * 5;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.quadraticCurveTo(r * 0.65, -r * 0.5, r * 0.55, 0);
    ctx.quadraticCurveTo(r * 0.75, r * 0.6, r * 0.3 + sway, r * 1.05);
    ctx.lineTo(0, r * 0.7);
    ctx.lineTo(-r * 0.3 + sway, r * 1.05);
    ctx.quadraticCurveTo(-r * 0.75, r * 0.6, -r * 0.55, 0);
    ctx.quadraticCurveTo(-r * 0.65, -r * 0.5, 0, -r * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hollow Void Face with Piercing Icy Eyes
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.3, r * 0.3, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(-r * 0.12, -r * 0.32, 3.5, 0, Math.PI * 2);
    ctx.arc(r * 0.12, -r * 0.32, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Central Spinning Null / Void Sphere (The Zero Orb)
    ctx.save();
    const orbY = r * 0.22;
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#a5f3fc';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, orbY, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glyph 0
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(20 * this.scale)}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillText(this.glyph || '0', 0, orbY);
    ctx.restore();

    ctx.restore();
  }

  // 4. Monomial Sentry: Armored Mechanical Cyclops Automaton
  _drawMonomial(ctx) {
    const r = this.radius;
    const spin = this.idleTimer * 0.6;
    ctx.save();

    // Rotating Outer Armor Flaps / Spikes
    ctx.save();
    ctx.rotate(spin);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -r * 0.85);
      ctx.lineTo(0, -r * 1.25);
      ctx.lineTo(10, -r * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // Spherical Brass Armored Shell
    const shellGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 5, 0, 0, r);
    shellGrad.addColorStop(0, '#d97706');
    shellGrad.addColorStop(0.5, '#92400e');
    shellGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = shellGrad;
    ctx.strokeStyle = '#fcd34d';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Armored Rivets
    ctx.fillStyle = '#fde68a';
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (r * 0.7), Math.sin(a) * (r * 0.7), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing Crimson Cyclops Eye Iris
    const eyeGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.42);
    eyeGrad.addColorStop(0, '#ffffff');
    eyeGrad.addColorStop(0.3, '#f43f5e');
    eyeGrad.addColorStop(0.7, '#be123c');
    eyeGrad.addColorStop(1, '#881337');
    ctx.fillStyle = eyeGrad;
    ctx.strokeStyle = '#fecdd3';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupil Lens & Crosshair
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, 0); ctx.lineTo(r * 0.35, 0);
    ctx.moveTo(0, -r * 0.35); ctx.lineTo(0, r * 0.35);
    ctx.stroke();

    // Stamped Monomial Glyph on Upper Crest
    ctx.fillStyle = '#fffbeb';
    ctx.font = "bold 13px 'Cinzel', serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.glyph || 'x', 0, -r * 0.55);

    ctx.restore();
  }

  // 5. Radical Phantom: Jagged Root Chimera (Square Root Specter)
  _drawRadical(ctx) {
    const r = this.radius;
    const float = Math.sin(this.idleTimer * 2.8) * 4;
    ctx.save();
    ctx.translate(0, float);

    // Jagged Radical (√) Branching Spectral Claws
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(6, 78, 59, 0.75)';

    // Body shaped like an angular radical chimera
    ctx.beginPath();
    ctx.moveTo(-r * 0.75, r * 0.2);
    ctx.lineTo(-r * 0.45, r * 0.6); // Checkmark bottom dip
    ctx.lineTo(-r * 0.1, -r * 0.85); // High hook apex
    ctx.lineTo(r * 0.85, -r * 0.85); // Overbar
    ctx.lineTo(r * 0.75, r * 0.3); // Right claw
    ctx.lineTo(r * 0.45, r * 0.75); // Bottom tendril
    ctx.lineTo(0, r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ethereal Root Tendrils
    for (let i = 0; i < 3; i++) {
      const a = (i * 0.4) - 0.4;
      const sway = Math.sin(this.idleTimer * 4 + i) * 6;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.2);
      ctx.quadraticCurveTo(Math.sin(a) * r * 0.5 + sway, r * 0.7, Math.sin(a) * r * 0.8 + sway, r * 1.15);
      ctx.stroke();
    }

    // Glowing Tri-Eyes
    ctx.fillStyle = '#ecfdf5';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.3, 3, 0, Math.PI * 2);
    ctx.arc(r * 0.15, -r * 0.3, 3, 0, Math.PI * 2);
    ctx.arc(0, -r * 0.45, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Inner Radical Glyph (√x)
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(20 * this.scale)}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#059669';
    ctx.shadowBlur = 8;
    ctx.fillText(this.glyph || '√x', r * 0.2, 0);

    ctx.restore();
  }

  // 6. Polynome: Multi-Faced Crystal Hydra Entity
  _drawPolynome(ctx) {
    const r = this.radius;
    const pulse = Math.sin(this.idleTimer * 2.6) * 3;
    ctx.save();

    // Connecting Arcane Energy Webs between Heads
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.65, -r * 0.1);
    ctx.lineTo(0, -r * 0.55);
    ctx.lineTo(r * 0.65, -r * 0.1);
    ctx.closePath();
    ctx.stroke();

    // Helper for a single floating crystal face
    const drawFace = (x, y, scale, color, accentColor, eyeColor, rune) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 12;

      // Hexagonal Crystal Mask
      const s = r * 0.36 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.85, -s * 0.5);
      ctx.lineTo(s * 0.85, s * 0.5);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.85, s * 0.5);
      ctx.lineTo(-s * 0.85, -s * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Slit Eyes
      ctx.fillStyle = eyeColor;
      ctx.shadowColor = eyeColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(-s * 0.45, -s * 0.15, s * 0.3, 3);
      ctx.fillRect(s * 0.15, -s * 0.15, s * 0.3, 3);

      // Sub-term Rune
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rune, 0, s * 0.45);

      ctx.restore();
    };

    // Left Head (Negative term / Red Crystal Mask)
    const leftBob = Math.sin(this.idleTimer * 3 + 1) * 4;
    drawFace(-r * 0.65, -r * 0.1 + leftBob, 0.9, '#4c0519', '#f43f5e', '#fda4af', '−b');

    // Right Head (Positive term / Blue Crystal Mask)
    const rightBob = Math.sin(this.idleTimer * 3 + 2) * 4;
    drawFace(r * 0.65, -r * 0.1 + rightBob, 0.9, '#082f49', '#38bdf8', '#bae6fd', '+c');

    // Master Center Head (Royal Purple Hydra Core)
    const centerBob = Math.sin(this.idleTimer * 2.5) * 4;
    drawFace(0, -r * 0.4 + centerBob, 1.25, '#3b0764', '#c084fc', '#f0abfc', 'ax²');

    // Master Crown Rune (P(x))
    ctx.fillStyle = '#ffd700';
    ctx.font = `900 ${Math.round(18 * this.scale)}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.fillText(this.glyph || 'P(x)', 0, r * 0.45 + pulse);

    ctx.restore();
  }

  // 7. Vector Shade: Bladed Directional Arrow Assassin
  _drawVector(ctx) {
    const r = this.radius;
    const hover = Math.sin(this.idleTimer * 3.5) * 4;
    ctx.save();
    ctx.translate(0, hover);

    // Speed Trail Particles
    for (let i = 1; i <= 3; i++) {
      ctx.fillStyle = `rgba(6, 182, 212, ${0.4 / i})`;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3 * i, r * 0.4 * i);
      ctx.lineTo(0, -r * 0.6);
      ctx.lineTo(r * 0.3 * i, r * 0.4 * i);
      ctx.closePath();
      ctx.fill();
    }

    // Sleek Chevron Arrowhead Body
    const vecGrad = ctx.createLinearGradient(0, -r * 1.1, 0, r * 0.7);
    vecGrad.addColorStop(0, '#0e7490');
    vecGrad.addColorStop(0.5, '#155e75');
    vecGrad.addColorStop(1, '#083344');
    ctx.fillStyle = vecGrad;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 18;

    // Arrow Silhouette
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.15); // Arrowhead Tip
    ctx.lineTo(r * 0.75, r * 0.45); // Right Blade
    ctx.lineTo(r * 0.3, r * 0.25);
    ctx.lineTo(0, r * 0.85); // Tail
    ctx.lineTo(-r * 0.3, r * 0.25);
    ctx.lineTo(-r * 0.75, r * 0.45); // Left Blade
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Directional Energy Core Lines
    ctx.strokeStyle = '#a5f3fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(0, r * 0.5);
    ctx.stroke();

    // Glowing Visor
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;
    ctx.fillRect(-r * 0.25, -r * 0.35, r * 0.5, 4);

    // Vector Arrow Glyph (v⃗)
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(20 * this.scale)}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#0891b2';
    ctx.shadowBlur = 8;
    ctx.fillText(this.glyph || 'v⃗', 0, 0);

    ctx.restore();
  }

  // 8. Matrix Golem: Cubic Tensor Automaton
  _drawMatrixGolem(ctx) {
    const r = this.radius;
    const spin = this.idleTimer * 0.7;
    const breathe = Math.sin(this.idleTimer * 2.4) * 3;
    ctx.save();
    ctx.translate(0, breathe);

    // Revolving Dimensional Cube Lattice
    ctx.save();
    ctx.rotate(spin);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
    ctx.restore();

    // Heavy Cubic Granite Torso
    const cubeGrad = ctx.createLinearGradient(-r * 0.6, -r * 0.6, r * 0.6, r * 0.6);
    cubeGrad.addColorStop(0, '#78350f');
    cubeGrad.addColorStop(0.5, '#451a03');
    cubeGrad.addColorStop(1, '#1c0a00');
    ctx.fillStyle = cubeGrad;
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ca8a04';
    ctx.shadowBlur = 16;

    ctx.beginPath();
    ctx.roundRect(-r * 0.65, -r * 0.65, r * 1.3, r * 1.3, 8);
    ctx.fill();
    ctx.stroke();

    // Tensor Grid Matrix Lines (3x3 Matrix Grid)
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
    ctx.lineWidth = 1.8;
    const s = r * 0.65;
    ctx.beginPath();
    // Vertical Grid Lines
    ctx.moveTo(-s * 0.33, -s); ctx.lineTo(-s * 0.33, s);
    ctx.moveTo(s * 0.33, -s); ctx.lineTo(s * 0.33, s);
    // Horizontal Grid Lines
    ctx.moveTo(-s, -s * 0.33); ctx.lineTo(s, -s * 0.33);
    ctx.moveTo(-s, s * 0.33); ctx.lineTo(s, s * 0.33);
    ctx.stroke();

    // Floating Shoulder Bricks
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-r * 0.95, -r * 0.4, r * 0.25, r * 0.5);
    ctx.strokeRect(-r * 0.95, -r * 0.4, r * 0.25, r * 0.5);

    ctx.fillRect(r * 0.7, -r * 0.4, r * 0.25, r * 0.5);
    ctx.strokeRect(r * 0.7, -r * 0.4, r * 0.25, r * 0.5);

    // Glowing Matrix Glyph Core ([M])
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(22 * this.scale)}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 10;
    ctx.fillText(this.glyph || '[M]', 0, 0);

    ctx.restore();
  }

  // 9. Scalar Imp: Mischievous Winged Gargoyle Imp
  _drawScalarImp(ctx) {
    const r = this.radius;
    const wingFlap = Math.sin(this.idleTimer * 12) * 0.8;
    const hover = Math.sin(this.idleTimer * 3.5) * 5;
    ctx.save();
    ctx.translate(0, hover);

    // Flapping Leathery Bat Wings (Behind Body)
    ctx.save();
    ctx.fillStyle = '#7f1d1d';
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 10;

    // Left Wing
    ctx.save();
    ctx.scale(1, wingFlap);
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, -r * 0.1);
    ctx.quadraticCurveTo(-r * 0.8, -r * 0.9, -r * 1.25, -r * 0.6);
    ctx.lineTo(-r * 0.9, -r * 0.1);
    ctx.lineTo(-r * 0.65, r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.scale(1, wingFlap);
    ctx.beginPath();
    ctx.moveTo(r * 0.2, -r * 0.1);
    ctx.quadraticCurveTo(r * 0.8, -r * 0.9, r * 1.25, -r * 0.6);
    ctx.lineTo(r * 0.9, -r * 0.1);
    ctx.lineTo(r * 0.65, r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    // Curled Devil Tail
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.4);
    ctx.quadraticCurveTo(r * 0.6, r * 0.8, r * 0.85, r * 0.4);
    ctx.lineTo(r * 0.95, r * 0.35); // Arrowhead tail tip
    ctx.stroke();

    // Imp Body & Pointy Horns
    const impGrad = ctx.createRadialGradient(0, -r * 0.1, 2, 0, 0, r * 0.65);
    impGrad.addColorStop(0, '#ef4444');
    impGrad.addColorStop(0.6, '#b91c1c');
    impGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = impGrad;
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(0, -r * 0.65); // Head top
    ctx.lineTo(r * 0.4, -r * 0.9); // Right horn
    ctx.lineTo(r * 0.25, -r * 0.45);
    ctx.lineTo(r * 0.45, r * 0.3); // Right body
    ctx.lineTo(0, r * 0.55); // Bottom
    ctx.lineTo(-r * 0.45, r * 0.3); // Left body
    ctx.lineTo(-r * 0.25, -r * 0.45);
    ctx.lineTo(-r * 0.4, -r * 0.9); // Left horn
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mischievous Grinning Eyes
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.2, 3.5, 0, Math.PI * 2);
    ctx.arc(r * 0.15, -r * 0.2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Imp Fangs Grin
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.15, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Scalar Multiplication Glyph (×k)
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(18 * this.scale)}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.glyph || '×k', 0, r * 0.25);

    ctx.restore();
  }

  // 10. Bit Warden: Animated Gothic Tower Shield Sentry
  _drawBitWarden(ctx) {
    const r = this.radius;
    const hover = Math.sin(this.idleTimer * 2.2) * 3;
    ctx.save();
    ctx.translate(0, hover);

    // Floating Shield Body (Gothic Tower Shield)
    const shieldGrad = ctx.createLinearGradient(-r * 0.6, -r, r * 0.6, r);
    shieldGrad.addColorStop(0, '#475569');
    shieldGrad.addColorStop(0.4, '#334155');
    shieldGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = shieldGrad;
    ctx.strokeStyle = this.id.includes('1') ? '#38bdf8' : '#fbbf24';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 14;

    // Shield Contour
    ctx.beginPath();
    ctx.moveTo(-r * 0.65, -r * 0.85);
    ctx.lineTo(r * 0.65, -r * 0.85);
    ctx.lineTo(r * 0.72, r * 0.1);
    ctx.lineTo(0, r * 0.95); // Bottom point
    ctx.lineTo(-r * 0.72, r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Steel Cross Reinforcement Braces
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85); ctx.lineTo(0, r * 0.85);
    ctx.moveTo(-r * 0.65, -r * 0.25); ctx.lineTo(r * 0.65, -r * 0.25);
    ctx.stroke();

    // Center Glowing Binary Visor Eye
    ctx.fillStyle = this.id.includes('1') ? '#38bdf8' : '#fbbf24';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, -r * 0.25, 7, 0, Math.PI * 2);
    ctx.fill();

    // Binary Word Glyph (0b / 1b)
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(20 * this.scale)}px 'Consolas', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(this.glyph || (this.id.includes('1') ? '0b' : '1b'), 0, r * 0.25);

    ctx.restore();
  }

  // 11. Permutation Spark: Seraphic Star Sprite (Factorio Escort)
  _drawPermutationSpark(ctx) {
    const r = this.radius;
    const wingFlap = Math.sin(this.idleTimer * 9) * 0.7;
    const hover = Math.sin(this.idleTimer * 3) * 4;
    ctx.save();
    ctx.translate(0, hover);

    // Rotating Miniature Astral Halo
    ctx.save();
    ctx.rotate(this.idleTimer * 1.5);
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4 Ethereal Gossamer Wings
    ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 10;

    // Upper Wings
    ctx.save();
    ctx.scale(1, wingFlap);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.quadraticCurveTo(-r * 0.8, -r * 0.9, -r * 1.15, -r * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.quadraticCurveTo(r * 0.8, -r * 0.9, r * 1.15, -r * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();

    // Lower Wings
    ctx.save();
    ctx.scale(1, -wingFlap);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.quadraticCurveTo(-r * 0.7, r * 0.8, -r * 0.95, r * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.quadraticCurveTo(r * 0.7, r * 0.8, r * 0.95, r * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();

    // Celestial Sprite Body
    const spriteGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.55);
    spriteGrad.addColorStop(0, '#ffffff');
    spriteGrad.addColorStop(0.5, '#f472b6');
    spriteGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = spriteGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Permutation Glyph (Pₙ)
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(18 * this.scale)}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(this.glyph || 'Pₙ', 0, 0);

    ctx.restore();
  }

  // 12. Negabat: Sinister Negative Chiropter with flapping scalloped wings
  _drawNegabat(ctx) {
    const r = this.radius;
    const wingFlap = Math.sin(this.idleTimer * 7); // Smooth animated wing flap
    const hover = Math.sin(this.idleTimer * 3.5) * 6; // Atmospheric flight bobbing
    const eyePulse = 0.8 + 0.2 * Math.sin(this.idleTimer * 5);

    ctx.save();
    ctx.translate(0, hover);

    // 1. Ambient Void Shadow & Negative Field Aura
    const auraGrad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.5);
    auraGrad.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
    auraGrad.addColorStop(0.5, 'rgba(76, 29, 149, 0.12)');
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Subtle drifting negative motes
    ctx.save();
    ctx.fillStyle = 'rgba(192, 132, 252, 0.4)';
    ctx.font = 'bold 13px Consolas, monospace';
    ctx.textAlign = 'center';
    const moteOff1 = Math.sin(this.idleTimer * 2) * 12;
    const moteOff2 = Math.cos(this.idleTimer * 2.5) * 14;
    ctx.fillText('−', -r * 1.1 + moteOff1, -r * 0.6 + moteOff2);
    ctx.fillText('−', r * 1.1 - moteOff2, -r * 0.5 - moteOff1);
    ctx.restore();

    // 2. Large Scalloped Bat Wings (Left & Right)
    // Left Wing
    ctx.save();
    ctx.scale(1, 0.75 + wingFlap * 0.35); // Flap scale
    ctx.fillStyle = '#2e1065';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(-r * 0.25, -r * 0.2); // Shoulder
    ctx.quadraticCurveTo(-r * 0.9, -r * 1.2, -r * 1.6, -r * 0.8); // Top wing arm to tip claw
    // 3 Scalloped arches between finger ribs
    ctx.quadraticCurveTo(-r * 1.35, -r * 0.25, -r * 1.15, -r * 0.05); // Rib 1
    ctx.quadraticCurveTo(-r * 0.95, r * 0.2, -r * 0.7, r * 0.25); // Rib 2
    ctx.quadraticCurveTo(-r * 0.45, r * 0.3, -r * 0.2, r * 0.15); // Rib 3 to hip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing bone finger ribs
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.25, -r * 0.2);
    ctx.lineTo(-r * 1.15, -r * 0.05);
    ctx.moveTo(-r * 0.25, -r * 0.2);
    ctx.lineTo(-r * 0.7, r * 0.25);
    ctx.stroke();
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.scale(1, 0.75 + wingFlap * 0.35); // Flap scale
    ctx.fillStyle = '#2e1065';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(r * 0.25, -r * 0.2); // Shoulder
    ctx.quadraticCurveTo(r * 0.9, -r * 1.2, r * 1.6, -r * 0.8); // Top wing arm to tip claw
    // 3 Scalloped arches
    ctx.quadraticCurveTo(r * 1.35, -r * 0.25, r * 1.15, -r * 0.05);
    ctx.quadraticCurveTo(r * 0.95, r * 0.2, r * 0.7, r * 0.25);
    ctx.quadraticCurveTo(r * 0.45, r * 0.3, r * 0.2, r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing bone ribs
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(r * 0.25, -r * 0.2);
    ctx.lineTo(r * 1.15, -r * 0.05);
    ctx.moveTo(r * 0.25, -r * 0.2);
    ctx.lineTo(r * 0.7, r * 0.25);
    ctx.stroke();
    ctx.restore();

    // 3. Bat Ears (Pointed, menacing Gothic silhouette)
    ctx.fillStyle = '#3b0764';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    // Left ear
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, -r * 0.3);
    ctx.lineTo(-r * 0.45, -r * 0.85);
    ctx.lineTo(-r * 0.15, -r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner ear glow
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(-r * 0.32, -r * 0.35);
    ctx.lineTo(-r * 0.4, -r * 0.75);
    ctx.lineTo(-r * 0.2, -r * 0.45);
    ctx.closePath();
    ctx.fill();

    // Right ear
    ctx.fillStyle = '#3b0764';
    ctx.strokeStyle = '#c084fc';
    ctx.beginPath();
    ctx.moveTo(r * 0.35, -r * 0.3);
    ctx.lineTo(r * 0.45, -r * 0.85);
    ctx.lineTo(r * 0.15, -r * 0.45);
    ctx.closePath();
    ctx.fill();
    // Inner ear glow
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(r * 0.32, -r * 0.35);
    ctx.lineTo(r * 0.4, -r * 0.75);
    ctx.lineTo(r * 0.2, -r * 0.45);
    ctx.closePath();
    ctx.fill();

    // 4. Central Body & Head
    const bodyGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, r * 0.6);
    bodyGrad.addColorStop(0, '#581c87');
    bodyGrad.addColorStop(0.7, '#1e1b4b');
    bodyGrad.addColorStop(1, '#090714');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#d8b4fe';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.42, r * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 5. Glowing Fangs & Eyes
    // Eyes
    ctx.fillStyle = `rgba(236, 72, 153, ${eyePulse})`;
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 10;
    // Left eye
    ctx.beginPath();
    ctx.ellipse(-r * 0.16, -r * 0.14, r * 0.08, r * 0.04, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Right eye
    ctx.beginPath();
    ctx.ellipse(r * 0.16, -r * 0.14, r * 0.08, r * 0.04, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Fangs
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    // Left fang
    ctx.moveTo(-r * 0.12, -r * 0.02);
    ctx.lineTo(-r * 0.08, r * 0.12);
    ctx.lineTo(-r * 0.04, -r * 0.02);
    // Right fang
    ctx.moveTo(r * 0.04, -r * 0.02);
    ctx.lineTo(r * 0.08, r * 0.12);
    ctx.lineTo(r * 0.12, -r * 0.02);
    ctx.closePath();
    ctx.fill();

    // 6. Chest Negative Runestone (Diamond plate with glowing minus sign)
    ctx.fillStyle = '#0f0a1c';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.15);
    ctx.lineTo(r * 0.22, r * 0.32);
    ctx.lineTo(0, r * 0.49);
    ctx.lineTo(-r * 0.22, r * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Minus Sign "−"
    ctx.fillStyle = '#f43f5e';
    ctx.font = `900 ${Math.round(20 * this.scale)}px 'Consolas', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('−', 0, r * 0.32);

    ctx.restore();
  }

  _drawStandardAnomalyBody(ctx) {
    const r = this.radius;
    const spin = this.idleTimer * 0.8;

    // Crystalline rhombus / diamond core
    ctx.save();
    ctx.rotate(spin);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inset crystal facets
    ctx.fillStyle = this.accent;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(r * 0.7, 0);
    ctx.lineTo(0, r * 0.7);
    ctx.lineTo(-r * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Orbiting number rings
    ctx.save();
    ctx.rotate(-spin * 1.5);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.3, r * 0.45, 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Stage 5 Boss: Big Int
   * Colossal purple monolithic stone golem adorned with ornate glowing gold inlays and runes
   * @param {CanvasRenderingContext2D} ctx
   */
  _drawBigIntBody(ctx) {
    const r = this.radius;
    const breathe = Math.sin(this.idleTimer * 2.2) * 5;
    const fistBob = Math.sin(this.idleTimer * 2.8) * 6;

    ctx.save();

    // 1. Orbiting Amethyst Crystal Shards with Golden Motes
    const shardCount = 5;
    for (let i = 0; i < shardCount; i++) {
      const angle = this.idleTimer * 0.9 + (i * Math.PI * 2) / shardCount;
      const dist = r * (1.3 + Math.sin(this.idleTimer * 1.5 + i) * 0.1);
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist * 0.55;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle + Math.PI / 4);
      ctx.fillStyle = '#7c3aed';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 2. Floating Heavy Boulder Pauldrons (Shoulder Slabs)
    const drawPauldron = (dir) => {
      ctx.save();
      const px = dir * r * 0.96;
      const py = -r * 0.35 + breathe * 0.5;
      ctx.translate(px, py);
      ctx.rotate(dir * 0.18);

      // Main Dark Purple Amethyst Slab
      const pGrad = ctx.createLinearGradient(-dir * 25, -20, dir * 25, 30);
      pGrad.addColorStop(0, '#581c87');
      pGrad.addColorStop(0.5, '#3b0764');
      pGrad.addColorStop(1, '#2e1065');
      ctx.fillStyle = pGrad;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(-dir * 8, -26);
      ctx.lineTo(dir * 28, -12);
      ctx.lineTo(dir * 32, 24);
      ctx.lineTo(-dir * 18, 30);
      ctx.lineTo(-dir * 26, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Golden Runic Filigree on Pauldron
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(dir * 18, -4);
      ctx.lineTo(dir * 20, 16);
      ctx.stroke();

      // Gold Corner Stud
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(dir * 18, -4, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };
    drawPauldron(-1); // Left Pauldron
    drawPauldron(1);  // Right Pauldron

    // 3. Colossal Torso: Monolithic Beveled Purple Stone
    ctx.save();
    const cy = breathe * 0.8;
    const torsoGrad = ctx.createRadialGradient(0, -r * 0.1 + cy, 10, 0, -r * 0.1 + cy, r * 1.05);
    torsoGrad.addColorStop(0, '#6b21a8');
    torsoGrad.addColorStop(0.45, '#4c1d95');
    torsoGrad.addColorStop(0.85, '#2e1065');
    torsoGrad.addColorStop(1, '#1e0940');
    ctx.fillStyle = torsoGrad;
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 24;

    // Heavy Faceted Golem Chest (Octagonal / Hexagonal Monolith)
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.72 + cy);
    ctx.lineTo(r * 0.75, -r * 0.38 + cy);
    ctx.lineTo(r * 0.82, r * 0.22 + cy);
    ctx.lineTo(r * 0.48, r * 0.72 + cy);
    ctx.lineTo(-r * 0.48, r * 0.72 + cy);
    ctx.lineTo(-r * 0.82, r * 0.22 + cy);
    ctx.lineTo(-r * 0.75, -r * 0.38 + cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Ornate Gold Filigree & Arithmetic Circuit Patterns (ลวดลายทอง)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;

    // Upper Chest Collar Gold V-Bands
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.32 + cy);
    ctx.lineTo(0, -r * 0.05 + cy);
    ctx.lineTo(r * 0.55, -r * 0.32 + cy);
    ctx.stroke();

    // Outer Edge Runic Inlays
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, -r * 0.25 + cy);
    ctx.lineTo(-r * 0.68, r * 0.18 + cy);
    ctx.lineTo(-r * 0.38, r * 0.58 + cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(r * 0.62, -r * 0.25 + cy);
    ctx.lineTo(r * 0.68, r * 0.18 + cy);
    ctx.lineTo(r * 0.38, r * 0.58 + cy);
    ctx.stroke();

    // Binary / Integer Circuit Markings
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.75)';
    ctx.lineWidth = 2;
    // Left circuit trace
    ctx.beginPath();
    ctx.moveTo(-r * 0.28, r * 0.05 + cy);
    ctx.lineTo(-r * 0.45, r * 0.2 + cy);
    ctx.lineTo(-r * 0.45, r * 0.42 + cy);
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(-r * 0.45, r * 0.42 + cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Right circuit trace
    ctx.beginPath();
    ctx.moveTo(r * 0.28, r * 0.05 + cy);
    ctx.lineTo(r * 0.45, r * 0.2 + cy);
    ctx.lineTo(r * 0.45, r * 0.42 + cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.45, r * 0.42 + cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // 5. Central Golden Runic Core Plate (หัวใจโกเล็มทองคำ)
    const coreGrad = ctx.createRadialGradient(0, cy, 2, 0, cy, r * 0.35);
    coreGrad.addColorStop(0, '#fffbeb');
    coreGrad.addColorStop(0.35, '#fde68a');
    coreGrad.addColorStop(0.7, '#f59e0b');
    coreGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = coreGrad;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 18;

    ctx.beginPath();
    const coreSides = 8;
    const coreR = r * 0.32;
    for (let i = 0; i < coreSides; i++) {
      const a = (i * Math.PI * 2) / coreSides + Math.PI / 8;
      const cpx = Math.cos(a) * coreR;
      const cpy = Math.sin(a) * coreR + cy;
      if (i === 0) ctx.moveTo(cpx, cpy);
      else ctx.lineTo(cpx, cpy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Engraved Glyph on Heart Core (2¹⁰)
    ctx.fillStyle = '#3b0764';
    ctx.font = `900 ${Math.round(22 * this.scale)}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(this.glyph, 0, cy);
    ctx.restore();

    // 6. Golem Horned Stone Brow & Glowing Golden Eyes
    ctx.save();
    const headY = -r * 0.8 + breathe;
    const headGrad = ctx.createLinearGradient(0, headY - 24, 0, headY + 12);
    headGrad.addColorStop(0, '#581c87');
    headGrad.addColorStop(1, '#2e1065');
    ctx.fillStyle = headGrad;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#9333ea';
    ctx.shadowBlur = 12;

    // Horned Stone Helm
    ctx.beginPath();
    ctx.moveTo(0, headY - 26);
    ctx.lineTo(r * 0.34, headY - 32);
    ctx.lineTo(r * 0.42, headY - 14);
    ctx.lineTo(r * 0.28, headY + 12);
    ctx.lineTo(-r * 0.28, headY + 12);
    ctx.lineTo(-r * 0.42, headY - 14);
    ctx.lineTo(-r * 0.34, headY - 32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Golden Brow Crest
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-r * 0.24, headY - 20);
    ctx.lineTo(0, headY - 28);
    ctx.lineTo(r * 0.24, headY - 20);
    ctx.lineTo(0, headY - 14);
    ctx.closePath();
    ctx.fill();

    // Menacing Horizontal Glowing Golden Visor Slit
    ctx.strokeStyle = '#fffbeb';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(-r * 0.18, headY - 2);
    ctx.lineTo(r * 0.18, headY - 2);
    ctx.stroke();

    // Intense Twin Eye-Nodes
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(-r * 0.08, headY - 2, 3, 0, Math.PI * 2);
    ctx.arc(r * 0.08, headY - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 7. Floating Heavy Stone Fists (หมัดหินม่วงขลิบทอง)
    const drawFist = (dir, yOffset) => {
      ctx.save();
      const fx = dir * r * 1.18;
      const fy = r * 0.25 + yOffset;
      ctx.translate(fx, fy);
      ctx.rotate(dir * 0.15);

      // Purple Stone Fist Block
      const fistGrad = ctx.createLinearGradient(-dir * 20, -20, dir * 20, 20);
      fistGrad.addColorStop(0, '#581c87');
      fistGrad.addColorStop(1, '#2e1065');
      ctx.fillStyle = fistGrad;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#7c3aed';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.roundRect(-22, -22, 44, 44, 8);
      ctx.fill();
      ctx.stroke();

      // Gold Knuckle Bands
      ctx.fillStyle = '#ffd700';
      for (let k = -14; k <= 14; k += 9) {
        ctx.fillRect(k - 3, -20, 6, 12);
      }

      // Gold Arcane Rune on Back of Fist
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 8, 7, 0, Math.PI * 2);
      ctx.moveTo(-7, 8);
      ctx.lineTo(7, 8);
      ctx.stroke();

      ctx.restore();
    };
    drawFist(-1, fistBob);  // Left Fist
    drawFist(1, -fistBob);  // Right Fist

    ctx.restore();
  }

  /**
   * Stage 6 Final Boss: Factorio
   * Celestial entity formed by 6 stacked tiers of miniature spirits, crowned with divine factorial halo rings behind it
   * @param {CanvasRenderingContext2D} ctx
   */
  _drawFactorioBody(ctx) {
    const r = this.radius;
    const pulse = Math.sin(this.idleTimer * 2.5) * 0.05 + 1.0;
    const totalTiers = 6;
    const activeTiers = Math.max(1, totalTiers - this.currentPhaseIndex);

    ctx.save();
    ctx.scale(pulse, pulse);

    // =========================================================================
    // LAYER 1: BEHIND - THE CELESTIAL FACTORIAL HALO RINGS (วงแหวน factorial ด้านหลัง)
    // =========================================================================
    ctx.save();
    const haloR = r * 1.35;

    // A. 12 Sacred Radiant Starburst Sunbeams
    ctx.save();
    const beamAngle = this.idleTimer * 0.15;
    ctx.rotate(beamAngle);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI * 2) / 12;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 215, 0, 0.28)' : 'rgba(244, 114, 182, 0.2)';
      ctx.lineWidth = i % 2 === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (haloR * 0.7), Math.sin(a) * (haloR * 0.7));
      ctx.lineTo(Math.cos(a) * (haloR * 1.35), Math.sin(a) * (haloR * 1.35));
      ctx.stroke();
    }
    ctx.restore();

    // B. Outer Celestial Ring with 6 Sacred Factorial Medallions (6!, 5!, 4!, 3!, 2!, 1!)
    ctx.save();
    const ringSpin = this.idleTimer * 0.22;
    ctx.rotate(ringSpin);

    // Outer Golden Ring
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.75)';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.stroke();

    // 6 Factorial Rune Medallions on Halo
    const FACTORIAL_LABELS = ['6!', '5!', '4!', '3!', '2!', '1!'];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      const mx = Math.cos(a) * haloR;
      const my = Math.sin(a) * haloR;
      const isPhaseActive = (6 - i) <= activeTiers;

      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(-ringSpin); // Keep text upright

      // Medallion Disc
      ctx.fillStyle = isPhaseActive ? '#fbbf24' : 'rgba(76, 29, 149, 0.8)';
      ctx.strokeStyle = isPhaseActive ? '#ffffff' : 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = isPhaseActive ? 2.5 : 1.5;
      ctx.shadowColor = isPhaseActive ? '#ffd700' : 'transparent';
      ctx.shadowBlur = isPhaseActive ? 12 : 0;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Text inside medallion
      ctx.fillStyle = isPhaseActive ? '#4a044e' : '#cbd5e1';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(FACTORIAL_LABELS[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();

    // C. Middle Astral Energy Ring (Reverse Spin)
    ctx.save();
    ctx.rotate(-this.idleTimer * 0.38);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, haloR * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // D. Inner Golden Singularity Aura
    const singGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, haloR * 0.65);
    singGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    singGrad.addColorStop(0.4, 'rgba(244, 114, 182, 0.25)');
    singGrad.addColorStop(0.8, 'rgba(192, 132, 252, 0.1)');
    singGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = singGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloR * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // End Halo Layer

    // =========================================================================
    // LAYER 2: THE DIVINE DEITY (ภูติจิ๋วต่อตัวกันเป็น 6 ชั้น)
    // =========================================================================
    // Helper to draw a single miniature fairy / celestial spirit
    const drawMiniFairy = (fx, fy, scale, flapTimer, isApex = false, isActive = true) => {
      ctx.save();
      ctx.translate(fx, fy);
      const wingFlap = Math.sin(flapTimer) * 0.75;
      const fSize = 10 * scale;

      // Golden Spirit Halo
      ctx.strokeStyle = isActive ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, -fSize * 1.1, fSize * 0.6, fSize * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Fluttering Translucent Fairy Wings (Left & Right)
      ctx.save();
      ctx.scale(1, wingFlap);
      ctx.fillStyle = isActive ? 'rgba(254, 240, 138, 0.65)' : 'rgba(244, 114, 182, 0.35)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = isActive ? 8 : 2;

      // Left Wing
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-fSize * 1.8, -fSize * 1.5, -fSize * 2.2, -fSize * 0.6);
      ctx.quadraticCurveTo(-fSize * 1.6, fSize * 0.8, 0, fSize * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(fSize * 1.8, -fSize * 1.5, fSize * 2.2, -fSize * 0.6);
      ctx.quadraticCurveTo(fSize * 1.6, fSize * 0.8, 0, fSize * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Luminous Fairy Body / Robe
      ctx.fillStyle = isActive ? '#ffffff' : '#cbd5e1';
      ctx.shadowColor = isActive ? '#f472b6' : 'transparent';
      ctx.shadowBlur = isActive ? 10 : 0;

      // Dress / Torso
      ctx.beginPath();
      ctx.moveTo(0, -fSize * 0.4);
      ctx.lineTo(fSize * 0.5, fSize * 0.9);
      ctx.lineTo(-fSize * 0.5, fSize * 0.9);
      ctx.closePath();
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(0, -fSize * 0.6, fSize * 0.4, 0, Math.PI * 2);
      ctx.fill();

      if (isApex) {
        // Apex Goddess Crown & Scepter
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(-fSize * 0.4, -fSize * 0.9);
        ctx.lineTo(-fSize * 0.2, -fSize * 1.4);
        ctx.lineTo(0, -fSize * 1.0);
        ctx.lineTo(fSize * 0.2, -fSize * 1.4);
        ctx.lineTo(fSize * 0.4, -fSize * 0.9);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    };

    // The 6 Stacked Tiers Configuration (From Base Tier 6 to Apex Tier 1)
    const TIERS = [
      { tierNum: 6, count: 6, y: r * 0.62, spread: r * 0.82, scale: 1.05 },
      { tierNum: 5, count: 5, y: r * 0.36, spread: r * 0.64, scale: 1.1 },
      { tierNum: 4, count: 4, y: r * 0.10, spread: r * 0.46, scale: 1.15 },
      { tierNum: 3, count: 3, y: -r * 0.16, spread: r * 0.36, scale: 1.25 },
      { tierNum: 2, count: 2, y: -r * 0.44, spread: r * 0.22, scale: 1.3 },
      { tierNum: 1, count: 1, y: -r * 0.72, spread: 0, scale: 1.55, isApex: true },
    ];

    // Connecting celestial ribbons of light between tiers
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.lineWidth = 1.5;
    for (let t = 0; t < TIERS.length - 1; t++) {
      const cur = TIERS[t];
      const next = TIERS[t + 1];
      ctx.beginPath();
      ctx.moveTo(-cur.spread * 0.5, cur.y);
      ctx.quadraticCurveTo(0, (cur.y + next.y) / 2, -next.spread * 0.5, next.y);
      ctx.moveTo(cur.spread * 0.5, cur.y);
      ctx.quadraticCurveTo(0, (cur.y + next.y) / 2, next.spread * 0.5, next.y);
      ctx.stroke();
    }
    ctx.restore();

    // Render Fairies from Tier 6 up to Tier 1
    TIERS.forEach((tier) => {
      const isActive = tier.tierNum <= activeTiers;
      if (tier.count === 1) {
        // Apex Fairy
        const flap = this.idleTimer * 8;
        drawMiniFairy(0, tier.y, tier.scale, flap, true, isActive);
      } else {
        const step = tier.count > 1 ? (tier.spread * 2) / (tier.count - 1) : 0;
        for (let i = 0; i < tier.count; i++) {
          const fx = -tier.spread + i * step;
          // Arch upward curve towards center
          const arch = Math.sin((i / (tier.count - 1)) * Math.PI) * 6;
          const fy = tier.y - arch;
          const flap = this.idleTimer * 9 + i * 1.3 + tier.tierNum;
          drawMiniFairy(fx, fy, tier.scale, flap, false, isActive);
        }
      }
    });

    // Singularity Glyph Orb Held in Front of Apex Deity
    ctx.save();
    const orbY = -r * 0.35;
    const orbGrad = ctx.createRadialGradient(0, orbY, 2, 0, orbY, 24);
    orbGrad.addColorStop(0, '#ffffff');
    orbGrad.addColorStop(0.4, '#ffd700');
    orbGrad.addColorStop(0.8, '#ec4899');
    orbGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGrad;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, orbY, 20, 0, Math.PI * 2);
    ctx.fill();

    // Factorial Phase Glyph inside the Divine Orb
    ctx.fillStyle = '#ffffff';
    ctx.font = "900 18px 'Cinzel', serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText(this.glyph, 0, orbY);
    ctx.restore();

    ctx.restore();
  }

  _drawHealthBar(ctx) {
    const barWidth = Math.max(100, this.radius * 2);
    const barHeight = 12;
    const barY = -this.radius - 22;

    // Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = this.isNegative ? 'rgba(168, 85, 247, 0.6)' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
    ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);

    // Fill ratio
    if (this.isNegative) {
      // Negative debt ratio: shrinks towards 0 as debt is cleared
      const absHp = Math.abs(this.hp);
      const absMax = Math.abs(this.maxHp) || 1;
      const ratio = Math.max(0, Math.min(1, absHp / absMax));
      const grad = ctx.createLinearGradient(-barWidth / 2, 0, barWidth / 2, 0);
      grad.addColorStop(0, '#7c3aed');
      grad.addColorStop(1, '#a855f7');
      ctx.fillStyle = grad;
      ctx.fillRect(-barWidth / 2 + 1, barY + 1, (barWidth - 2) * ratio, barHeight - 2);

      // HP Text
      ctx.fillStyle = '#f3e8ff';
      ctx.font = 'bold 15px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${this.hp} ➔ 0`, 0, barY - 2);

      // Name & Title
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillStyle = '#c084fc';
      ctx.fillText(`[−] ${this.name}`, 0, barY - 18);
    } else {
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      const fillColor = hpRatio > 0.5 ? '#ef4444' : hpRatio > 0.25 ? '#f59e0b' : '#dc2626';
      ctx.fillStyle = fillColor;
      ctx.fillRect(-barWidth / 2 + 1, barY + 1, (barWidth - 2) * hpRatio, barHeight - 2);

      // HP Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${this.hp} / ${this.maxHp}`, 0, barY - 2);

      // Name & Title / Phase indicator
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      if (this.isFactorialBoss && this.factorialPhases) {
        const phaseNum = this.currentPhaseIndex + 1;
        const totalPhases = this.factorialPhases.length;
        ctx.fillStyle = '#f472b6';
        ctx.fillText(`${this.name} (${this.glyph}) [Phase ${phaseNum}/${totalPhases}]`, 0, barY - 18);
      } else {
        ctx.fillText(this.name, 0, barY - 18);
      }
    }
  }
}
