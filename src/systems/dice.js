// === DnD-style Dice System (五月花号规则参考) ===

// Roll a single die: roll(20) → random 1-20
export function roll(sides) { return Math.floor(Math.random() * sides) + 1; }

// Roll with advantage (best of 2d20)
export function rollAdvantage() { return Math.max(roll(20), roll(20)); }

// Roll with disadvantage (worst of 2d20)
export function rollDisadvantage() { return Math.min(roll(20), roll(20)); }

// Roll NdS: rollDice(2, 6) → 2d6 result + sum
export function rollDice(count, sides) {
  const results = Array.from({length:count}, ()=>roll(sides));
  return { results, total: results.reduce((a,b)=>a+b,0) };
}

// Attribute keys
export const ATTRS = ['str','dex','con','int','wis','cha'];
export const ATTR_NAMES = { str:'力量', dex:'敏捷', con:'体质', int:'智力', wis:'感知', cha:'魅力' };

// Calculate modifier: (stat - 10) / 2 (floor, DnD 5e style)
export function mod(stat) { return Math.floor((stat - 10) / 2); }

// Skill list with associated attributes (DnD 5e)
export const SKILLS = {
  athletics:'str', acrobatics:'dex', sleightOfHand:'dex', stealth:'dex',
  arcana:'int', history:'int', investigation:'int', nature:'int', religion:'int',
  animalHandling:'wis', insight:'wis', medicine:'wis', perception:'wis', survival:'wis',
  deception:'cha', intimidation:'cha', performance:'cha', persuasion:'cha',
};
export const SKILL_NAMES = {
  athletics:'运动', acrobatics:'特技', sleightOfHand:'巧手', stealth:'潜行',
  arcana:'奥秘', history:'历史', investigation:'调查', nature:'自然', religion:'宗教',
  animalHandling:'驯兽', insight:'洞悉', medicine:'医疗', perception:'察觉', survival:'生存',
  deception:'欺瞒', intimidation:'威吓', performance:'表演', persuasion:'说服',
};

// Roll a skill check: d20 + attribute modifier + proficiency bonus
export function skillCheck(attrs, skillName, proficiencyBonus = 2, advantage = null, proficiency = false) {
  const attrKey = SKILLS[skillName];
  const attrMod = mod(attrs[attrKey] || 10);
  const prof = proficiency ? proficiencyBonus : 0;
  let d20Result;
  if (advantage === 'advantage') d20Result = rollAdvantage();
  else if (advantage === 'disadvantage') d20Result = rollDisadvantage();
  else d20Result = roll(20);
  const total = d20Result + attrMod + prof;
  return { d20: d20Result, modifier: attrMod, proficiency: prof, total,
    isCrit: d20Result === 20, isFumble: d20Result === 1,
    label: `${skillName}(+${attrMod+prof}) = ${d20Result}+${attrMod+prof} = ${total}` };
}

// Attack roll: d20 + STR/DEX mod + prof
export function attackRoll(attrs, useDex = false, profBonus = 2) {
  const attrMod = useDex ? mod(attrs.dex||10) : mod(attrs.str||10);
  const d20Result = roll(20);
  const total = d20Result + attrMod + profBonus;
  return { d20:d20Result, modifier:attrMod, proficiency:profBonus, total, isCrit:d20Result===20, isFumble:d20Result===1 };
}

// Damage roll: weapon damage + modifier
export function damageRoll(damageDice, attrMod = 0) {
  const [count, sides] = damageDice.split('d').map(Number);
  const { results, total } = rollDice(count, sides);
  return { dice: results, diceTotal: total, modifier: attrMod, total: total + attrMod };
}

// Default DnD point-buy stats (27 points)
export const POINT_BUY_COSTS = { 8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9 };
export const DEFAULT_STATS = { str:12, dex:12, con:12, int:12, wis:12, cha:12 };
export const POINT_BUY_TOTAL = 27;

// Weapon damage dice mapping
export const DAMAGE_DICE = {
  unarmed:'1d4', dagger:'1d4', shortsword:'1d6', longsword:'1d8', greatsword:'2d6',
  mace:'1d6', warhammer:'1d8', greataxe:'1d12', quarterstaff:'1d6', bow:'1d8',
};

// AC calculation: base 10 + DEX mod + armor bonus
export function calcAC(dexScore, armorBonus = 0) { return 10 + mod(dexScore) + armorBonus; }

// Initiative: d20 + DEX mod
export function initiative(dexScore) { return roll(20) + mod(dexScore); }
