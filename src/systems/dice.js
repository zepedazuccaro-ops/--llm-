// === COC 1d100 Dice System (Call of Cthulhu 7th Edition) ===
// Core mechanic: roll d100 under skill value to succeed
// Extreme success: roll <= skill/5
// Hard success: roll <= skill/2
// Regular success: roll <= skill
// Failure: roll > skill
// Fumble: roll >= 96 (or 100 if skill >= 50)

export function rollD100() { return Math.floor(Math.random() * 100) + 1; }
export function rollDice(count, sides) {
  const results = Array.from({length:count},()=>Math.floor(Math.random()*sides)+1);
  return {results,total:results.reduce((a,b)=>a+b,0)};
}

// COC skill check: returns {roll, skill, result, level}
export function skillCheck(skillValue, difficulty = 'regular') {
  const roll = rollD100();
  const isFumble = (skillValue >= 50 && roll >= 100) || (skillValue < 50 && roll >= 96);

  let level, success;
  if (isFumble) { level='fumble'; success=false; }
  else if (roll <= skillValue / 5) { level='extreme'; success=true; }
  else if (roll <= skillValue / 2) { level='hard'; success=true; }
  else if (roll <= skillValue) { level='regular'; success=true; }
  else { level='failure'; success=false; }

  // Bonus/Penalty dice: roll an extra d10, use best/worst with the ones digit
  return { roll, skill: skillValue, success, level,
    label: `${roll} vs ${skillValue} → ${level.toUpperCase()}` };
}

// Bonus die: roll extra tens die, take best
export function bonusDie(skillValue) { const r1=rollD100(), r2=rollD100(); const best=Math.min(r1,r2); return {...skillCheck(skillValue, 'regular', best), bonusDie:true}; }
// Penalty die: roll extra tens die, take worst
export function penaltyDie(skillValue) { const r1=rollD100(), r2=rollD100(); const worst=Math.max(r1,r2); return {...skillCheck(skillValue, 'regular', worst), penaltyDie:true}; }

// COC attributes (1-100 scale, average 50)
export const ATTRIBUTES = {
  str:{name:'力量',desc:'物理力量'}, con:{name:'体质',desc:'健康与耐力'},
  siz:{name:'体型',desc:'身高体重体型'}, dex:{name:'敏捷',desc:'速度与灵巧'},
  app:{name:'外貌',desc:'外表吸引力'}, int:{name:'智力',desc:'学习与推理'},
  pow:{name:'意志',desc:'精神力与意志'}, edu:{name:'教育',desc:'知识与修养'},
};
export const ATTRIBUTE_KEYS = Object.keys(ATTRIBUTES);

// COC skills (1-100, base values)
export const SKILLS = {
  // Combat
  dodge:{name:'闪避',base:'dex/2',category:'combat'},
  fighting_brawl:{name:'格斗',base:25,category:'combat'},
  firearm_handgun:{name:'手枪',base:20,category:'combat'},
  // Social
  charm:{name:'魅惑',base:15,category:'social'},
  fastTalk:{name:'话术',base:5,category:'social'},
  intimidate:{name:'恐吓',base:15,category:'social'},
  persuade:{name:'说服',base:10,category:'social'},
  psychology:{name:'心理学',base:10,category:'social'},
  // Investigation
  libraryUse:{name:'图书馆',base:20,category:'investigation'},
  listen:{name:'聆听',base:20,category:'investigation'},
  spotHidden:{name:'侦查',base:25,category:'investigation'},
  track:{name:'追踪',base:10,category:'investigation'},
  occult:{name:'神秘学',base:5,category:'investigation'},
  // Survival
  firstAid:{name:'急救',base:30,category:'survival'},
  stealth:{name:'潜行',base:20,category:'survival'},
  survival:{name:'生存',base:10,category:'survival'},
  climb:{name:'攀爬',base:20,category:'survival'},
  swim:{name:'游泳',base:20,category:'survival'},
  // Knowledge
  history:{name:'历史',base:5,category:'knowledge'},
  language:{name:'语言',base:1,category:'knowledge'},
  law:{name:'法律',base:5,category:'knowledge'},
  science:{name:'科学',base:1,category:'knowledge'},
};

// Calculate base HP: (CON + SIZ) / 10
export function calcHP(con, siz) { return Math.floor((con + siz) / 10); }
// Sanity: POW
export function calcSan(pow) { return pow; }
// Luck: 3d6 * 5
export function calcLuck() { return rollDice(3,6).total * 5; }
// Movement: based on STR, DEX, SIZ
export function calcMove(str, dex, siz) {
  if (str < siz && dex < siz) return 7;
  if (str >= siz || dex >= siz) return 8;
  if (str > siz && dex > siz) return 9;
  return 8;
}

// Damage bonus based on STR + SIZ
export function damageBonus(str, siz) {
  const total = str + siz;
  if (total < 65) return { dice:'-2', value: -2 };
  if (total < 85) return { dice:'+0', value: 0 };
  if (total < 125) return { dice:'+1d4', value: '1d4' };
  return { dice:'+1d6', value: '1d6' };
}

// Default COC investigator stats (分配点数制)
export const DEFAULT_ATTRS = { str:50, con:50, siz:50, dex:50, app:50, int:50, pow:50, edu:50 };
export const ATTR_POINTS = 460; // Total to distribute across 8 attributes

// Narrative effect based on success level
export function narrativeEffect(checkResult, actionType) {
  const { success, level, roll } = checkResult;
  const effects = {
    exploration: {
      extreme: { text:'你发现了隐藏的线索！', bonus:'额外获得区域信息，发现隐藏路径或物品。' },
      hard: { text:'观察力敏锐！', bonus:'你注意到了一些被忽视的细节。' },
      regular: { text:'探索顺利。', bonus:'' },
      failure: { text:'你没有发现什么特别的。', bonus:'' },
      fumble: { text:'你被环境误导了...', bonus:'可能惊动了附近的敌人或错过了重要线索。' },
    },
    combat: {
      extreme: { text:'致命一击！', bonus:`造成最大伤害（骰值 ${roll}）` },
      hard: { text:'精准的攻击！', bonus:'伤害+1d4 附加效果。' },
      regular: { text:'攻击命中。', bonus:'' },
      failure: { text:'攻击落空...', bonus:'' },
      fumble: { text:'武器脱手了！', bonus:'下一回合需要重新装备武器，失去攻击机会。' },
    },
    social: {
      extreme: { text:'言辞犀利，直击要害！', bonus:'对方完全被你说服，可能提供额外帮助。' },
      hard: { text:'沟通顺畅。', bonus:'对方态度明显好转。' },
      regular: { text:'普通的交流。', bonus:'' },
      failure: { text:'对方似乎不太感兴趣。', bonus:'' },
      fumble: { text:'说错话了...', bonus:'对方的态度恶化，可能中断对话。' },
    },
    item: {
      extreme: { text:'效果超乎预期！', bonus:'恢复量翻倍或获得额外增益。' },
      hard: { text:'效果很好。', bonus:'恢复量+25%。' },
      regular: { text:'正常使用。', bonus:'' },
      failure: { text:'使用效果不佳。', bonus:'恢复量减半。' },
      fumble: { text:'使用失败！', bonus:'物品损坏或效果反噬。' },
    },
    crafting: {
      extreme: { text:'精品杰作！', bonus:'制造出的物品品质提升一级。' },
      hard: { text:'手艺不错。', bonus:'制造出的物品获得额外属性。' },
      regular: { text:'制造完成。', bonus:'' },
      failure: { text:'制造失败。', bonus:'材料已消耗但未产出。' },
      fumble: { text:'爆炸了！', bonus:'材料全部损失，且受到 1d3 伤害。' },
    },
  };
  return effects[actionType]?.[level] || { text:'', bonus:'' };
}

// Sanity loss check
export function sanityCheck(currentSan, loss) {
  const roll = rollD100();
  if (roll <= currentSan) return { passed:true, loss:Math.min(loss, Math.floor(loss/2)), roll };
  return { passed:false, loss, roll };
}

// Validate and balance skill values
export function normalizeSkill(val) { return Math.max(1, Math.min(99, Math.round(val))); }

// Auto-calculate skill based on attributes
export function calcSkillBase(skillKey, attrs) {
  const skill = SKILLS[skillKey];
  if (typeof skill.base === 'string') {
    const [attr,div] = skill.base.split('/');
    return Math.floor((attrs[attr]||50) / parseInt(div||2));
  }
  return skill.base;
}
