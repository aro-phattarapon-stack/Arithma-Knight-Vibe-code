import { CONFIG } from '../config.js';

/**
 * Handles all canvas-based visual effects:
 * - Dynamic stage backgrounds:
 *     * Stages 1–3: Enchanted Fantasy Forest (Ancient trees, sunbeams, mossy stone ring, floating spores & leaves)
 *     * Stages 4–5: Deep Medieval Dungeon (Gothic stone brick walls, pointed arches, burning wall sconces, flagstones)
 *     * Stage 6: Grand Golden Astral Sanctuary (Towering golden marble pillars, divine godrays, sacred factorial mandala for Factorio)
 * - Floating combat numbers (damage, heals, buffs)
 * - Attack slash effects and geometric bursts
 * - Healing aura motes and Paladin golden multiplier beams
 * - Ambient torches, glowing embers, forest spores, and golden stardust
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.slashEffects = [];
    this.beamEffects = [];

    // Ambient dungeon torch lights (Stages 4-5)
    this.torches = [
      { x: 260, y: 180, flicker: 0, timer: Math.random() * 10 },
      { x: 740, y: 180, flicker: 0, timer: Math.random() * 10 },
      { x: 1220, y: 180, flicker: 0, timer: Math.random() * 10 },
      { x: 1700, y: 180, flicker: 0, timer: Math.random() * 10 },
    ];

    // Ambient enchanted forest spores and drifting leaves (Stages 1-3)
    this.forestSpores = [];
    for (let i = 0; i < 40; i++) {
      this.forestSpores.push({
        x: Math.random() * CONFIG.CANVAS.WIDTH,
        y: Math.random() * CONFIG.CANVAS.HEIGHT,
        size: 2.5 + Math.random() * 4,
        vx: 12 + Math.random() * 22,
        vy: 8 + Math.random() * 18,
        swayTimer: Math.random() * Math.PI * 2,
        swaySpeed: 1.2 + Math.random() * 1.6,
        color: Math.random() < 0.65 ? '#34d399' : (Math.random() < 0.5 ? '#fbbf24' : '#6ee7b7'),
        alpha: 0.35 + Math.random() * 0.45,
        isLeaf: Math.random() < 0.28,
      });
    }

    // Ambient golden stardust & astral glints (Stage 6: Factorio)
    this.goldenMotes = [];
    for (let i = 0; i < 45; i++) {
      this.goldenMotes.push({
        x: Math.random() * CONFIG.CANVAS.WIDTH,
        y: Math.random() * CONFIG.CANVAS.HEIGHT,
        size: 2 + Math.random() * 4.5,
        vy: -25 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 20,
        twinkleTimer: Math.random() * Math.PI * 2,
        twinkleSpeed: 2 + Math.random() * 3,
        color: Math.random() < 0.7 ? '#fbbf24' : '#fef08a',
        alpha: 0.4 + Math.random() * 0.55,
      });
    }
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.slashEffects = [];
    this.beamEffects = [];
  }

  /**
   * Spawn floating combat text (Damage, Heal, Buff)
   */
  spawnFloatingText(x, y, text, color = '#ffffff', size = 38) {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y - 20,
      text,
      color,
      size,
      vy: -110,
      alpha: 1.0,
      lifetime: CONFIG.VISUALS.FLOATING_NUMBER_DURATION,
      elapsed: 0,
    });
  }

  /**
   * Spawn attack slash effect across target
   */
  spawnSlash(x, y, color = '#4a90e2', type = 'slash') {
    this.slashEffects.push({
      x,
      y,
      color,
      type,
      duration: CONFIG.VISUALS.SLASH_EFFECT_DURATION,
      elapsed: 0,
      angle: (Math.random() - 0.5) * 0.8,
    });

    // Accompanying sparks
    const sparkCount = type === 'divide' ? 24 : 14;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color,
        alpha: 1.0,
        decay: 1.8 + Math.random() * 2.0,
      });
    }
  }

  /**
   * Spawn golden beam / sparkles from Paladin to target ally
   */
  spawnPaladinBuffBeam(fromX, fromY, toX, toY, color = '#f59e0b') {
    this.beamEffects.push({
      fromX,
      fromY,
      toX,
      toY,
      color,
      elapsed: 0,
      duration: 0.6,
    });

    for (let i = 0; i < 30; i++) {
      const progress = Math.random();
      const px = fromX + (toX - fromX) * progress + (Math.random() - 0.5) * 40;
      const py = fromY + (toY - fromY) * progress + (Math.random() - 0.5) * 40;
      this.particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 80,
        vy: -40 - Math.random() * 80,
        size: 4 + Math.random() * 5,
        color: '#fef08a',
        alpha: 1.0,
        decay: 1.5,
      });
    }
  }

  /**
   * Spawn green healing motes floating upward around target
   */
  spawnHealMotes(x, y) {
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 80,
        y: y + 20 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 50,
        vy: -90 - Math.random() * 100,
        size: 4 + Math.random() * 6,
        color: '#34d399',
        alpha: 1.0,
        decay: 1.2,
      });
    }
  }

  /**
   * Spawn enemy death cosmic explosion
   */
  spawnDeathBurst(x, y, color = '#ec4899') {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 320;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 8,
        color,
        alpha: 1.0,
        decay: 1.4,
      });
    }
  }

  update(dt) {
    // 1. Update ambient torches & emit fire sparks (Dungeon)
    for (const torch of this.torches) {
      torch.timer += dt * 8;
      torch.flicker = Math.sin(torch.timer * 1.5) * 0.15 + Math.cos(torch.timer * 3.7) * 0.1;

      if (Math.random() < 0.35) {
        this.particles.push({
          x: torch.x + (Math.random() - 0.5) * 16,
          y: torch.y - 28,
          vx: (Math.random() - 0.5) * 25,
          vy: -40 - Math.random() * 45,
          size: 2 + Math.random() * 3.5,
          color: Math.random() < 0.6 ? '#f59e0b' : '#ef4444',
          alpha: 0.9,
          decay: 2.2,
        });
      }
    }

    // 2. Update ambient forest spores & drifting leaves (Forest Stages 1-3)
    const w = CONFIG.CANVAS.WIDTH;
    const h = CONFIG.CANVAS.HEIGHT;
    for (const sp of this.forestSpores) {
      sp.swayTimer += dt * sp.swaySpeed;
      sp.x += (sp.vx + Math.sin(sp.swayTimer) * 18) * dt;
      sp.y += sp.vy * dt;
      if (sp.x > w + 20) sp.x = -20;
      if (sp.y > h + 20) {
        sp.y = -20;
        sp.x = Math.random() * w;
      }
    }

    // 3. Update golden stardust & astral glints (Sanctuary Stage 6)
    for (const gm of this.goldenMotes) {
      gm.twinkleTimer += dt * gm.twinkleSpeed;
      gm.y += gm.vy * dt;
      gm.x += (gm.vx + Math.sin(gm.twinkleTimer) * 12) * dt;
      if (gm.y < -20) {
        gm.y = h + 20;
        gm.x = Math.random() * w;
      }
    }

    // 4. Update general combat particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
    }
    this.particles = this.particles.filter((p) => p.alpha > 0);

    // 5. Update floating texts
    for (const ft of this.floatingTexts) {
      ft.elapsed += dt;
      ft.y += ft.vy * dt;
      ft.vy *= 0.94; // Decelerate upward
      const lifeRatio = ft.elapsed / ft.lifetime;
      ft.alpha = Math.max(0, 1 - lifeRatio * 1.1);
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.elapsed < ft.lifetime);

    // 6. Update slash effects
    for (const s of this.slashEffects) {
      s.elapsed += dt;
    }
    this.slashEffects = this.slashEffects.filter((s) => s.elapsed < s.duration);

    // 7. Update beam effects
    for (const b of this.beamEffects) {
      b.elapsed += dt;
    }
    this.beamEffects = this.beamEffects.filter((b) => b.elapsed < b.duration);
  }

  /**
   * Main entry point to draw the stage-specific environment:
   * - Stages 1–3: Enchanted Fantasy Forest
   * - Stages 4–5: Deep Medieval Dungeon
   * - Stage 6: Grand Golden Astral Sanctuary (Factorio)
   */
  drawStageBackground(ctx, stageNumber = 1) {
    if (stageNumber <= 3) {
      this._drawForestBackground(ctx);
    } else if (stageNumber === 4 || stageNumber === 5) {
      this._drawDungeonBackground(ctx);
    } else {
      this._drawGoldenSanctuaryBackground(ctx);
    }
  }

  /**
   * Backward-compatible alias
   */
  drawDungeonBackground(ctx) {
    this._drawDungeonBackground(ctx);
  }

  // =========================================================================
  // ENVIRONMENT 1: ENCHANTED FANTASY FOREST (Stages 1–3)
  // =========================================================================
  _drawForestBackground(ctx) {
    const w = CONFIG.CANVAS.WIDTH;
    const h = CONFIG.CANVAS.HEIGHT;
    const horizon = 330;

    ctx.save();

    // 1. Deep Twilight Forest Canopy Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#020c08');
    skyGrad.addColorStop(0.35, '#062016');
    skyGrad.addColorStop(0.7, '#0b3224');
    skyGrad.addColorStop(1, '#114230');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizon);

    // 2. Distant Misty Mountain Ridges
    ctx.fillStyle = 'rgba(6, 34, 24, 0.65)';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(0, 240);
    ctx.quadraticCurveTo(320, 180, 600, 230);
    ctx.quadraticCurveTo(920, 270, 1200, 200);
    ctx.quadraticCurveTo(1540, 150, 1920, 220);
    ctx.lineTo(1920, horizon);
    ctx.closePath();
    ctx.fill();

    // 3. Dense Forest Tree Silhouettes along the horizon
    ctx.fillStyle = '#061a12';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let x = 0; x <= w; x += 40) {
      const treeH = 35 + Math.sin(x * 0.05) * 18 + (x % 70);
      ctx.lineTo(x + 15, horizon - treeH);
      ctx.lineTo(x + 30, horizon);
    }
    ctx.closePath();
    ctx.fill();

    // 4. Volumetric Sunbeams / Godrays filtering through the canopy
    ctx.save();
    const rayOrigins = [
      { x1: 340, x2: 440, bx1: 200, bx2: 480 },
      { x1: 720, x2: 860, bx1: 640, bx2: 1020 },
      { x1: 1180, x2: 1300, bx1: 1080, bx2: 1420 },
      { x1: 1540, x2: 1640, bx1: 1460, bx2: 1780 },
    ];
    for (const ray of rayOrigins) {
      const rayGrad = ctx.createLinearGradient(ray.x1, 0, ray.bx1, horizon + 350);
      rayGrad.addColorStop(0, 'rgba(110, 231, 183, 0.12)');
      rayGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.06)');
      rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(ray.x1, 0);
      ctx.lineTo(ray.x2, 0);
      ctx.lineTo(ray.bx2, horizon + 360);
      ctx.lineTo(ray.bx1, horizon + 360);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 5. Mossy Forest Floor
    const floorGrad = ctx.createLinearGradient(0, horizon, 0, h);
    floorGrad.addColorStop(0, '#13281c');
    floorGrad.addColorStop(0.25, '#0f2016');
    floorGrad.addColorStop(0.65, '#0a160f');
    floorGrad.addColorStop(1, '#040906');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizon, w, h - horizon);

    // Subtle forest floor winding paths / moss patches
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.04)';
    ctx.lineWidth = 3;
    for (let y = horizon + 35; y < h; y += 65) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y - 15, w * 0.7, y + 20, w, y);
      ctx.stroke();
    }

    // 6. Central Ancient Forest Arithmetic Arena Circle (Isometric Squash)
    ctx.save();
    ctx.translate(w / 2, 510);
    ctx.scale(2.1, 0.5);

    // Outer mossy rune ring
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 360, 0, Math.PI * 2);
    ctx.stroke();

    // Inner gold sun ring
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.16)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 305, 0, Math.PI * 2);
    ctx.stroke();

    // Sacred nature runes along the ring
    const forestOps = ['+', '−', '×', '÷'];
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      const rx = Math.cos(ang) * 335;
      const ry = Math.sin(ang) * 335;

      ctx.save();
      ctx.translate(rx, ry);
      ctx.scale(1 / 2.1, 2.0); // De-squash for text
      ctx.fillStyle = 'rgba(110, 231, 183, 0.45)';
      ctx.font = "900 24px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(forestOps[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();

    // 7. Ancient Guardian Trees (Framing Left & Right)
    // Left Tree Trunk & Roots
    ctx.fillStyle = '#08140e';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(160, 0);
    ctx.bezierCurveTo(130, 200, 180, horizon, 220, horizon + 220);
    ctx.bezierCurveTo(250, horizon + 360, 160, h, 0, h);
    ctx.closePath();
    ctx.fill();

    // Left overhanging branches & leafy clusters
    this._drawFoliageCluster(ctx, 60, 40, 160, '#064e3b', '#047857');
    this._drawFoliageCluster(ctx, 160, 90, 140, '#047857', '#059669');
    this._drawFoliageCluster(ctx, 280, 50, 120, '#064e3b', '#10b981');

    // Right Tree Trunk & Roots
    ctx.fillStyle = '#08140e';
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w - 160, 0);
    ctx.bezierCurveTo(w - 130, 200, w - 180, horizon, w - 220, horizon + 220);
    ctx.bezierCurveTo(w - 250, horizon + 360, w - 160, h, w, h);
    ctx.closePath();
    ctx.fill();

    // Right overhanging branches & leafy clusters
    this._drawFoliageCluster(ctx, w - 60, 40, 160, '#064e3b', '#047857');
    this._drawFoliageCluster(ctx, w - 160, 90, 140, '#047857', '#059669');
    this._drawFoliageCluster(ctx, w - 280, 50, 120, '#064e3b', '#10b981');

    // Top canopy vines & foliage trim
    for (let x = 320; x < w - 320; x += 180) {
      this._drawFoliageCluster(ctx, x, 20, 110, '#04281c', '#064e3b');
    }

    // 8. Glowing Forest Spores & Drifting Leaves
    for (const sp of this.forestSpores) {
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = sp.color;
      ctx.shadowColor = sp.color;
      ctx.shadowBlur = 10;

      if (sp.isLeaf) {
        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y, sp.size * 1.8, sp.size * 0.8, sp.swayTimer, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  _drawFoliageCluster(ctx, cx, cy, radius, darkColor, lightColor) {
    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
    grad.addColorStop(0, lightColor);
    grad.addColorStop(0.7, darkColor);
    grad.addColorStop(1, 'rgba(4, 20, 14, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // =========================================================================
  // ENVIRONMENT 2: DEEP MEDIEVAL DUNGEON (Stages 4–5)
  // =========================================================================
  _drawDungeonBackground(ctx) {
    const w = CONFIG.CANVAS.WIDTH;
    const h = CONFIG.CANVAS.HEIGHT;

    ctx.save();

    // 1. Stone wall & dungeon arches
    const wallHeight = 310;
    const gradWall = ctx.createLinearGradient(0, 0, 0, wallHeight);
    gradWall.addColorStop(0, '#07090d');
    gradWall.addColorStop(0.55, '#12151e');
    gradWall.addColorStop(1, '#181d28');
    ctx.fillStyle = gradWall;
    ctx.fillRect(0, 0, w, wallHeight);

    // Granite masonry brick pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 2;
    const brickH = 50;
    const brickW = 120;
    for (let y = 0; y < wallHeight; y += brickH) {
      const offsetX = (Math.floor(y / brickH) % 2) * (brickW / 2);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      for (let x = offsetX; x < w; x += brickW) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + brickH);
        ctx.stroke();
      }
    }

    // Dungeon Pointed Gothic Arches in background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 4;
    for (let x = 200; x < w; x += 380) {
      ctx.beginPath();
      ctx.moveTo(x - 120, wallHeight);
      ctx.lineTo(x - 120, 150);
      ctx.arcTo(x - 120, 70, x, 70, 120);
      ctx.arcTo(x + 120, 70, x + 120, 150, 120);
      ctx.lineTo(x + 120, wallHeight);
      ctx.stroke();
    }

    // 2. Dungeon Flagstone Floor
    const gradFloor = ctx.createLinearGradient(0, wallHeight, 0, h);
    gradFloor.addColorStop(0, '#191d27');
    gradFloor.addColorStop(0.3, '#12141c');
    gradFloor.addColorStop(1, '#090a0e');
    ctx.fillStyle = gradFloor;
    ctx.fillRect(0, wallHeight, w, h - wallHeight);

    // Flagstone perspective lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, wallHeight);
      ctx.lineTo(x * 1.25 - w * 0.125, h);
      ctx.stroke();
    }
    for (let y = wallHeight + 40; y < h; y += 75) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3. Central Ancient Arithmetic Arena Rune (Circle on floor)
    ctx.save();
    ctx.translate(w / 2, 510);
    ctx.scale(2.1, 0.5);
    ctx.strokeStyle = 'rgba(74, 144, 226, 0.16)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 360, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(245, 166, 35, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 310, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4. Draw Torches & Warm Sconce Glow
    for (const torch of this.torches) {
      const glowRadius = 180 + torch.flicker * 35;
      const glowGrad = ctx.createRadialGradient(
        torch.x,
        torch.y - 25,
        10,
        torch.x,
        torch.y - 25,
        glowRadius
      );
      glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
      glowGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.12)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(torch.x, torch.y - 25, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Iron wall sconce
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(torch.x - 6, torch.y - 10, 12, 40);
      ctx.fillStyle = '#1a202c';
      ctx.beginPath();
      ctx.moveTo(torch.x - 14, torch.y - 10);
      ctx.lineTo(torch.x + 14, torch.y - 10);
      ctx.lineTo(torch.x + 8, torch.y + 12);
      ctx.lineTo(torch.x - 8, torch.y + 12);
      ctx.closePath();
      ctx.fill();

      // Flame core
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(torch.x, torch.y - 24 + torch.flicker * 4, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(torch.x, torch.y - 24 + torch.flicker * 3, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================================
  // ENVIRONMENT 3: GRAND GOLDEN ASTRAL SANCTUARY (Stage 6: Factorio Boss)
  // =========================================================================
  _drawGoldenSanctuaryBackground(ctx) {
    const w = CONFIG.CANVAS.WIDTH;
    const h = CONFIG.CANVAS.HEIGHT;
    const horizon = 320;

    ctx.save();

    // 1. Divine Celestial Golden Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#2d1804');
    skyGrad.addColorStop(0.3, '#3f2407');
    skyGrad.addColorStop(0.65, '#22132e');
    skyGrad.addColorStop(1, '#150a22');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizon);

    // 2. Divine Golden Beams / Godrays from High Celestial Zenith
    ctx.save();
    const divineSunGrad = ctx.createRadialGradient(w / 2, -100, 50, w / 2, 400, 1100);
    divineSunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.38)');
    divineSunGrad.addColorStop(0.25, 'rgba(245, 158, 11, 0.22)');
    divineSunGrad.addColorStop(0.65, 'rgba(217, 119, 6, 0.08)');
    divineSunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = divineSunGrad;
    ctx.fillRect(0, 0, w, h);

    // 6 Distinct Golden Light Shafts
    const rays = [
      { x1: 960, y1: 0, x2: 240, y2: h, width: 90, alpha: 0.1 },
      { x1: 960, y1: 0, x2: 620, y2: h, width: 120, alpha: 0.14 },
      { x1: 960, y1: 0, x2: 960, y2: h, width: 160, alpha: 0.18 },
      { x1: 960, y1: 0, x2: 1300, y2: h, width: 120, alpha: 0.14 },
      { x1: 960, y1: 0, x2: 1680, y2: h, width: 90, alpha: 0.1 },
    ];
    for (const r of rays) {
      ctx.strokeStyle = `rgba(254, 240, 138, ${r.alpha})`;
      ctx.lineWidth = r.width;
      ctx.beginPath();
      ctx.moveTo(r.x1, r.y1);
      ctx.lineTo(r.x2, r.y2);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Towering Soaring Golden Arches
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';
    ctx.lineWidth = 6;
    for (const archX of [300, 960, 1620]) {
      ctx.beginPath();
      ctx.arc(archX, 360, 260, Math.PI, 0);
      ctx.stroke();
    }

    // 4. Polished Golden Marble Dais (Floor)
    const floorGrad = ctx.createLinearGradient(0, horizon, 0, h);
    floorGrad.addColorStop(0, '#2b1b07');
    floorGrad.addColorStop(0.25, '#1e1204');
    floorGrad.addColorStop(0.6, '#140c03');
    floorGrad.addColorStop(1, '#090501');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizon, w, h - horizon);

    // Golden reflective perspective grid lines
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.08)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, horizon);
      ctx.lineTo(x * 1.3 - w * 0.15, h);
      ctx.stroke();
    }
    for (let y = horizon + 40; y < h; y += 75) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 5. Grand Factorial Sacred Mandala (Floor Inscription underneath Factorio)
    ctx.save();
    ctx.translate(w / 2, 510);
    ctx.scale(2.1, 0.5);

    // Outer sacred golden factorial ring
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, 380, 0, Math.PI * 2);
    ctx.stroke();

    // Mid golden solar ring
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 310, 0, Math.PI * 2);
    ctx.stroke();

    // 12-Pointed Sacred Geometry Star (Factorial Mandala)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const r = i % 2 === 0 ? 305 : 180;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Inscribed Factorial Glyphs along the ring (6! -> 5! -> 4! -> 3! -> 2! -> 1!)
    const factorialGlyphs = ['6! = 720', '5! = 120', '4! = 24', '3! = 6', '2! = 2', '1! = 1'];
    for (let i = 0; i < factorialGlyphs.length; i++) {
      const ang = (i * Math.PI) / 3;
      const gx = Math.cos(ang) * 345;
      const gy = Math.sin(ang) * 345;

      ctx.save();
      ctx.translate(gx, gy);
      ctx.scale(1 / 2.1, 2.0);
      ctx.fillStyle = '#fef08a';
      ctx.font = "900 22px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(factorialGlyphs[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();

    // 6. Magnificent Fluted Golden Marble Pillars
    const pillarPositions = [140, 420, 1500, 1780];
    for (const px of pillarPositions) {
      this._drawGoldenColumn(ctx, px, horizon);
    }

    // 7. Ambient Shimmering Golden Stardust & Astral Glints
    for (const gm of this.goldenMotes) {
      ctx.save();
      ctx.globalAlpha = gm.alpha;
      ctx.fillStyle = gm.color;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(gm.x, gm.y, gm.size, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle cross on larger motes
      if (gm.size > 3.5) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(gm.x - gm.size * 1.8, gm.y);
        ctx.lineTo(gm.x + gm.size * 1.8, gm.y);
        ctx.moveTo(gm.x, gm.y - gm.size * 1.8);
        ctx.lineTo(gm.x, gm.y + gm.size * 1.8);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  _drawGoldenColumn(ctx, x, horizon) {
    ctx.save();
    const colW = 68;

    // Gilded Capital (Top)
    const capGrad = ctx.createLinearGradient(x - colW / 2 - 18, 0, x + colW / 2 + 18, 0);
    capGrad.addColorStop(0, '#78350f');
    capGrad.addColorStop(0.3, '#f59e0b');
    capGrad.addColorStop(0.5, '#fef08a');
    capGrad.addColorStop(0.7, '#f59e0b');
    capGrad.addColorStop(1, '#78350f');

    ctx.fillStyle = capGrad;
    ctx.fillRect(x - colW / 2 - 16, 20, colW + 32, 28);
    ctx.fillRect(x - colW / 2 - 8, 48, colW + 16, 18);

    // Fluted Column Shaft
    const shaftGrad = ctx.createLinearGradient(x - colW / 2, 0, x + colW / 2, 0);
    shaftGrad.addColorStop(0, '#451a03');
    shaftGrad.addColorStop(0.2, '#b45309');
    shaftGrad.addColorStop(0.45, '#fbbf24');
    shaftGrad.addColorStop(0.65, '#fef08a');
    shaftGrad.addColorStop(0.85, '#d97706');
    shaftGrad.addColorStop(1, '#451a03');

    ctx.fillStyle = shaftGrad;
    ctx.fillRect(x - colW / 2, 66, colW, horizon + 280);

    // Vertical Fluting Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2;
    for (let fx = x - colW / 2 + 10; fx < x + colW / 2; fx += 12) {
      ctx.beginPath();
      ctx.moveTo(fx, 66);
      ctx.lineTo(fx, horizon + 280);
      ctx.stroke();
    }

    // Specular Highlight line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, 66);
    ctx.lineTo(x + 6, horizon + 280);
    ctx.stroke();

    // Column Base / Pedestal
    ctx.fillStyle = capGrad;
    ctx.fillRect(x - colW / 2 - 14, horizon + 280, colW + 28, 32);
    ctx.fillRect(x - colW / 2 - 22, horizon + 312, colW + 44, 24);

    ctx.restore();
  }

  drawOverlays(ctx) {
    ctx.save();

    // 1. Render golden Paladin beam
    for (const b of this.beamEffects) {
      const progress = b.elapsed / b.duration;
      const alpha = Math.sin(progress * Math.PI);
      ctx.save();
      ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.9})`;
      ctx.lineWidth = 8 + Math.sin(progress * 15) * 4;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 24;

      ctx.beginPath();
      ctx.moveTo(b.fromX, b.fromY);
      ctx.quadraticCurveTo(
        (b.fromX + b.toX) / 2,
        Math.min(b.fromY, b.toY) - 90,
        b.toX,
        b.toY
      );
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Render slashes and impact cuts
    for (const s of this.slashEffects) {
      const progress = s.elapsed / s.duration;
      const alpha = Math.max(0, 1 - progress);
      const len = 140 * Math.sin(progress * Math.PI);

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 20;

      if (s.type === 'divide') {
        // Double diagonal division slash
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(-len, -len * 0.4);
        ctx.lineTo(len, len * 0.4);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        // Sharp sword slash arc
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, len * 0.7, -0.6, 0.6);
        ctx.stroke();

        ctx.strokeStyle = s.color;
        ctx.lineWidth = 12;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Render general combat particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 4. Render floating combat numbers
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `900 ${ft.size}px 'Segoe UI', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Drop shadow / stroke
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(ft.text, ft.x, ft.y);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
