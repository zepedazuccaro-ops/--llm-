// === 深渊边境世界书 (World Book / Lore Book) ===
// 关键词触发式世界设定，AI 和玩家共用参考

export const worldBook = {
  name: '深渊边境 · 月隐之章',
  version: '1.0',
  description: '一片被永恒迷雾笼罩的边境之地——现境与地狱之间的缓冲地带。旧时代的神灵已经陨落，天文会的残部仍在坚守，而黄金黎明的阴影正在深渊中蔓延。',

  // 世界观条目 (按触发关键词匹配)
  entries: [
    {
      id: 'wb_world',
      keys: ['深渊边境','边境','这个世界','这里','这地方'],
      title: '深渊边境',
      content: '深渊边境是现境与地狱之间的缓冲地带。天地间弥漫着永恒不散的雾气，这些雾并非自然形成——它们是上一次「灭世计划」的残留。现境由天文会守卫，深渊中潜伏着黄金黎明的前理想国成员。',
      category: 'world',
    },
    {
      id: 'wb_mist',
      keys: ['雾','浓雾','迷雾','雾气'],
      title: '边境之雾',
      content: '边境的雾气是旧地球在第十四次灭世计划中毁灭时释放的残余能量。雾气本身无害，但在夜晚会增强深渊生物的活性。月光穿过雾气时会形成惨白的光斑——这被称为「月读命的泪痕」。',
      category: 'world',
    },
    {
      id: 'wb_astronomy',
      keys: ['天文会','统辖局','理想国','存续院','象牙之塔'],
      title: '国际天文会',
      content: '国际天文会由统辖局(行政)、存续院(存在)和已覆灭的理想国(宇宙)三大分支组成。理想国覆灭后，残部由罗素领导，居于象牙之塔。天文会负责守护现境、管理升华者和监控毁灭要素。',
      category: 'faction',
    },
    {
      id: 'wb_goldendawn',
      keys: ['黄金黎明','玛瑟斯','归净之民','二五仔','深渊组织'],
      title: '黄金黎明',
      content: '前理想国成员在理想国分裂后集体凝固堕入深渊，形成了毁灭要素「黄金黎明」。由创造主玛瑟斯领导，以无何有之乡为总部。他们追求以深渊法则重塑世界，进行禁忌的「归净实验」。',
      category: 'faction',
    },
    {
      id: 'wb_shrine',
      keys: ['水无月神社','神社','月读命','巫女白','巫女·白','白巫女'],
      title: '水无月神社',
      content: '供奉月读命的古老神社，位于十字路口东北方的山丘上。鸟居已经倾斜，拜殿木门虚掩。巫女白是最后一代侍奉者。神社后山的灵脉最近被矿坑方向的邪恶力量污染。',
      category: 'location',
    },
    {
      id: 'wb_crossroads',
      keys: ['十字路口','三岔路口','crossroads','雾之crossroads'],
      title: '雾之十字路口',
      content: '深渊边境的中心枢纽。一座刻着模糊旧文字的石碑立于岔路中央——「左往水无月社，右入幽暗密林，直行废弃矿道」。雾之老人常年在此等待路过的旅人。',
      category: 'location',
    },
    {
      id: 'wb_mine',
      keys: ['矿坑','废弃矿坑','矿道','实验室','黄金黎明实验室'],
      title: '废弃矿坑',
      content: '一座被铁栅栏半掩的废弃矿坑。木制支架已腐朽，「立入禁止」的警示牌歪斜一旁。矿坑深处是黄金黎明曾经的实验室，进行着禁忌的「归净实验」——将人类转化为深渊生物。空气中混杂着铁锈和腐败的甜味。',
      category: 'location',
    },
    {
      id: 'wb_waterfall',
      keys: ['瀑布','静寂瀑布','月隐之祠','水帘'],
      title: '静寂瀑布与月隐之祠',
      content: '数十米高的断崖瀑布，水帘后方隐藏着月隐之祠的入口。传说月读命的最后一滴眼泪化作了这道瀑布。洞内供奉着一轮石制明月，中心悬浮着月读命最后一缕神性——一滴永远不干的眼泪。',
      category: 'location',
    },
    {
      id: 'wb_forest',
      keys: ['密林','幽暗密林','森林','树林'],
      title: '幽暗密林',
      content: '古木参天的原始森林，树冠遮蔽了大部分阳光。林中栖息着暗影妖狐等妖兽。村民不敢深入林中采药。森林深处通向妖兽巢穴。',
      category: 'location',
    },
    {
      id: 'wb_oldman',
      keys: ['雾之老人','老人','老者','斗笠老人'],
      title: '雾之老人',
      content: '常年在十字路口石碑旁枯坐的枯瘦老人。斗笠遮住大半张脸，一只眼睛浑浊但锐利。他对这片土地了如指掌，似乎与天文会有过往来。他知道青铜钥匙的秘密和月隐之祠的位置。',
      category: 'character',
    },
    {
      id: 'wb_miko',
      keys: ['白','巫女','白巫女','红叶姬'],
      title: '巫女·白',
      content: '水无月神社最后一代巫女。白色和服在雾中格外醒目，眼神深处藏着幽深的湖水。她独自守护着月读命最后的结界。随着灵脉被污染，她的力量正在逐渐衰退。',
      category: 'character',
    },
    {
      id: 'wb_huishi',
      keys: ['槐诗','主角','我','自己'],
      title: '槐诗',
      content: '主角。天国谱系·天问之路的升华者。持有命运之书和蝇王(别西卜)，是一名灾厄乐师和厨魔。来自象牙之塔，受天文会委托调查深渊边境的异常。',
      category: 'character',
    },
    {
      id: 'wb_monsters',
      keys: ['妖兽','怪物','暗影妖狐','武士灵','毒瘴巨蜂','雾之影','归净之兽'],
      title: '边境妖兽',
      content: '深渊边境出没的妖兽包括：暗影妖狐(火属性，敏捷型)、腐朽武士灵(亡灵，暗属性，高攻低速)、毒瘴巨蜂(虫，毒属性，高速)、雾之影(幽灵，无固定形态)、归净之兽(黄金黎明改造产物，BOSS级)。夜晚妖兽活性显著增强。',
      category: 'bestiary',
    },
    {
      id: 'wb_items',
      keys: ['青铜钥匙','勾玉','怨恨之锏','赤瞳之石','蝇王的残页','回复药','灵水'],
      title: '重要物品',
      content: '青铜钥匙: 月隐之祠的钥匙，在神社废墟中找到。碎裂的勾玉: 古旧饰品，MP自然恢复+2。怨恨之锏: 应芳州遗物，对亡灵伤害+50%。赤瞳之石: 与深渊领主太一有关，HP<30%时ATK翻倍。蝇王的残页: 别西卜曾寄宿的钢铁之书残页。',
      category: 'item',
    },
    {
      id: 'wb_combat_rules',
      keys: ['战斗','攻击','技能','HP','伤害','防御'],
      title: '战斗规则',
      content: '采用COC 1d100机制。攻击命中判定: 掷d100 ≤ 格斗技能值则命中。极难成功(≤技能/5): 伤害最大化，附加效果。困难成功(≤技能/2): 伤害+1d4。大失败(≥96): 武器脱手，下回合无法攻击。HP归零则战斗失败。撤退需要敏捷检定。',
      category: 'rules',
    },
  ],

  // 主线剧情大纲
  mainPlot: {
    act1: { name:'雾中觉醒', summary:'主角在深渊边境醒来，遇到雾之老人和巫女白，了解世界的真相。', keyEvents:['在十字路口醒来','与雾之老人交谈','到达水无月神社','获得青铜钥匙'] },
    act2: { name:'分岐之路', summary:'三条道路分别通向不同的结局。矿坑中的黄金黎明实验室、瀑布后的月隐之祠、密林深处的妖兽巢穴。', keyEvents:['选择分支路线','调查选定区域','击败区域BOSS','获得关键物品'] },
    act3: { name:'终末抉择', summary:'在三条路线的终点做出最终选择，决定故事的结局。', keyEvents:['面对最终选择','完成结局','解锁额外内容'] },
  },
};

// 根据关键词匹配世界书条目
export function queryWorldBook(input, limit = 5) {
  const matched = [];
  const lower = input.toLowerCase();
  for (const entry of worldBook.entries) {
    let score = 0;
    for (const key of entry.keys) {
      if (lower.includes(key.toLowerCase())) {
        score += key.length; // Longer key match = higher score
      }
    }
    if (score > 0) matched.push({ entry, score });
  }
  matched.sort((a, b) => b.score - a.score);
  return matched.slice(0, limit).map(m => m.entry);
}

// 构建世界书上下文（注入 AI prompt）
export function buildWorldBookContext(userInput, location, npcName, gameTime) {
  const entries = queryWorldBook(userInput, 5);
  if (entries.length === 0) return '';

  let context = '【世界书 · 相关设定】\n';
  entries.forEach(e => {
    context += `[${e.title}] ${e.content}\n`;
  });

  // Add location info
  const locEntry = worldBook.entries.find(e => e.id === `wb_${location}`);
  if (locEntry && !entries.includes(locEntry)) {
    context += `\n[当前位置] ${locEntry.content}\n`;
  }

  // Add time context
  context += `\n[当前时间] 第${gameTime?.day||1}天 ${gameTime?.period||'清晨'}\n`;

  return context;
}
