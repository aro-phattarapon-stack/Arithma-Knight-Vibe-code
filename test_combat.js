import { CONFIG } from './src/config.js';
import { Hero } from './src/entities/Hero.js';
import { Enemy } from './src/entities/Enemy.js';
import { CombatSystem } from './src/systems/CombatSystem.js';
import { StageManager } from './src/systems/StageManager.js';
import { AxiomSystem, AXIOM_CATALOG } from './src/systems/AxiomSystem.js';

console.log('--- Testing Arithma Knights Systems ---');

// 1. Test Heroes Initialization
const knight = new Hero(CONFIG.HEROES.KNIGHT);
const berserker = new Hero(CONFIG.HEROES.BERSERKER);
const cleric = new Hero(CONFIG.HEROES.CLERIC);
const paladin = new Hero(CONFIG.HEROES.PALADIN);

console.assert(knight.hp === 40, `Knight HP should be 40, got ${knight.hp}`);
console.assert(berserker.hp === 35, `Berserker HP should be 35, got ${berserker.hp}`);
console.assert(cleric.hp === 30, `Cleric HP should be 30, got ${cleric.hp}`);
console.assert(paladin.hp === 45, `Paladin HP should be 45, got ${paladin.hp}`);
console.log('✓ All 4 Knights initialized with correct HP');

// 2. Test Stage Manager & Enemy Spawning
const stageManager = new StageManager();
console.assert(stageManager.getCurrentStageNumber() === 1, 'Initial stage should be 1');
const enemies = stageManager.spawnCurrentStageEnemies();
console.assert(enemies.length === 2, `Stage 1 should have 2 enemies, got ${enemies.length}`);
console.assert(enemies[0].name === 'Constanta' && enemies[0].hp === 24, 'First enemy is Constanta with 24 HP');
console.assert(enemies[1].name === 'Positron' && enemies[1].hp === 28, 'Second enemy is Positron with 28 HP');
console.log('✓ Stage 1 enemies spawned correctly');

// 3. Test Combat System Turn & Pool
const combat = new CombatSystem();
const heroes = [knight, berserker, cleric, paladin];
combat.startNewRound(heroes);

console.assert(combat.ap === 3, `AP should be 3, got ${combat.ap}`);
console.assert(combat.numberPool.length === 4, `Pool should have 4 numbers, got ${combat.numberPool.length}`);
console.log(`✓ Pool rolled: [${combat.numberPool.join(', ')}] with 3 AP`);

// 4. Test Equipping (Free Action)
combat.selectPoolNumber(0);
const paladinEquipAttempt = combat.equipHeroFromPool(paladin);
console.assert(paladinEquipAttempt === null, 'Paladin must reject equipping numbers from pool');
console.assert(paladin.heldValue === null, 'Paladin heldValue remains null');
console.assert(paladin.equip(7) === false, 'paladin.equip(7) must return false');
console.log('✓ Paladin cannot hold numbers from pool (rejection confirmed)');

// Since pool number 0 remains selected after Paladin rejection, equip it directly to Knight
const equippedVal = combat.equipHeroFromPool(knight);
console.assert(equippedVal !== null, 'Equipped value should not be null');
console.assert(knight.heldValue === equippedVal, 'Knight should hold equipped value');
console.assert(combat.ap === 3, 'Equipping must be a free action costing 0 AP');
console.assert(combat.numberPool.length === 3, 'Equipped number removed from pool');
console.log(`✓ Knight equipped [${equippedVal}] for 0 AP (AP remains ${combat.ap})`);

// 5. Test Calculation Preview
combat.selectActor(knight);
const preview = combat.getCalculationPreview(enemies[0]);
console.assert(preview !== null, 'Preview should be generated');
console.assert(preview.type === 'subtract', 'Knight preview type is subtract');
console.assert(preview.projectedVal === Math.max(0, 24 - equippedVal), 'Preview projected HP matches formula');
console.log(`✓ Calculation preview: ${preview.formula} => ${preview.projectedVal} HP`);

// 6. Test Knight Action Execution (1 AP)
const mockParticles = {
  spawnSlash: () => {},
  spawnFloatingText: () => {},
  spawnDeathBurst: () => {},
  spawnHealMotes: () => {},
  spawnPaladinBuffBeam: () => {},
};
const mockAudio = {
  playKnightSlash: () => {},
  playBerserkerDivision: () => {},
  playClericHeal: () => {},
  playPaladinBuff: () => {},
  playEnemyAttack: () => {},
};

const initialEnemyHp = enemies[0].hp;
const actResult = combat.executeAction(enemies[0], heroes, enemies, mockParticles, mockAudio);
console.assert(actResult.success === true, 'Action executed successfully');
console.assert(combat.ap === 2, `AP should be 2 after action, got ${combat.ap}`);
console.assert(enemies[0].hp === Math.max(0, initialEnemyHp - equippedVal), `Enemy HP should be reduced by ${equippedVal}`);
console.assert(knight.heldValue === null, 'Knight consumed held number');
console.log(`✓ Knight executed subtraction attack! Enemy HP: ${initialEnemyHp} -> ${enemies[0].hp}`);

// 7. Test Berserker Division
combat.numberPool = [4];
combat.selectPoolNumber(0);
combat.equipHeroFromPool(berserker);
combat.selectActor(berserker);

const enemyForBerserker = enemies[1]; // Positron (28 HP)
const expectedNewHp = Math.floor(28 / 4); // 7 HP
const berserkerPreview = combat.getCalculationPreview(enemyForBerserker);
console.assert(berserkerPreview.projectedVal === expectedNewHp, `Berserker preview should be ${expectedNewHp}`);

combat.executeAction(enemyForBerserker, heroes, enemies, mockParticles, mockAudio);
console.assert(enemyForBerserker.hp === expectedNewHp, `Enemy HP after division should be ${expectedNewHp}, got ${enemyForBerserker.hp}`);
console.log(`✓ Berserker executed division attack! Positron HP: 28 -> ${enemyForBerserker.hp}`);

// 8. Test Cleric Heal
cleric.hp = 12; // Hurt cleric
combat.numberPool = [8];
combat.selectPoolNumber(0);
combat.equipHeroFromPool(cleric);
combat.selectActor(cleric);

const healPreview = combat.getCalculationPreview(cleric);
console.assert(healPreview.projectedVal === 20, 'Cleric projected HP should be 12 + 8 = 20');

combat.executeAction(cleric, heroes, enemies, mockParticles, mockAudio);
console.assert(cleric.hp === 20, `Cleric HP should be 20, got ${cleric.hp}`);
console.log(`✓ Cleric executed addition heal! Cleric HP: 12 -> ${cleric.hp}`);

// 9. Test Paladin Multiplier Buff
combat.ap = 2;
paladin.multiplier = 3;
knight.heldValue = 6;
combat.selectActor(paladin);

const buffPreview = combat.getCalculationPreview(knight);
console.assert(buffPreview.projectedVal === 18, `Projected held should be 6 * 3 = 18, got ${buffPreview.projectedVal}`);

combat.executeAction(knight, heroes, enemies, mockParticles, mockAudio);
console.assert(knight.heldValue === 18, `Knight held value should be 18, got ${knight.heldValue}`);
console.assert(paladin.multiplier === 1, `Paladin multiplier resets to 1, got ${paladin.multiplier}`);
console.log(`✓ Paladin empowered Knight! Held value multiplied: 6 -> ${knight.heldValue}`);

// Test Paladin multiplier round progression and stage transition reset
combat.round = 1;
combat.startNewRound(heroes);
console.assert(paladin.multiplier === 1, `Paladin must start Round 1 with 1x multiplier, got ${paladin.multiplier}`);

combat.round = 2;
combat.startNewRound(heroes);
console.assert(paladin.multiplier === 2, `Paladin must charge to 2x multiplier on Round 2, got ${paladin.multiplier}`);

combat.round = 3;
combat.startNewRound(heroes);
console.assert(paladin.multiplier === 3, `Paladin must charge to 3x multiplier on Round 3, got ${paladin.multiplier}`);

// Simulate stage advance: new stage starts with Round 1
combat.round = 1;
combat.startNewRound(heroes);
console.assert(paladin.multiplier === 1, `Paladin multiplier must reset to 1x when next stage begins on Round 1, got ${paladin.multiplier}`);
console.log('✓ Paladin multiplier progression (1x -> 2x -> 3x) and stage transition reset to 1x verified');

// 10. Test Stage Score Formula
// max(0, (StageNumber * 1000) + (SumOfLivingHeroesHP * 10) - (RoundsTaken * 50))
const livingHpSum = knight.hp + berserker.hp + cleric.hp + paladin.hp;
const roundsTaken = 2;
const scoreRecord = stageManager.recordStageClear(livingHpSum, roundsTaken);
const expectedScore = Math.max(0, 1 * 1000 + livingHpSum * 10 - 2 * 50);
console.assert(scoreRecord.stageScore === expectedScore, `Score mismatch: expected ${expectedScore}, got ${scoreRecord.stageScore}`);
console.log(`✓ Stage Score Formula verified: ${scoreRecord.stageScore} pts (Stage 1, ${roundsTaken} rounds, ${livingHpSum} party HP)`);

// 11. Test Bosses in Stages 5 & 6 (Big Int & Factorio)
console.assert(CONFIG.STAGES[4].ENEMIES[1].NAME === 'Big Int', 'Stage 5 Boss is Big Int');
console.assert(CONFIG.STAGES[4].ENEMIES[1].HP === 1024, `Big Int HP should be 1024, got ${CONFIG.STAGES[4].ENEMIES[1].HP}`);
console.assert(CONFIG.STAGES[5].ENEMIES[1].NAME === 'Factorio', 'Stage 6 Final Boss is Factorio');
console.assert(CONFIG.STAGES[5].ENEMIES[1].HP === 720, `Factorio initial HP should be 6! = 720, got ${CONFIG.STAGES[5].ENEMIES[1].HP}`);
console.assert(CONFIG.STAGES[5].ENEMIES[1].IS_FACTORIAL_BOSS === true, 'Factorio must be flagged as IS_FACTORIAL_BOSS');
console.log('✓ Stage 5 Boss (Big Int 1,024 HP) and Stage 6 Final Boss (Factorio 6! = 720 HP) properly configured');

// 12. Test Factorio Factorial Cascade (6! -> 5! -> 4! -> 3! -> 2! -> 1! -> Dead)
stageManager.setStage(6);
const stage6Enemies = stageManager.spawnCurrentStageEnemies();
const factorio = stage6Enemies.find((e) => e.name === 'Factorio');
console.assert(factorio !== undefined, 'Factorio exists in Stage 6');
console.assert(factorio.hp === 720, 'Factorio starts at Phase 1: 6! (720 HP)');
console.assert(factorio.glyph === '6!', 'Factorio initial glyph is 6!');

// Strike 1: Kill 6! (720 HP) -> Collapses to 5! (120 HP)
factorio.takeDamage(720);
console.assert(factorio.isAlive() === true, 'Factorio survives 6! death by collapsing to 5!');
console.assert(factorio.hp === 120, `Factorio HP should be 120 (5!), got ${factorio.hp}`);
console.assert(factorio.glyph === '5!', `Factorio glyph should be 5!, got ${factorio.glyph}`);
console.assert(factorio.lastPhaseShift !== null && factorio.lastPhaseShift.to === '5!', 'Phase shift recorded');
console.log('✓ Factorio collapsed from 6! (720) -> 5! (120)');

// Strike 2: Kill 5! (120 HP) with Berserker setHp(0) -> Collapses to 4! (24 HP)
factorio.setHp(0);
console.assert(factorio.isAlive() === true, 'Factorio survives 5! death by collapsing to 4!');
console.assert(factorio.hp === 24, `Factorio HP should be 24 (4!), got ${factorio.hp}`);
console.assert(factorio.glyph === '4!', `Factorio glyph should be 4!, got ${factorio.glyph}`);
console.log('✓ Factorio collapsed from 5! (120) -> 4! (24)');

// Strike 3: Kill 4! (24 HP) -> Collapses to 3! (6 HP)
factorio.takeDamage(30);
console.assert(factorio.hp === 6, `Factorio HP should be 6 (3!), got ${factorio.hp}`);
console.assert(factorio.glyph === '3!', `Factorio glyph should be 3!, got ${factorio.glyph}`);
console.log('✓ Factorio collapsed from 4! (24) -> 3! (6)');

// Strike 4: Kill 3! (6 HP) -> Collapses to 2! (2 HP)
factorio.takeDamage(10);
console.assert(factorio.hp === 2, `Factorio HP should be 2 (2!), got ${factorio.hp}`);
console.assert(factorio.glyph === '2!', `Factorio glyph should be 2!, got ${factorio.glyph}`);
console.log('✓ Factorio collapsed from 3! (6) -> 2! (2)');

// Strike 5: Kill 2! (2 HP) -> Collapses to 1! (1 HP)
factorio.takeDamage(5);
console.assert(factorio.hp === 1, `Factorio HP should be 1 (1!), got ${factorio.hp}`);
console.assert(factorio.glyph === '1!', `Factorio glyph should be 1!, got ${factorio.glyph}`);
console.log('✓ Factorio collapsed from 2! (2) -> 1! (1)');

// Strike 6: Kill 1! (1 HP) -> Final Defeat!
factorio.takeDamage(5);
console.assert(factorio.isAlive() === false, 'Factorio must be dead after 1! is depleted');
console.assert(factorio.hp === 0, 'Factorio final HP is 0');
console.assert(factorio.isDead === true, 'Factorio isDead is true');
console.log('✓ Factorio final collapse 1! -> 0! Defeated successfully!');

// 13. Test Stage Select & Progression Unlocks
stageManager.reset();
console.assert(stageManager.isStageUnlocked(1) === true, 'Stage 1 should be unlocked by default');
stageManager.unlockStage(2);
console.assert(stageManager.isStageUnlocked(2) === true, 'Stage 2 should be unlocked after clear');
stageManager.setStage(5);
console.assert(stageManager.getCurrentStageNumber() === 5, 'StageManager should jump to Stage 5');
const stage5Enemies = stageManager.spawnCurrentStageEnemies();
console.assert(stage5Enemies.some((e) => e.name === 'Big Int' && e.hp === 1024), 'Stage 5 spawned Big Int Boss with 1,024 HP');
console.assert(CONFIG.STAGES[4].ENEMIES[1].TACTIC.includes('1,024'), 'Stage 5 Boss has tactical intel advice with 1,024 HP');
console.log('✓ Stage Selection, Stage Jumping, and Enemy Bestiary Intel verified');

// 14. Test Roguelike Mathematical Axioms & Theorems System
console.log('\n--- Testing Mathematical Axioms & Theorems System ---');
const axiomSys = new AxiomSystem();
console.assert(Object.keys(AXIOM_CATALOG).length === 10, 'Axiom catalog contains 10 theorems');

// A. Test Draft Roll (3 unique random theorems)
const draft1 = axiomSys.getRandomDraftOptions(3);
console.assert(draft1.length === 3, `Draft offering should have 3 options, got ${draft1.length}`);
console.assert(new Set(draft1.map((a) => a.id)).size === 3, 'Draft offering contains 3 distinct theorems');
console.log('✓ Random Axiom drafting (3 distinct unpicked options) verified');

// B. Test Vitality Constant (+15 Max HP & Heal)
const testHeroes = [
  new Hero(CONFIG.HEROES.KNIGHT),
  new Hero(CONFIG.HEROES.BERSERKER),
  new Hero(CONFIG.HEROES.CLERIC),
  new Hero(CONFIG.HEROES.PALADIN),
];
const initialKnightMaxHp = testHeroes[0].maxHp;
axiomSys.claimAxiom('vitality_constant', testHeroes);
console.assert(testHeroes[0].maxHp === initialKnightMaxHp + 15, `Knight Max HP should be ${initialKnightMaxHp + 15}, got ${testHeroes[0].maxHp}`);
console.assert(testHeroes[0].hp === initialKnightMaxHp + 15, `Knight HP should be ${initialKnightMaxHp + 15}, got ${testHeroes[0].hp}`);
console.log('✓ Vitality Constant (+15 Max HP & Instant Heal) verified');

// C. Test Zero Barrier (Negates 1 hit completely, Damage x 0 = 0)
axiomSys.claimAxiom('zero_barrier', testHeroes);
axiomSys.onStageStart(2, testHeroes, combat);
console.assert(testHeroes[0].barrier === 1, 'Knight should possess 1 Zero Barrier shield');

const dummyEnemy = new Enemy({
  ID: 'test_enemy',
  NAME: 'Test Anomaly',
  HP: 50,
  ATTACK: 20,
  COLOR: '#ffffff',
  GLYPH: '?',
  SCALE: 1,
});

const preHp = testHeroes[0].hp;
const damageTaken = testHeroes[0].takeDamage(dummyEnemy.attack);
console.assert(damageTaken === 0, `Zero Barrier must negate damage to 0, got ${damageTaken}`);
console.assert(testHeroes[0].hp === preHp, `Hero HP remains unchanged at ${preHp}`);
console.assert(testHeroes[0].barrier === 0, 'Zero Barrier consumed after absorption');

// Next hit should deal regular damage
const normalDmg = testHeroes[0].takeDamage(dummyEnemy.attack);
console.assert(normalDmg === dummyEnemy.attack, `Next strike deals full ${dummyEnemy.attack} damage`);
console.assert(testHeroes[0].hp === preHp - dummyEnemy.attack, 'HP reduced after barrier consumed');
console.log('✓ Zero Barrier (Damage x 0 = 0 nullification) verified');

// D. Test Calculus AP Booster (4 AP on Round 1)
axiomSys.claimAxiom('calculus_ap', testHeroes);
combat.round = 1;
combat.startNewRound(testHeroes, axiomSys);
console.assert(combat.ap === 4, `Round 1 AP with Calculus Booster should be 4, got ${combat.ap}`);

combat.round = 2;
combat.startNewRound(testHeroes, axiomSys);
console.assert(combat.ap === 3, `Round 2 AP should be normal 3 AP, got ${combat.ap}`);
console.log('✓ Calculus AP Booster (4 AP on Round 1, 3 AP afterwards) verified');

// E. Test Rebirth Formula (Resurrect fallen heroes with 50% HP upon stage clear)
axiomSys.claimAxiom('rebirth_formula', testHeroes);
const berserkerHero = testHeroes[1];
berserkerHero.hp = 0;
berserkerHero.isDead = true;
console.assert(berserkerHero.isAlive() === false, 'Berserker is dead');

axiomSys.onStageClear(testHeroes, combat);
console.assert(berserkerHero.isAlive() === true, 'Berserker resurrected by Rebirth Formula');
console.assert(berserkerHero.hp === Math.round(berserkerHero.maxHp * 0.5), `Berserker revived with 50% HP (${berserkerHero.hp}/${berserkerHero.maxHp})`);
console.log('✓ Rebirth Formula (50% HP Resurrection upon stage clear) verified');

// F. Test Euclidean Blade (+6 True Damage for Knight)
axiomSys.claimAxiom('euclidean_blade', testHeroes);
combat.setAxiomSystem(axiomSys);
const knightHero = testHeroes[0];
knightHero.heldValue = 10;
combat.selectActor(knightHero);

const targetEnemy = new Enemy({
  ID: 'target_anomaly',
  NAME: 'Target Anomaly',
  HP: 50,
  ATTACK: 10,
  COLOR: '#ffffff',
  GLYPH: 'T',
  SCALE: 1,
});

const previewWithEuclidean = combat.getCalculationPreview(targetEnemy);
console.assert(previewWithEuclidean.formula === '50 − (10 + 6)', `Preview formula should include +6: ${previewWithEuclidean.formula}`);
console.assert(previewWithEuclidean.projectedVal === 34, `Projected HP should be 34 (50 - 16), got ${previewWithEuclidean.projectedVal}`);

combat.executeAction(targetEnemy, testHeroes, [targetEnemy], mockParticles, mockAudio);
console.assert(targetEnemy.hp === 34, `Enemy HP after Euclidean strike should be 34, got ${targetEnemy.hp}`);
console.log('✓ Euclidean Blade (+6 True Damage on Subtraction) verified');

// G. Test Prime Cleave (Berserker min 12 damage floor)
axiomSys.claimAxiom('prime_cleave', testHeroes);
const lowHpEnemy = new Enemy({
  ID: 'low_enemy',
  NAME: 'Resilient Anomaly',
  HP: 15,
  ATTACK: 5,
  COLOR: '#ffffff',
  GLYPH: 'L',
  SCALE: 1,
});
berserkerHero.heldValue = 2; // 15 / 2 = 7 (normally deals 15 - 7 = 8 damage)
combat.selectActor(berserkerHero);
const berserkerPreviewAxiom = combat.getCalculationPreview(lowHpEnemy);
console.assert(berserkerPreviewAxiom.diff === '-12', `Prime Cleave guarantees min 12 damage, got ${berserkerPreviewAxiom.diff}`);
combat.executeAction(lowHpEnemy, testHeroes, [lowHpEnemy], mockParticles, mockAudio);
console.assert(lowHpEnemy.hp === 3, `Enemy HP should be 15 - 12 = 3, got ${lowHpEnemy.hp}`);
console.log('✓ Prime Cleave (Min 12 Damage Floor on Division) verified');

// H. Test Infinity Well (5 Pool Numbers)
axiomSys.claimAxiom('infinity_well', testHeroes);
combat.rollNumberPool();
console.assert(combat.numberPool.length === 5, `Infinity Well should roll 5 numbers, got ${combat.numberPool.length}`);
console.log('✓ Infinity Number Well (Pool expanded to 5 numbers) verified');

// =========================================================================
// 12. Test Negative Entity (Negabat): Negative HP, Cleric (+) and Berserker (÷)
// =========================================================================
console.log('\n--- Testing Negative Enemy: Negabat (Negative Chiropter) ---');

// 1. Verify Stage 3 & Stage 4 rosters have Negabat
const stage3Negabat = CONFIG.STAGES[2].ENEMIES.find(e => e.ID === 'negabat_1');
console.assert(stage3Negabat && stage3Negabat.HP === -24, 'Stage 3 must contain Negabat with -24 HP');
console.assert(stage3Negabat.IS_NEGATIVE === true, 'Stage 3 Negabat must be flagged IS_NEGATIVE');

const stage4Negabat = CONFIG.STAGES[3].ENEMIES.find(e => e.ID === 'negabat_2');
console.assert(stage4Negabat && stage4Negabat.HP === -36, 'Stage 4 must contain Negabat Prime with -36 HP');
console.assert(stage4Negabat.IS_NEGATIVE === true, 'Stage 4 Negabat must be flagged IS_NEGATIVE');
console.log('✓ Stage 3 (-24 HP) & Stage 4 (-36 HP) Negabat configurations verified');

// 2. Instantiate Negabat Entity
const negabat = new Enemy(stage3Negabat);
console.assert(negabat.isNegative === true, 'Negabat must have isNegative = true');
console.assert(negabat.hp === -24, `Negabat HP starts at -24, got ${negabat.hp}`);
console.assert(negabat.isAlive() === true, 'Negabat isAlive() must be true while hp < 0');
console.log('✓ Negabat spawned with negative debt (-24 HP) and isAlive() is true');

// 3. Knight Subtraction Attack (Worsens negative debt)
knightHero.heldValue = 6;
combat.ap = 3;
combat.selectActor(knightHero);
const knightNegativePreview = combat.getCalculationPreview(negabat);
console.assert(knightNegativePreview.type === 'subtract', 'Knight action against Negabat is subtract');
console.assert(knightNegativePreview.projectedVal < -24, `Knight subtraction drives HP further negative: ${knightNegativePreview.projectedVal}`);

combat.executeAction(negabat, testHeroes, [negabat], mockParticles, mockAudio);
console.assert(negabat.hp < -24, `Negabat HP deepened into negative debt: ${negabat.hp}`);
console.assert(negabat.isAlive() === true, 'Negabat remains alive after Knight subtraction');
console.log(`✓ Knight subtraction pushed Negabat debt further into negative (${negabat.hp} HP) without slaying it`);

// 4. Berserker Division Attack (Shrinks negative debt)
negabat.hp = -24;
negabat.isDead = false;
berserkerHero.heldValue = 6; // -24 / 6 = -4
combat.ap = 3;
combat.selectActor(berserkerHero);
const berserkerNegativePreview = combat.getCalculationPreview(negabat);
console.assert(berserkerNegativePreview.projectedVal === -4, `Berserker preview should show -24 / 6 = -4, got ${berserkerNegativePreview.projectedVal}`);

combat.executeAction(negabat, testHeroes, [negabat], mockParticles, mockAudio);
console.assert(negabat.hp === -4, `Negabat HP after division should be -4, got ${negabat.hp}`);
console.assert(negabat.isAlive() === true, 'Negabat with -4 HP is still alive');
console.log('✓ Berserker division shrank Negabat negative debt: -24 -> -4 HP');

// 5. Cleric Addition Attack (Restores debt to 0, slaying Negabat!)
const clericHero = testHeroes[2];
clericHero.heldValue = 4; // -4 + 4 = 0
combat.ap = 3;
combat.selectActor(clericHero);

const clericTargets = combat.getValidTargets(testHeroes, [negabat]);
console.assert(clericTargets.includes(negabat), 'Cleric must be able to target negative enemy (Negabat)');

const clericNegativePreview = combat.getCalculationPreview(negabat);
console.assert(clericNegativePreview.projectedVal === 0, `Cleric preview should show -4 + 4 = 0, got ${clericNegativePreview.projectedVal}`);
console.assert(clericNegativePreview.summary.includes('CLEANSES TO 0'), 'Cleric preview flags cleansing kill');

combat.executeAction(negabat, testHeroes, [negabat], mockParticles, mockAudio);
console.assert(negabat.hp === 0, `Negabat HP after holy addition should be 0, got ${negabat.hp}`);
console.assert(negabat.isDead === true, 'Negabat must be marked dead at 0 HP');
console.assert(negabat.isAlive() === false, 'Negabat isAlive() must return false at 0 HP');
console.log('✓ Cleric holy addition restored debt: -4 + 4 = 0 HP! Negabat banished!');

// 6. Test Direct One-Shot Cleansing: Fresh Negabat (-24 HP) with Paladin buffed Cleric (+24)
const freshNegabat = new Enemy(stage3Negabat);
clericHero.heldValue = 24;
combat.ap = 3;
combat.selectActor(clericHero);
combat.executeAction(freshNegabat, testHeroes, [freshNegabat], mockParticles, mockAudio);
console.assert(freshNegabat.hp === 0, 'Paladin buffed Cleric restores -24 + 24 = 0');
console.assert(freshNegabat.isAlive() === false, 'Negabat slayed in one turn');
console.log('✓ Paladin buffed Cleric (+24) one-shot cleansed Negabat to 0 HP');

// 7. Test Berserker Direct Truncation: Negabat (-4 HP) divided by 6 -> trunc(-4 / 6) = 0!
const smallNegabat = new Enemy(stage3Negabat);
smallNegabat.hp = -4;
berserkerHero.heldValue = 6;
combat.ap = 3;
combat.selectActor(berserkerHero);
combat.executeAction(smallNegabat, testHeroes, [smallNegabat], mockParticles, mockAudio);
console.assert(smallNegabat.hp === 0, 'trunc(-4 / 6) = 0');
console.assert(smallNegabat.isAlive() === false, 'Negabat slayed by division truncation to 0');
console.log('✓ Berserker division truncation (-4 / 6 = 0) directly slayed Negabat');

console.log('\n🌟 ALL ARITHMA KNIGHTS & AXIOM THEOREM TESTS PASSED PERFECTLY! 🌟');
