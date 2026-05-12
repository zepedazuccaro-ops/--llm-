// === Mock Player Data ===
export const playerData = {
  name: '雾岛 涟',
  title: '深渊探索者 · 叁级',
  level: 14,
  hp: 340, maxHp: 420,
  mp: 85, maxMp: 120,
  exp: 2840, expToNext: 4200,
  stats: { atk: 62, def: 45, spd: 38, int: 56, luk: 22 },
  equipment: [
    { slot: 'weapon', name: '月影 · 打刀', icon: 'Sword', rarity: 'rare', desc: '精炼的仿古打刀，刃纹如霜。攻击时附带微量冰属性。' },
    { slot: 'armor', name: '旅人之外套', icon: 'Shield', rarity: 'common', desc: '耐磨的深灰色旅行大衣，内衬软甲。' },
    { slot: 'accessory', name: '碎裂的勾玉', icon: 'Gem', rarity: 'rare', desc: '来历不明的古旧勾玉，隐约散发微光。MP 自然恢复 +2。' },
  ],
  inventory: [
    { id: 1, name: '回复药 · 小', icon: 'FlaskRound', qty: 3, desc: '恢复 80 HP。淡红色的清凉液体。', rarity: 'common' },
    { id: 2, name: '灵水', icon: 'Droplets', qty: 1, desc: '恢复 50 MP。收集自深渊裂隙的清澈水珠。', rarity: 'common' },
    { id: 3, name: '熏烤兽肉', icon: 'UtensilsCrossed', qty: 2, desc: '火堆上烤制的野兽肉干，可恢复少量 HP。', rarity: 'common' },
    { id: 4, name: '断裂的青铜钥匙', icon: 'Key', qty: 1, desc: '在旧神社废墟中找到的半截钥匙，似乎可以打开某扇门。', rarity: 'uncommon' },
    { id: 5, name: '破旧的地图片段', icon: 'Map', qty: 1, desc: '标注了某个隐藏洞穴入口的羊皮纸。', rarity: 'uncommon' },
    { id: 6, name: '赤瞳之石', icon: 'Diamond', qty: 1, desc: '内部流淌着红色光晕的奇异宝石。据说与深渊领主有关。', rarity: 'legendary' },
  ],
};

// === Map Nodes ===
export const mapNodes = [
  { id: 'crossroads', x: 50, y: 60, name: '雾之 crossroads', type: 'hub', status: 'current',
    desc: '迷雾笼罩的三岔路口。一条蜿蜒向上通往旧神社，另一条深入幽暗的森林。远处隐约可见一座废弃矿坑的入口。',
    connections: ['shrine', 'forest', 'mine'] },
  { id: 'shrine', x: 30, y: 30, name: '荒废神社', type: 'dungeon', status: 'explored',
    desc: '石阶尽头的旧神社，鸟居已经倾斜。神社深处似乎还残留着某种古老的结界。你在祭坛下找到了半截青铜钥匙。',
    connections: ['crossroads', 'waterfall'] },
  { id: 'forest', x: 70, y: 45, name: '幽暗密林', type: 'wild', status: 'explored',
    desc: '高大的古木遮蔽了天空，林间小径遍布苔藓。偶尔能听到不知名生物的嚎叫从深处传来。',
    connections: ['crossroads', 'cave'] },
  { id: 'mine', x: 80, y: 75, name: '废弃矿坑入口', type: 'dungeon', status: 'unexplored',
    desc: '被铁栅栏半掩的矿坑入口，木制支架已经腐朽，「立入禁止」的警示牌歪斜在一旁。黑暗中有不祥的气息。',
    connections: ['crossroads'] },
  { id: 'waterfall', x: 15, y: 20, name: '静寂瀑布', type: 'wild', status: 'unexplored',
    desc: '白练般的水流从断崖垂落，水声在幽谷中回荡。瀑布后方似乎别有洞天。传说有「水之精灵」出没。',
    connections: ['shrine'] },
  { id: 'cave', x: 85, y: 30, name: '妖兽巢穴', type: 'danger', status: 'unexplored',
    desc: '岩壁上的天然洞穴，入口处散落着被啃食过的兽骨。洞内传来低沉的鼾声——显然有什么东西在里面。',
    connections: ['forest'] },
];

// === Monster Templates ===
export const monsters = [
  { id: 1, name: '暗影妖狐', icon: 'Flame', hp: 180, maxHp: 180, atk: 35, def: 20, spd: 45,
    tags: ['妖兽', '火属性'], desc: '毛皮漆黑的妖狐，尾巴上燃烧着幽蓝色的妖火。行动敏捷，擅长火焰吐息。', loot: [{ name: '妖狐之尾', chance: '30%' }, { name: '火之精魄', chance: '15%' }] },
  { id: 2, name: '腐朽的武士灵', icon: 'Skull', hp: 250, maxHp: 250, atk: 50, def: 35, spd: 15,
    tags: ['亡灵', '暗属性'], desc: '身着破损铠甲的怨灵武士，空洞的眼眶中飘浮着苍白的魂火。攻击沉重但行动迟缓。', loot: [{ name: '碎裂的铠片', chance: '50%' }, { name: '灵刀碎片', chance: '20%' }] },
  { id: 3, name: '毒瘴巨蜂', icon: 'Bug', hp: 120, maxHp: 120, atk: 25, def: 15, spd: 55,
    tags: ['虫', '毒属性'], desc: '被深渊瘴气污染的巨大毒蜂，翅膀扇动时会散播麻痹磷粉。速度极快，攻击带中毒效果。', loot: [{ name: '蜂毒腺', chance: '40%' }, { name: '薄翼素材', chance: '35%' }] },
  { id: 4, name: '雾之影', icon: 'CloudFog', hp: 200, maxHp: 200, atk: 40, def: 25, spd: 30,
    tags: ['幽灵', '无属性'], desc: '从浓雾中诞生的不明实体，没有固定形态。你的攻击有时会穿透它的身体，造成无效伤害。', loot: [{ name: '迷雾之核', chance: '20%' }] },
];

// === Combat Skills ===
export const playerSkills = [
  { id: 1, name: '居合斩', icon: 'Sword', cost: 15, type: 'atk', power: 1.8, desc: '拔刀术的起手式，瞬间出鞘造成高额伤害。' },
  { id: 2, name: '冰刃·一文字', icon: 'Snowflake', cost: 25, type: 'atk', power: 2.4, desc: '以打刀释放冰属性斩击，有概率使敌人减速。' },
  { id: 3, name: '深呼吸', icon: 'Wind', cost: 0, type: 'heal', power: 0.25, desc: '调整呼吸，恢复最大 HP 的 25%。每场战斗限用一次。' },
];

// === Story Log ===
export const sampleStoryLog = [
  { role: 'narrator', content: '浓雾如纱帐般笼罩着前方的岔路。你站在这片被称为「深渊边境」的土地上，空气冷冽而潮湿。三道隐约可见的小径分别通往不同的方向——一条蜿蜒向上，石阶已被青苔覆盖；一条直直插入密林深处；还有一条通向远处隐约可见的矿坑入口。\n\n你身后，是返回据点的路。但在前方，似乎有什么在雾中等待着你。' },
  { role: 'player', content: '向旧神社的方向走去。' },
  { role: 'narrator', content: '你踏上了通往旧神社的石阶。每一步都伴随着脚下碎石滑落的声音。参道两侧的地藏像已经风化得面目模糊，脖子上还系着早已褪色的红布。鸟居的横梁在风中微微摇晃，发出嘎吱的声响。\n\n神社拜殿的木门虚掩着，门缝中透出一丝不自然的蓝色光芒。你隐约感到一股微弱但纯净的结界之力——这里曾是某位神灵的居所，或者说，现在依然是。' },
];

// === Quests ===
export const quests = [
  { id: 1, name: '雾中歧路', status: 'active', desc: '探索雾之 crossroads 周边的三条路径，找到传说中的「月隐之祠」。', progress: '1/3 路径已探索' },
  { id: 2, name: '妖狐讨伐', status: 'pending', desc: '幽暗密林中出现了暗影妖狐，村民们不敢入林采药。前往讨伐妖狐。', progress: '未开始' },
];
