import { CONFIG } from '../config.js';

/**
 * Catalog of Mathematical Axioms / Theorems for Roguelike drafting
 */
export const AXIOM_CATALOG = {
  vitality_constant: {
    id: 'vitality_constant',
    name: 'Vitality Constant',
    glyph: 'c_hp',
    category: 'vitality',
    tag: 'VITALITY AXIOM',
    desc: 'Empowers the life essence of the Order. Increases Max HP of all Knights by +15 and immediately heals 15 HP.',
    flavor: '"Life is not an arbitrary variable; it is an invariant truth of the realm."',
    badgeColor: '#10b981',
    iconSvg: `<svg class="axiom-svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  },
  zero_barrier: {
    id: 'zero_barrier',
    name: 'Zero Barrier',
    glyph: '0·x',
    category: 'protection',
    tag: 'DEFENSIVE THEOREM',
    desc: 'At stage start, all living Knights manifest a Zero Barrier that negates the first incoming enemy attack (Damage × 0 = 0).',
    flavor: '"Any force multiplied by nullity collapses into void."',
    badgeColor: '#0ea5e9',
    iconSvg: `<svg class="axiom-svg" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/></svg>`,
  },
  calculus_ap: {
    id: 'calculus_ap',
    name: 'Calculus AP Booster',
    glyph: 'd/dt',
    category: 'tempo',
    tag: 'TACTICAL THEOREM',
    desc: 'Accelerates tactical tempo. The Order receives 4 Action Points (AP) on Round 1 of every stage instead of 3.',
    flavor: '"The rate of tactical change outpaces the stagnant flow of time."',
    badgeColor: '#f59e0b',
    iconSvg: `<svg class="axiom-svg" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`,
  },
  rebirth_formula: {
    id: 'rebirth_formula',
    name: 'Rebirth Formula',
    glyph: 'lim→∞',
    category: 'vitality',
    tag: 'SACRED AXIOM',
    desc: 'Upon clearing any stage, any fallen Knight is resurrected from the grave with 50% Max HP.',
    flavor: '"Even at the limit of zero, mathematical continuity ensures resurrection."',
    badgeColor: '#8b5cf6',
    iconSvg: `<svg class="axiom-svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
  },
  euclidean_blade: {
    id: 'euclidean_blade',
    name: 'Euclidean Blade',
    glyph: 'A−B',
    category: 'offense',
    tag: 'OFFENSIVE THEOREM',
    desc: 'Sharpens the Subtraction Knight\'s blade. Deals +6 additional true damage on every subtraction strike.',
    flavor: '"A straight line is the shortest path between a blade and a foe\'s demise."',
    badgeColor: '#3b82f6',
    iconSvg: `<svg class="axiom-svg" viewBox="0 0 24 24"><path d="M14.7 3.3a1 1 0 0 0-1.4 0L8.6 8 4 6.7a1 1 0 0 0-1.2 1.2L4 12.6l-2.7 2.7a1 1 0 0 0 0 1.4l2 2a1 1 0 0 0 1.4 0L7.4 16l4.7 1.2a1 1 0 0 0 1.2-1.2L12 11.4l4.7-4.7a1 1 0 0 0 0-1.4l-2-2z"/></svg>`,
  },
  harmonic_resonance: {
    id: 'harmonic_resonance',
    name: 'Harmonic Resonance',
    glyph: '1/n',
    category: 'vitality',
    tag: 'HEALING THEOREM',
    desc: 'Whenever Cleric casts Addition Heal on an ally, holy harmonic waves heal all other living Knights for +4 splash HP.',
    flavor: '"Resonant frequencies bind souls together in harmonious health."',
    badgeColor: '#10b981',
    iconSvg: `<svg class="axiom-svg" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
  },
  prime_cleave: {
    id: 'prime_cleave',
    name: 'Prime Cleave',
    glyph: 'P_div',
    category: 'offense',
    tag: 'OFFENSIVE THEOREM',
    desc: 'Berserker\'s Division Cleave is guaranteed to deal a minimum of 12 damage, even against resilient low-HP anomalies.',
    flavor: '"Indivisible primes shatter beneath relentless tactical force."',
    badgeColor: '#ef4444',
    iconSvg: `<svg class="axiom-svg" viewBox="0 0 24 24"><path d="M19.41 7.41l-4.83-4.83c-.37-.37-.88-.58-1.41-.58H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8.83c0-.53-.21-1.04-.59-1.42zM14 8V3.5L18.5 8H14z"/></svg>`,
  },
  exponential_zeal: {
    id: 'exponential_zeal',
    name: 'Exponential Zeal',
    glyph: '×2⁰',
    category: 'tempo',
    tag: 'TACTICAL THEOREM',
    desc: 'Paladin begins every battle already charged at a ×2 multiplier instead of starting at ×1.',
    flavor: '"Fervor accumulates before the battle even commences."',
    badgeColor: '#eab308',
    iconSvg: `<svg class="axiom-svg" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
  },
  infinity_well: {
    id: 'infinity_well',
    name: 'Infinity Number Well',
    glyph: '∞_pool',
    category: 'tempo',
    tag: 'RESOURCE THEOREM',
    desc: 'Expands the party\'s tactical number pool from 4 numbers to 5 numbers rolled every round.',
    flavor: '"The reservoir of numerical possibilities overflows with strategic options."',
    badgeColor: '#06b6d4',
    iconSvg: `<svg class="axiom-svg" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>`,
  },
  pythagorean_bulwark: {
    id: 'pythagorean_bulwark',
    name: 'Pythagorean Bulwark',
    glyph: 'a²+b²',
    category: 'protection',
    tag: 'DEFENSIVE THEOREM',
    desc: 'When any Knight drops below 30% HP, their defense hardens, reducing incoming enemy damage by 40%.',
    flavor: '"The hypotenuse stands unyielding against the harshest siege."',
    badgeColor: '#6366f1',
    iconSvg: `<svg class="axiom-svg" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  },
};

/**
 * AxiomSystem coordinates drafting, tracking, and triggering
 * Mathematical Theorems across the Roguelike campaign.
 */
export class AxiomSystem {
  constructor() {
    this.activeAxiomIds = new Set();
  }

  reset() {
    this.activeAxiomIds.clear();
  }

  hasAxiom(axiomId) {
    return this.activeAxiomIds.has(axiomId);
  }

  getActiveAxioms() {
    return Array.from(this.activeAxiomIds).map((id) => AXIOM_CATALOG[id]).filter(Boolean);
  }

  /**
   * Generates a randomized draft offering of 3 unselected axioms
   * @param {number} count
   * @returns {Array<Object>}
   */
  getRandomDraftOptions(count = 3) {
    const unpicked = Object.values(AXIOM_CATALOG).filter(
      (axiom) => !this.activeAxiomIds.has(axiom.id)
    );

    if (unpicked.length === 0) return [];

    // Shuffle and slice
    const shuffled = [...unpicked].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Claim an axiom to become part of the active campaign build
   * @param {string} axiomId
   * @param {import('../entities/Hero.js').Hero[]} heroes
   * @param {import('./CombatSystem.js').CombatSystem} combat
   * @returns {Object|null}
   */
  claimAxiom(axiomId, heroes = [], combat = null) {
    const axiom = AXIOM_CATALOG[axiomId];
    if (!axiom) return null;

    this.activeAxiomIds.add(axiomId);

    // Immediate on-claim effects
    if (axiomId === 'vitality_constant') {
      for (const hero of heroes) {
        hero.maxHp += 15;
        hero.heal(15);
      }
      combat?.log?.(`[AXIOM CLAIMED] Vitality Constant! All Knights gain +15 Max HP and heal 15 HP!`, 'heal');
    } else {
      combat?.log?.(`[AXIOM CLAIMED] ${axiom.name}: ${axiom.desc}`, 'buff');
    }

    return axiom;
  }

  /**
   * Invoked upon entering a new stage
   * @param {number} stageNum
   * @param {import('../entities/Hero.js').Hero[]} heroes
   * @param {import('./CombatSystem.js').CombatSystem} combat
   */
  onStageStart(stageNum, heroes, combat) {
    // 1. Zero Barrier: grant 1 shield to each living hero
    if (this.hasAxiom('zero_barrier')) {
      for (const hero of heroes) {
        if (hero.isAlive()) {
          hero.barrier = 1;
        }
      }
      combat?.log?.('[ZERO BARRIER] Divine Zero Barrier manifests! First enemy strike against each Knight is nullified (×0)!', 'buff');
    }

    // 2. Exponential Zeal: Paladin starts at ×2
    if (this.hasAxiom('exponential_zeal')) {
      const paladin = heroes.find((h) => h.id === 'paladin');
      if (paladin && paladin.isAlive()) {
        paladin.multiplier = Math.max(2, paladin.multiplier);
        combat?.log?.(`[EXPONENTIAL ZEAL] Paladin commences battle pre-charged at ×${paladin.multiplier} multiplier!`, 'buff');
      }
    }
  }

  /**
   * Invoked right before advancing stages (handling stage clear recovery & resurrection)
   * @param {import('../entities/Hero.js').Hero[]} heroes
   * @param {import('./CombatSystem.js').CombatSystem} combat
   */
  onStageClear(heroes, combat) {
    // Rebirth Formula: revive any fallen heroes with 50% HP
    if (this.hasAxiom('rebirth_formula')) {
      for (const hero of heroes) {
        if (!hero.isAlive()) {
          hero.isDead = false;
          hero.hp = Math.round(hero.maxHp * 0.5);
          combat?.log?.(`[REBIRTH FORMULA] ${hero.name} resurrected from the grave with ${hero.hp} HP!`, 'heal');
        }
      }
    }
  }
}
