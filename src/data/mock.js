// === Player Data (with stat calculation support) ===
export const playerData = {
  name: '槐诗', title: '深渊探索者 · 白银级', level: 14,
  hp: 340, maxHp: 420, mp: 85, maxMp: 120,
  exp: 2840, expToNext: 4200,
  baseStats: { atk: 48, def: 36, spd: 32, int: 44, luk: 18 },
  equipment: { weapon: null, armor: null, accessory: null },
  inventory: [],
};

// === All Items (weapons, armor, accessories, consumables, materials) ===
export const itemDatabase = {
  // Weapons
  'w1': { id:'w1', type:'weapon', slot:'weapon', name:'月影 · 打刀', icon:'Sword', rarity:'rare',
    desc:'精炼的仿古打刀，刃纹如霜。', stats:{ atk:14, spd:4 }, equipable:true },
  'w2': { id:'w2', type:'weapon', slot:'weapon', name:'朽铁的断剑', icon:'Sword', rarity:'common',
    desc:'锈迹斑斑的旧剑，勉强可用。', stats:{ atk:6 }, equipable:true },
  'w3': { id:'w3', type:'weapon', slot:'weapon', name:'怨恨之锏', icon:'Swords', rarity:'legendary',
    desc:'应芳州的遗物之一，蕴含云中君的悔恨。对亡灵系怪物伤害+50%。', stats:{ atk:24, int:6 }, equipable:true },

  // Armor
  'a1': { id:'a1', type:'armor', slot:'armor', name:'旅人之外套', icon:'Shield', rarity:'common',
    desc:'耐磨的深灰色旅行大衣，内衬软甲。', stats:{ def:8 }, equipable:true },
  'a2': { id:'a2', type:'armor', slot:'armor', name:'狩衣 · 残片', icon:'Shield', rarity:'rare',
    desc:'旧神社中发现的破损狩衣，仍残留微弱结界。', stats:{ def:14, int:3 }, equipable:true },
  'a3': { id:'a3', type:'armor', slot:'armor', name:'天文会制式外套', icon:'Shield', rarity:'uncommon',
    desc:'象牙之塔配发的标准外套，带有基础防护刻印。', stats:{ def:11, mp:15 }, equipable:true },

  // Accessories
  'c1': { id:'c1', type:'accessory', slot:'accessory', name:'碎裂的勾玉', icon:'Gem', rarity:'rare',
    desc:'来历不明的古旧勾玉，隐约散发微光。', stats:{ mp:20, int:5 }, equipable:true },
  'c2': { id:'c2', type:'accessory', slot:'accessory', name:'蝇王的残页', icon:'BookOpen', rarity:'legendary',
    desc:'《蝇王》钢铁之书的残页。别西卜曾寄宿于此。战斗开始时自动扫描敌人弱点。', stats:{ int:10, luk:8 }, equipable:true },
  'c3': { id:'c3', type:'accessory', slot:'accessory', name:'赤瞳之石', icon:'Diamond', rarity:'legendary',
    desc:'内部流淌着红色光晕的奇异宝石。据说是深渊领主·太一的遗物。HP低于30%时攻击力翻倍。', stats:{ atk:8, def:4 }, equipable:true },

  // Consumables
  'p1': { id:'p1', type:'consumable', name:'回复药 · 小', icon:'FlaskRound', rarity:'common',
    desc:'恢复 80 HP。淡红色的清凉液体。', effect:{ hp:80 }, usable:true },
  'p2': { id:'p2', type:'consumable', name:'回复药 · 中', icon:'FlaskRound', rarity:'uncommon',
    desc:'恢复 200 HP。深红色的浓稠药剂。', effect:{ hp:200 }, usable:true },
  'p3': { id:'p3', type:'consumable', name:'灵水', icon:'Droplets', rarity:'common',
    desc:'恢复 50 MP。收集自深渊裂隙的清澈水珠。', effect:{ mp:50 }, usable:true },
  'p4': { id:'p4', type:'consumable', name:'熏烤兽肉', icon:'UtensilsCrossed', rarity:'common',
    desc:'火堆上烤制的野兽肉干，恢复少量 HP。', effect:{ hp:40 }, usable:true },
  'p5': { id:'p5', type:'consumable', name:'妖狐之血', icon:'Flame', rarity:'rare',
    desc:'暗影妖狐的血液，饮用后短时间内提升攻击力。', effect:{ atk_boost:10, duration:3 }, usable:true },

  // Materials / Quest items
  'm1': { id:'m1', type:'material', name:'断裂的青铜钥匙', icon:'Key', rarity:'uncommon',
    desc:'在旧神社废墟中找到的半截钥匙。可以与NPC雾之老人交换情报。' },
  'm2': { id:'m2', type:'material', name:'妖狐之尾', icon:'Flame', rarity:'rare',
    desc:'暗影妖狐的尾巴，是贵重的炼金素材。' },
  'm3': { id:'m3', type:'material', name:'迷雾之核', icon:'CloudFog', rarity:'rare',
    desc:'雾之影消散后残留的核心。触感冰凉，似乎能吸收周围的雾气。' },
  'm4': { id:'m4', type:'material', name:'火之精魄', icon:'Gem', rarity:'uncommon',
    desc:'火属性妖兽体内凝结的精华。可用于锻造或炼金。' },
};

// === Starting inventory (item ID → qty) ===
export const startingInventory = {
  'w1':1, 'w2':1, 'a1':1, 'a3':1, 'c1':1, 'c3':1,
  'p1':3, 'p2':1, 'p3':1, 'p4':2, 'p5':1,
  'm1':1, 'm2':1,
};

// === Map Nodes ===
export const mapNodes = [
  { id:'crossroads', x:50, y:60, name:'雾之 crossroads', type:'hub', status:'current',
    desc:'迷雾笼罩的三岔路口。一条蜿蜒向上通往旧神社，另一条深入幽暗的森林。远处隐约可见一座废弃矿坑的入口。\n\n一位老人坐在路边的石碑旁，似乎已经等待了很久。',
    connections:['shrine','forest','mine'], npcHere:'oldman' },
  { id:'shrine', x:30, y:30, name:'荒废神社', type:'dungeon', status:'explored',
    desc:'石阶尽头的旧神社，鸟居已经倾斜。神社深处残留着古老的结界。你在祭坛下找到了半截青铜钥匙。\n\n一位巫女打扮的女子正站在拜殿前，凝视着褪色的绘马。',
    connections:['crossroads','waterfall'], npcHere:'miko' },
  { id:'forest', x:70, y:45, name:'幽暗密林', type:'wild', status:'explored',
    desc:'高大的古木遮蔽了天空，林间小径遍布苔藓。偶尔能听到暗影妖狐的嚎叫从深处传来。',
    connections:['crossroads','cave'] },
  { id:'mine', x:80, y:75, name:'废弃矿坑入口', type:'dungeon', status:'unexplored',
    desc:'被铁栅栏半掩的矿坑入口，木制支架已经腐朽。「立入禁止」的警示牌歪斜在一旁。黑暗中有不祥的气息——据说这里是「黄金黎明」的废弃实验室。',
    connections:['crossroads'] },
  { id:'waterfall', x:15, y:20, name:'静寂瀑布', type:'wild', status:'unexplored',
    desc:'白练般的水流从断崖垂落，水声在幽谷中回荡。瀑布后方似乎别有洞天。传说有「水之精灵」出没。',
    connections:['shrine'] },
  { id:'cave', x:85, y:30, name:'妖兽巢穴', type:'danger', status:'unexplored',
    desc:'岩壁上的天然洞穴，入口处散落着被啃食过的兽骨。洞内传来低沉的鼾声——显然有什么东西在里面。',
    connections:['forest'] },
];

// === NPCs ===
export const npcs = {
  oldman: {
    id:'oldman', name:'雾之老人', icon:'User', location:'crossroads',
    desc:'一位坐在石碑旁的枯瘦老人，斗笠遮住了大半张脸。他似乎对这片迷雾了如指掌。',
    dialogs: {
      greeting: '哦，又是一位误入此地的旅人吗？不必惊慌，这片雾不会伤害心存敬畏之人。',
      topics: {
        '关于此地': '这里是「深渊边境」——现境与地狱之间的缓冲地带。天文会称这里为「边境」，而我们这些老家伙习惯叫它「黄昏之乡」。',
        '关于神社': '那座神社啊……供奉的是一位早已被遗忘的神灵。据说祂的最后一滴泪化作了瀑布，至今仍在山谷中回响。',
        '关于钥匙': '你手中的青铜钥匙……让我看看。果然，这是「月隐之祠」的钥匙。拿着它去瀑布后面的洞穴吧。',
        '关于天文会': '天文会？那群穿白衣服的家伙最近来过一次。领头的是个坐轮椅的姑娘，眼睛很厉害。',
        '关于黄金黎明': '（老人面色一沉）不要提那个名字。在这片土地上，有些名字本身就带有诅咒。',
      }
    },
    trades: [
      { give:'m1', receive:'w3', dialog:'这把锏……是一个叫应芳州的人留下的。他让我转交给有缘人。你的钥匙，我收下了。' }
    ],
    quest: { id:'quest_oldman', name:'老人的嘱托', status:'active',
      desc:'雾之老人请你去瀑布后方的「月隐之祠」调查异常。', reward:'蝇王的残页' }
  },
  miko: {
    id:'miko', name:'巫女 · 白', icon:'Heart', location:'shrine',
    desc:'神社唯一的巫女，白色的和服在雾中格外醒目。她负责维护神社最后的结界。',
    dialogs: {
      greeting: '欢迎来到「水无月神社」。我是这里的巫女，叫我「白」就好。你是……槐诗先生？天文会那边提到过你。',
      topics: {
        '关于神社': '水无月神社供奉的是「月读命」。但在天国陨落之后，神明已经很久没有回应过祈祷了。我是最后一代巫女。',
        '关于结界': '结界的力量来自神社后山的灵脉。最近灵脉被污染了——矿坑的方向有某种邪恶的力量在侵蚀这片土地。',
        '关于自己': '我？没什么特别的。只是守着这座空壳一样的神社而已。不过你能来到这里，我很高兴。这里很久没有访客了。',
        '关于力量': '（她犹豫了一下）你身上有一种……奇怪的气息。不是普通人，也不是纯粹的升华者。你经历过什么吧？',
      }
    },
    trades: [
      { give:'m3', receive:'p2', dialog:'迷雾之核……确实是我们急需的素材。这瓶回复药请你收下。', repeatable:true },
    ],
    quest: { id:'quest_miko', name:'净化灵脉', status:'pending',
      desc:'巫女白请求你前往废弃矿坑调查灵脉污染的源头。那里可能有黄金黎明的残余。', reward:'a2' }
  },
};

// === Monsters ===
export const monsters = [
  { id:1, name:'暗影妖狐', icon:'Flame', hp:180, maxHp:180, atk:35, def:20, spd:45,
    tags:['妖兽','火属性'], desc:'毛皮漆黑的妖狐，尾巴上燃烧着幽蓝色的妖火。行动敏捷，擅长火焰吐息。',
    loot:[{item:'m2',chance:'30%'},{item:'p5',chance:'15%'},{item:'m4',chance:'15%'}] },
  { id:2, name:'腐朽的武士灵', icon:'Skull', hp:250, maxHp:250, atk:50, def:35, spd:15,
    tags:['亡灵','暗属性'], desc:'身着破损铠甲的怨灵武士。空洞的眼眶中飘浮着苍白的魂火。',
    loot:[{item:'w2',chance:'20%'}] },
  { id:3, name:'毒瘴巨蜂', icon:'Bug', hp:120, maxHp:120, atk:25, def:15, spd:55,
    tags:['虫','毒属性'], desc:'被深渊瘴气污染的巨大毒蜂。速度极快，攻击带中毒效果。',
    loot:[{item:'p3',chance:'40%'}] },
  { id:4, name:'雾之影', icon:'CloudFog', hp:200, maxHp:200, atk:40, def:25, spd:30,
    tags:['幽灵','无属性'], desc:'从浓雾中诞生的不明实体，没有固定形态。',
    loot:[{item:'m3',chance:'20%'}] },
  { id:5, name:'归净之民·残渣', icon:'Skull', hp:400, maxHp:400, atk:55, def:30, spd:20,
    tags:['深渊','暗属性','BOSS'], desc:'黄金黎明实验的失败产物——由凝固的深渊源质构成的扭曲人形。曾经是人类。',
    loot:[{item:'c2',chance:'5%'},{item:'a2',chance:'15%'}] },
];

// === Skills ===
export const playerSkills = [
  { id:1, name:'居合斩', icon:'Sword', cost:15, power:1.8, desc:'拔刀术起手式，瞬间出鞘造成高额伤害。' },
  { id:2, name:'冰刃·一文字', icon:'Snowflake', cost:25, power:2.4, desc:'冰属性斩击，有概率使敌人减速。' },
  { id:3, name:'深呼吸', icon:'Wind', cost:0, heal:0.25, desc:'调整呼吸，恢复最大HP的25%。每场战斗限用一次。' },
];

// === Story Log (天启预报 inspired) ===
export const sampleStoryLog = [
  { role:'narrator', content:'浓雾如纱帐般笼罩着前方的岔路。你站在这片被称为「深渊边境」的土地上——这里是现境与地狱之间的缓冲地带，天地间弥漫着某种不安的寂静。\n\n你注意到路边坐着一位枯瘦的老人，斗笠遮住了他大半张脸。他抬了抬手，似乎早已预料到你的到来。\n\n「又是一位误入此地的旅人吗？」老人的声音干涩但温和。\n\n远处，一座旧神社的鸟居顶端在雾中若隐若现。另一侧是幽暗密林的入口。而在更远的地方，隐约可以看见一座被铁栅栏半掩的矿坑。' },
  { role:'player', content:'向老人打听此地的情报。' },
  { role:'narrator', content:'老人微微抬起斗笠，露出一只浑浊但锐利的眼睛。\n\n「这里是「深渊边境」——现境的尽头，地狱的起点。天文会的人叫它「边境」，而住在这附近的居民……习惯叫它「黄昏之乡」。」\n\n他用枯瘦的手指指向远处的神社：「如果你需要一个休息的地方，去找水无月神社的巫女吧。她叫白，是这片土地上最后一个侍奉月读命的人。」\n\n老人顿了顿，目光落在你腰间：「你身上带着……青铜钥匙对吧？那是月隐之祠的钥匙。保管好它。」' },
];

// === Quests ===
export const quests = [
  { id:'quest_oldman', name:'老人的嘱托', status:'active', desc:'前往瀑布后方的月隐之祠调查异常。', progress:'需先到达静寂瀑布' },
  { id:'quest_miko', name:'净化灵脉', status:'pending', desc:'巫女白请求你调查矿坑中黄金黎明的残余。', progress:'未开始' },
  { id:3, name:'妖狐讨伐', status:'pending', desc:'幽暗密林中的暗影妖狐威胁着行人安全。', progress:'未开始' },
];

// === Scene stories (for map exploration) ===
export const sceneStories = {
  crossroads: '浓雾在脚踝的高度缓缓翻涌。三岔路口的石碑上刻着模糊的旧文字——「左往水无月社，右入幽暗密林，直行废弃矿道」。\n\n石碑旁的老人似乎对每个路过的人都有一套自己的说法。这一次，他的目光在你身上停留得格外久。',
  shrine: '石阶在脚下发出沉实的回响。参道两侧的地藏像已被风化得面目模糊，红色的前挂早已褪成了灰白。\n\n一位白衣巫女站在拜殿前，听到脚步声后缓缓回过头来。她的面容平静，但眼神深处藏着什么——像是一潭幽深的湖水。',
  forest: '古木撑起的穹顶下，光线变得稀疏而模糊。苔藓覆盖的小径柔软得像是踩在云上。\n\n某处传来野兽的低吼。不是暗影妖狐——那个声音更低沉，更遥远。像是来自地底。',
  mine: '铁栅栏上的锁链已经断裂，半挂在锈蚀的铰链上。「立入禁止」的警示牌上被人用红色油漆涂了一行新字——「不要进去」。\n\n但你仍然能感到从矿坑深处涌出的不祥气息。空气中混杂着铁锈和腐败的甜味。',
  waterfall: '瀑布的声音在靠近之后变得震耳欲聋。白练般的水帘从数十米高的断崖垂落，激起的水雾在空气中折射出微弱的彩虹。\n\n在瀑布后方，隐约可以看见一个狭窄的洞穴入口。那应该就是老人所说的「月隐之祠」。',
  cave: '洞穴入口散落着被啃食过的兽骨和已经干涸的暗色血迹。洞壁上用锐器刻出了粗糙的记号——某个在此安家的生物留下了它的警告。\n\n低沉的呼吸声从洞内深处传来。节奏缓慢，有力——是一个大家伙。',
};
