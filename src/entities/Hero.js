import { CONFIG } from '../config.js';

/**
 * Hero Entity class representing one of the 4 Knights of Arithmetic:
 * - Knight (− Subtraction)
 * - Berserker (÷ Division)
 * - Cleric (+ Addition)
 * - Paladin (× Multiplication)
 */
export class Hero {
  /**
   * @param {Object} heroConfig - Configuration entry from CONFIG.HEROES
   */
  constructor(heroConfig) {
    this.id = heroConfig.ID;
    this.name = heroConfig.NAME;
    this.title = heroConfig.TITLE;
    this.operator = heroConfig.OPERATOR;
    this.symbol = heroConfig.SYMBOL;
    this.baseMaxHp = heroConfig.MAX_HP;
    this.maxHp = heroConfig.MAX_HP;
    this.hp = heroConfig.MAX_HP;
    this.color = heroConfig.COLOR;
    this.accent = heroConfig.ACCENT;
    this.description = heroConfig.DESCRIPTION;

    // Fixed Logical Canvas Position
    this.baseX = heroConfig.SLOT_X;
    this.baseY = heroConfig.SLOT_Y;
    this.x = this.baseX;
    this.y = this.baseY;
    this.radius = 55;

    // Turn Combat State
    this.heldValue = null; // Equipped number from pool
    this.multiplier = this.id === 'paladin' ? CONFIG.COMBAT.PALADIN_INITIAL_BUFF : 1;
    this.barrier = 0; // Zero Barrier absorbing hits (Damage x 0 = 0)

    // Visual Animation States
    this.lungeX = 0;
    this.lungeY = 0;
    this.hitFlashTimer = 0;
    this.shakeTimer = 0;
    this.idleTimer = Math.random() * 10;
    this.isDead = false;
  }

  reset() {
    this.hp = this.maxHp;
    this.barrier = 0;
    this.heldValue = null;
    this.multiplier = this.id === 'paladin' ? CONFIG.COMBAT.PALADIN_INITIAL_BUFF : 1;
    this.lungeX = 0;
    this.lungeY = 0;
    this.hitFlashTimer = 0;
    this.shakeTimer = 0;
    this.isDead = false;
  }

  resetToDefault(baseMaxHp = null) {
    if (baseMaxHp !== null) {
      this.baseMaxHp = baseMaxHp;
    }
    this.maxHp = this.baseMaxHp;
    this.hp = this.maxHp;
    this.barrier = 0;
    this.heldValue = null;
    this.multiplier = this.id === 'paladin' ? CONFIG.COMBAT.PALADIN_INITIAL_BUFF : 1;
    this.lungeX = 0;
    this.lungeY = 0;
    this.hitFlashTimer = 0;
    this.shakeTimer = 0;
    this.isDead = false;
  }

  isAlive() {
    return this.hp > 0;
  }

  equip(number) {
    // Paladin cannot hold numbers from pool; relies strictly on turn-based multiplier
    if (this.id === 'paladin') {
      return false;
    }
    this.heldValue = number;
    return true;
  }

  clearHeld() {
    this.heldValue = null;
  }

  /**
   * Paladin passive turn charge (+1x up to 3x)
   */
  chargePaladin() {
    if (this.id === 'paladin' && this.isAlive()) {
      this.multiplier = Math.min(CONFIG.COMBAT.PALADIN_MAX_BUFF, this.multiplier + 1);
    }
  }

  /**
   * Paladin reset after buffing ally
   */
  resetPaladin() {
    if (this.id === 'paladin') {
      this.multiplier = CONFIG.COMBAT.PALADIN_INITIAL_BUFF;
      this.heldValue = null;
    }
  }

  takeDamage(amount) {
    if (this.isDead) return 0;
    if (this.barrier > 0) {
      this.barrier--;
      this.hitFlashTimer = 0.25;
      this.shakeTimer = 0.2;
      return 0; // Completely nullified by Zero Barrier (Damage x 0 = 0)
    }
    const actualDamage = Math.min(this.hp, Math.max(0, amount));
    this.hp -= actualDamage;
    this.hitFlashTimer = 0.25;
    this.shakeTimer = 0.3;

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.heldValue = null;
    }
    return actualDamage;
  }

  heal(amount) {
    if (this.isDead) return 0;
    const prevHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - prevHp;
  }

  triggerAttackLunge(targetX, targetY) {
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    this.lungeX = Math.cos(angle) * CONFIG.VISUALS.HERO_ATTACK_LUNGE;
    this.lungeY = Math.sin(angle) * CONFIG.VISUALS.HERO_ATTACK_LUNGE;
  }

  update(dt) {
    this.idleTimer += dt * 2.5;

    // Decay lunge offset back to slot
    this.lungeX *= Math.pow(0.001, dt);
    this.lungeY *= Math.pow(0.001, dt);

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    // Apply position with subtle breathing and shake
    const breatheY = this.isAlive() ? Math.sin(this.idleTimer) * 4 : 0;
    const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * 12 : 0;
    const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * 12 : 0;

    this.x = this.baseX + this.lungeX + shakeX;
    this.y = this.baseY + this.lungeY + breatheY + shakeY;
  }

  /**
   * Canvas visual rendering of the knight
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} isSelectedActor - Whether this hero is selected to act
   * @param {boolean} isTargetCandidate - Whether this hero is a valid target for the current actor
   * @param {boolean} isHovered - Mouse cursor hovering
   */
  draw(ctx, isSelectedActor = false, isTargetCandidate = false, isHovered = false) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.isDead) {
      // Fallen Hero marker
      ctx.globalAlpha = 0.45;
      this._drawDeadGrave(ctx);
      ctx.restore();
      return;
    }

    // 1. Selection / Target Highlight Rings
    if (isSelectedActor) {
      // Radiant golden aura ring around active actor
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 16, 0, Math.PI * 2);
      ctx.stroke();

      // Pulsing secondary ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (isTargetCandidate) {
      // Green (heal) or Gold (buff) target reticle
      ctx.save();
      const targetColor = this.id === 'cleric' ? '#10b981' : '#f59e0b';
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = isHovered ? 6 : 4;
      ctx.setLineDash([10, 8]);
      ctx.shadowColor = targetColor;
      ctx.shadowBlur = isHovered ? 20 : 10;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Base Shadow on Floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 48, 55, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Unique Class Silhouette according to hero profession
    if (this.hitFlashTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 25;
    }

    switch (this.id) {
      case 'knight':
        this._drawKnight(ctx);
        break;
      case 'berserker':
        this._drawBerserker(ctx);
        break;
      case 'cleric':
        this._drawCleric(ctx);
        break;
      case 'paladin':
        this._drawPaladin(ctx);
        break;
      default:
        this._drawKnight(ctx);
    }

    if (this.hitFlashTimer > 0) {
      ctx.restore();
    }

    // 4. Draw Floating Value/Multiplier Badge over Hero
    if (this.id === 'paladin') {
      this._drawPaladinMultiplierBadge(ctx);
    } else if (this.heldValue !== null) {
      this._drawHeldBadge(ctx);
    }

    // 5. Draw Zero Barrier Shield if active
    if (this.barrier > 0 && !this.isDead) {
      this._drawZeroBarrier(ctx);
    }

    ctx.restore();
  }

  /**
   * Renders the rotating translucent hex-barrier of Zero Barrier (Damage x 0 = 0)
   * @param {CanvasRenderingContext2D} ctx
   */
  _drawZeroBarrier(ctx) {
    ctx.save();
    const pulse = 1 + Math.sin(this.idleTimer * 3.5) * 0.05;
    ctx.scale(pulse, pulse);

    const shieldAngle = this.idleTimer * 0.7;
    ctx.rotate(shieldAngle);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';

    ctx.beginPath();
    const hexR = this.radius + 15;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const hx = Math.cos(a) * hexR;
      const hy = Math.sin(a) * hexR;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Floating Zero Rune on shield top
    ctx.rotate(-shieldAngle); // Keep upright
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 13px 'Cinzel', serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillText('0·x', 0, -hexR - 5);
    ctx.restore();
  }

  /**
   * KNIGHT (The Subtractor −):
   * Classic Medieval Knight with great-helm, royal blue plume,
   * broadsword with glowing subtraction fuller, and heraldic heater shield.
   */
  _drawKnight(ctx) {
    ctx.save();

    // 1. Royal Blue Billowing Cape (Behind Body)
    const capeFlutter = Math.sin(this.idleTimer * 2) * 5;
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(-28, -25);
    ctx.quadraticCurveTo(-46 + capeFlutter, 15, -36 + capeFlutter, 48);
    ctx.lineTo(36 + capeFlutter, 48);
    ctx.quadraticCurveTo(46 + capeFlutter, 15, 28, -25);
    ctx.closePath();
    ctx.fill();

    // 2. Heavy Broadsword (Right Hand / Side)
    ctx.save();
    ctx.translate(34, -10);
    ctx.rotate(0.35 + Math.sin(this.idleTimer * 1.5) * 0.05);

    // Blade
    const bladeGrad = ctx.createLinearGradient(-5, 0, 5, 0);
    bladeGrad.addColorStop(0, '#e2e8f0');
    bladeGrad.addColorStop(0.5, '#ffffff');
    bladeGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(-5, 10);
    ctx.lineTo(-4, -58);
    ctx.lineTo(0, -68);
    ctx.lineTo(4, -58);
    ctx.lineTo(5, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Glowing Subtraction Rune along Blade Fuller
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, -48);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Crossguard & Pommel
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-12, 10, 24, 6);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-3, 16, 6, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 31, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Knight Armored Torso & Blue Tabard
    const armorGrad = ctx.createLinearGradient(-30, 0, 30, 0);
    armorGrad.addColorStop(0, '#334155');
    armorGrad.addColorStop(0.5, '#64748b');
    armorGrad.addColorStop(1, '#334155');
    ctx.fillStyle = armorGrad;
    ctx.beginPath();
    ctx.moveTo(-26, -20);
    ctx.lineTo(26, -20);
    ctx.lineTo(22, 35);
    ctx.lineTo(-22, 35);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Royal Blue Tabard down the center
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-12, -18, 24, 52);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-12, -18, 24, 52);

    // 4. Steel Spaulders (Shoulder Guards)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(-30, -18, 14, 0, Math.PI * 2);
    ctx.arc(30, -18, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Great-Helm (Head)
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, -42, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Lower Visor Guard
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-20, -42);
    ctx.lineTo(20, -42);
    ctx.lineTo(14, -22);
    ctx.lineTo(0, -16);
    ctx.lineTo(-14, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Visor Eye Slit (Glowing Cyan)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-14, -38, 28, 5);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillRect(-11, -37, 22, 3);
    ctx.shadowBlur = 0;

    // Knight Helmet Crest Plume (Royal Blue)
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(-6, -64);
    ctx.quadraticCurveTo(12 + capeFlutter * 0.8, -78, 28 + capeFlutter, -56);
    ctx.quadraticCurveTo(10, -60, 4, -62);
    ctx.closePath();
    ctx.fill();

    // 6. Knight Heraldic Shield (Left Hand / Side)
    ctx.save();
    ctx.translate(-26, 8);
    ctx.rotate(-0.15);

    // Shield Base
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.moveTo(-22, -30);
    ctx.lineTo(22, -30);
    ctx.lineTo(20, 8);
    ctx.quadraticCurveTo(14, 30, 0, 40);
    ctx.quadraticCurveTo(-14, 30, -20, 8);
    ctx.closePath();
    ctx.fill();

    // Steel Shield Trim with gold rivets
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Embossed Glowing Subtraction Symbol (−)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.fillRect(-14, 2, 28, 7);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(-14, 2, 28, 7);
    ctx.shadowBlur = 0;

    ctx.restore();
    ctx.restore();
  }

  /**
   * BERSERKER (The Divider ÷):
   * Fierce Barbarian with menacing horned skull-helm, spiked iron pauldrons,
   * thick wolf fur mantle, and dual glowing division battleaxes.
   */
  _drawBerserker(ctx) {
    ctx.save();

    // 1. Thick Wolf/Bear Fur Collar (Behind Body)
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.arc(0, -10, 42, 0, Math.PI * 2);
    ctx.fill();

    // 2. Dual Division War-Axes (Raised in Combat Stance)
    const axeSway = Math.sin(this.idleTimer * 2.2) * 4;

    // LEFT AXE
    ctx.save();
    ctx.translate(-42, -18 + axeSway * 0.5);
    ctx.rotate(-0.4);
    // Shaft
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-3, -35, 6, 65);
    // Double-bitted crescent axe head (Upper Dot of ÷)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, -25, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.stroke();
    // Inner dot
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(0, -25, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // RIGHT AXE
    ctx.save();
    ctx.translate(42, -18 - axeSway * 0.5);
    ctx.rotate(0.4);
    // Shaft
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-3, -35, 6, 65);
    // Double-bitted crescent axe head (Lower Dot of ÷)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, -25, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.stroke();
    // Inner dot
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(0, -25, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // 3. Battle-Scarred Spiked Cuirass
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-28, -16);
    ctx.lineTo(28, -16);
    ctx.lineTo(22, 38);
    ctx.lineTo(-22, 38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glowing Central Division Bar (÷) on Chest
    ctx.fillStyle = '#f87171';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 14;
    ctx.fillRect(-18, 8, 36, 7);
    // Upper & Lower dots on breastplate
    ctx.beginPath();
    ctx.arc(0, -4, 5, 0, Math.PI * 2);
    ctx.arc(0, 27, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 4. Spiked Iron Shoulder Guards
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-36, -24);
    ctx.lineTo(-54, -34); // Left spike
    ctx.lineTo(-32, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(36, -24);
    ctx.lineTo(54, -34); // Right spike
    ctx.lineTo(32, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Barbarian Horned Helmet
    // Helmet dome
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, -40, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fierce Horns
    // Left Horn
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(-16, -45);
    ctx.quadraticCurveTo(-38, -62, -50, -68);
    ctx.quadraticCurveTo(-34, -48, -16, -34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Right Horn
    ctx.beginPath();
    ctx.moveTo(16, -45);
    ctx.quadraticCurveTo(38, -62, 50, -68);
    ctx.quadraticCurveTo(34, -48, 16, -34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Menacing Red Visor Slit / Fiery Gaze
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-14, -38, 28, 7);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fillRect(-11, -36, 9, 3);
    ctx.fillRect(2, -36, 9, 3);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  /**
   * CLERIC (The Adder +):
   * Serene Holy Priest with luminous golden halo, emerald cowl & robes,
   * and the Divine Addition Cross Staff emitting healing motes.
   */
  _drawCleric(ctx) {
    ctx.save();

    // 1. Luminous Golden Celestial Halo Ring (Floating behind head)
    const haloGlow = Math.sin(this.idleTimer * 2) * 0.15 + 0.85;
    ctx.save();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 22 * haloGlow;
    ctx.beginPath();
    ctx.arc(0, -44, 30, 0, Math.PI * 2);
    ctx.stroke();
    // Inner thin halo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -44, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Divine Addition Relic Staff (Right Hand)
    ctx.save();
    ctx.translate(36, -8);
    const staffPulse = Math.sin(this.idleTimer * 3) * 0.08 + 1.0;
    // Golden Shaft
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-3, -55, 6, 105);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.strokeRect(-3, -55, 6, 105);

    // Ornate Golden Addition Cross Head (+)
    ctx.save();
    ctx.translate(0, -62);
    ctx.scale(staffPulse, staffPulse);
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 18;
    // Horizontal crossbar
    ctx.fillRect(-18, -6, 36, 12);
    // Vertical crossbar
    ctx.fillRect(-6, -18, 12, 36);
    // Golden border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, -6, 36, 12);
    ctx.strokeRect(-6, -18, 12, 36);
    // Central Emerald Gem
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // 3. Flowing Emerald Priestly Robes & Mantle
    const robeGrad = ctx.createLinearGradient(0, -20, 0, 48);
    robeGrad.addColorStop(0, '#059669');
    robeGrad.addColorStop(1, '#047857');
    ctx.fillStyle = robeGrad;
    ctx.beginPath();
    ctx.moveTo(-24, -20);
    ctx.lineTo(24, -20);
    ctx.quadraticCurveTo(34, 15, 28, 48);
    ctx.lineTo(-28, 48);
    ctx.quadraticCurveTo(-34, 15, -24, -20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // White Clerical Stole with Gold Hem
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-10, -18, 20, 62);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-10, -18, 20, 62);

    // Embroidered Green Addition Cross on Stole
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-7, 2, 14, 4);
    ctx.fillRect(-2, -3, 4, 14);

    // 4. Emerald Clerical Hood / Cowl (Head)
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.moveTo(0, -68);
    ctx.quadraticCurveTo(-26, -56, -22, -26);
    ctx.lineTo(22, -26);
    ctx.quadraticCurveTo(26, -56, 0, -68);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Serene Face in Shadow
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(0, -40, 14, 0, Math.PI * 2);
    ctx.fill();

    // Gentle Golden Eyes
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 8;
    ctx.fillRect(-8, -42, 5, 2);
    ctx.fillRect(3, -42, 5, 2);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  /**
   * PALADIN (The Multiplier ×):
   * Radiant Golden Sun Champion with winged valkyrie helm,
   * solar crown, gilded full plate, and massive Sunburst Multiplier Tower Shield.
   */
  _drawPaladin(ctx) {
    ctx.save();

    // 1. Radiant Solar Sunburst Aura (Pulses with turn multiplier!)
    const auraRadius = 45 + this.multiplier * 6;
    const auraPulse = Math.sin(this.idleTimer * 2.5) * 4;
    const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, auraRadius + auraPulse);
    auraGrad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
    auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, auraRadius + auraPulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Right Hand: Golden Solar Warhammer
    ctx.save();
    ctx.translate(38, -6);
    ctx.rotate(0.3);
    // Shaft
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-3, -35, 6, 75);
    // Heavy Gilded Hammer Head
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.fillRect(-15, -42, 30, 18);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-15, -42, 30, 18);
    ctx.shadowBlur = 0;
    ctx.restore();

    // 3. Gilded Fortress Plate Cuirass & Eagle Pauldrons
    const goldGrad = ctx.createLinearGradient(-30, 0, 30, 0);
    goldGrad.addColorStop(0, '#d97706');
    goldGrad.addColorStop(0.5, '#fbbf24');
    goldGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.moveTo(-28, -20);
    ctx.lineTo(28, -20);
    ctx.lineTo(24, 38);
    ctx.lineTo(-24, 38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Layered Golden Pauldrons
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-32, -18, 16, 0, Math.PI * 2);
    ctx.arc(32, -18, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. Winged Solar Great-Helm (Head)
    // Left Wing
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-16, -42);
    ctx.quadraticCurveTo(-42, -58, -48, -75);
    ctx.quadraticCurveTo(-30, -55, -16, -30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(16, -42);
    ctx.quadraticCurveTo(42, -58, 48, -75);
    ctx.quadraticCurveTo(30, -55, 16, -30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Golden Helm Dome
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -42, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Radiant Golden Visor Slit
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-14, -38, 28, 6);
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 14;
    ctx.fillRect(-11, -37, 22, 4);
    ctx.shadowBlur = 0;

    // Solar Gem Crest on Crown
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -55, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Massive Sunburst Multiplication Tower Shield (×) Held Forward
    ctx.save();
    ctx.translate(-24, 8);
    ctx.rotate(-0.08);

    // Tower Shield Face
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-22, -32, 44, 70);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.strokeRect(-22, -32, 44, 70);

    // Inner gold shield rim
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-18, -28, 36, 62);

    // Intricate Crossed Multiplication Emblem (×)
    ctx.save();
    ctx.translate(0, 3);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(-13, -13);
    ctx.lineTo(13, 13);
    ctx.moveTo(13, -13);
    ctx.lineTo(-13, 13);
    ctx.stroke();
    // Inner bright white cross
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
    ctx.restore();
  }

  _drawHeldBadge(ctx) {
    ctx.save();
    ctx.translate(0, -this.radius - 36);

    // Glowing round badge
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Value text
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.heldValue}`, 0, 1);

    ctx.restore();
  }

  _drawPaladinMultiplierBadge(ctx) {
    ctx.save();
    ctx.translate(0, -this.radius - 36);

    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`×${this.multiplier}`, 0, 1);

    ctx.restore();
  }

  _drawDeadGrave(ctx) {
    // Fallen cross / tombstone
    ctx.fillStyle = '#475569';
    ctx.fillRect(-22, -28, 44, 56);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-34, -14, 68, 14);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RIP', 0, 12);
  }
}
