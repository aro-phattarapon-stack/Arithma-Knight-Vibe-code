import { CONFIG } from '../config.js';
import { Enemy } from '../entities/Enemy.js';

/**
 * Manages the 6-stage dungeon campaign, enemy spawning, stage unlocks, and scoring records.
 */
export class StageManager {
  constructor() {
    this.currentStageIndex = 0; // 0-indexed (Stage 1 is index 0)
    this.stages = CONFIG.STAGES;
    this.stageScores = [];
    this.totalScore = 0;

    // Progression: load highest unlocked stage from localStorage (default to Stage 1)
    this.highestUnlockedStage = 1;
    try {
      const saved = localStorage.getItem('arithma_unlocked_stage');
      if (saved) {
        this.highestUnlockedStage = Math.max(1, Math.min(CONFIG.COMBAT.MAX_STAGES, parseInt(saved, 10) || 1));
      }
    } catch {
      // LocalStorage fallback
    }
  }

  reset() {
    this.currentStageIndex = 0;
    this.stageScores = [];
    this.totalScore = 0;
  }

  getCurrentStageNumber() {
    return this.currentStageIndex + 1;
  }

  getCurrentStageConfig() {
    return this.stages[this.currentStageIndex] || null;
  }

  isFinalStage() {
    return this.currentStageIndex >= this.stages.length - 1;
  }

  isStageUnlocked(stageNumber) {
    return stageNumber <= this.highestUnlockedStage;
  }

  unlockStage(stageNumber) {
    if (stageNumber > this.highestUnlockedStage && stageNumber <= CONFIG.COMBAT.MAX_STAGES) {
      this.highestUnlockedStage = stageNumber;
      try {
        localStorage.setItem('arithma_unlocked_stage', String(stageNumber));
      } catch {}
    }
  }

  unlockAllStages() {
    this.highestUnlockedStage = CONFIG.COMBAT.MAX_STAGES;
    try {
      localStorage.setItem('arithma_unlocked_stage', String(CONFIG.COMBAT.MAX_STAGES));
    } catch {}
  }

  setStage(stageNumber) {
    const idx = Math.max(0, Math.min(this.stages.length - 1, stageNumber - 1));
    this.currentStageIndex = idx;
  }

  /**
   * Spawns new Enemy instances for the current stage
   * @returns {Enemy[]}
   */
  spawnCurrentStageEnemies() {
    const config = this.getCurrentStageConfig();
    if (!config) return [];
    return config.ENEMIES.map((eConfig) => new Enemy(eConfig));
  }

  /**
   * Computes score for the cleared stage according to specification:
   * max(0, (StageNumber * 1000) + (SumOfLivingHeroesHP * 10) - (RoundsTaken * 50))
   * @param {number} livingHeroesHpSum
   * @param {number} roundsTaken
   * @returns {{ stageNumber: number, stageBonus: number, hpBonus: number, roundPenalty: number, stageScore: number, totalScore: number }}
   */
  recordStageClear(livingHeroesHpSum, roundsTaken) {
    const stageNum = this.getCurrentStageNumber();
    const stageBonus = stageNum * 1000;
    const hpBonus = livingHeroesHpSum * 10;
    const roundPenalty = roundsTaken * 50;

    const stageScore = Math.max(0, stageBonus + hpBonus - roundPenalty);
    this.totalScore += stageScore;

    // Unlock next stage permanently
    this.unlockStage(stageNum + 1);

    const record = {
      stageNumber: stageNum,
      stageName: this.getCurrentStageConfig().NAME,
      stageBonus,
      hpBonus,
      roundPenalty,
      stageScore,
      totalScore: this.totalScore,
      roundsTaken,
    };

    this.stageScores.push(record);
    return record;
  }

  advanceToNextStage() {
    if (!this.isFinalStage()) {
      this.currentStageIndex++;
      this.unlockStage(this.currentStageIndex + 1);
      return true;
    }
    return false;
  }
}
