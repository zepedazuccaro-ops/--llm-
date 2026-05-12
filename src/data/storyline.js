// === Main Storyline + Branching Endings ===
// 基于时间推进的线性主线 + 3条分支剧情线

export const mainStory = {
  title: '深渊边境 · 月隐之章',
  description: '你在迷雾笼罩的深渊边境醒来。一位老人说，月隐之祠中沉睡着一位被遗忘的神灵。而黄金黎明的阴影正在逼近。',
  chapters: [
    {
      id:'ch1', name:'第一章：雾中觉醒', trigger:{gameDay:1},
      description:'在迷雾中醒来，了解自己的处境。探索十字路口，与雾之老人交谈。',
      objectives:['与雾之老人交谈','探索十字路口周边'],
      completionFlag:'met_oldman',
      reward:{exp:50},
    },
    {
      id:'ch2', name:'第二章：神社的秘密', trigger:{gameDay:1, flag:'met_oldman'},
      description:'前往水无月神社寻找巫女白。调查神社结界的异常。',
      objectives:['到达水无月神社','与巫女白交谈'],
      completionFlag:'met_miko',
      reward:{exp:100, item:'a2'},
    },
    {
      id:'ch3', name:'第三章：分岐之路', trigger:{gameDay:2},
      description:'神社的线索指向三个方向：瀑布后的月隐之祠、矿坑中的黄金黎明遗迹、以及密林深处的妖兽巢穴。选择你的道路。',
      objectives:['选择一条主线分支','探索选定的区域'],
      completionFlag:null, // Resolved by branch
      reward:{exp:150},
    },
  ],
};

// === Three Branching Storylines (BE / HE / TE) ===
export const branches = {
  // Branch A: 黄金黎明线 → Bad End (BE)
  goldendawn: {
    id:'goldendawn', name:'黄金黎明之影', type:'BE',
    label:'[BE] 黄金黎明之影 — 黑暗中的真相',
    triggerNode:'mine', triggerDay:2,
    description:'深入矿坑调查黄金黎明的残余。发现他们正在进行禁忌的「归净实验」——试图将人类转化为深渊生物。\n\n在最终的实验室中，你被迫做出选择：接受黄金黎明的力量，还是玉石俱焚。',
    chapters: [
      { id:'ga1', name:'矿坑潜入', desc:'躲避巡逻的归净之民，深入矿坑底部。', flag:'entered_mine_deep' },
      { id:'ga2', name:'实验室', desc:'发现了「归净实验」的真相：被囚禁的村民正在被转化为深渊生物。', flag:'found_lab' },
      { id:'ga3', name:'最终选择', desc:'玛瑟斯的投影出现，给你两个选择。', flag:'faced_mathers' },
    ],
    endings: [
      { id:'be1', name:'堕入深渊', desc:'你接受了黄金黎明的力量。身体被深渊源质彻底改造，你成为了新的归净之民。\n\n「欢迎来到黄金黎明，槐诗先生。」玛瑟斯的微笑是你最后的记忆。\n\n—— BAD END「堕入深渊」——', flag:'chose_goldendawn' },
      { id:'be2', name:'最后的火焰', desc:'你拒绝了。在引爆实验室的最后一刻，你用炼金之火摧毁了归净装置。所有被囚禁的灵魂得到了解放——但你也随之化为灰烬。\n\n雾之老人站在矿坑入口，看着从深处涌出的火光，摘下了斗笠。\n\n—— BAD END「最后的火焰」——', flag:'rejected_goldendawn' },
    ],
  },
  // Branch B: 月隐之祠线 → Happy End (HE)
  moonlight: {
    id:'moonlight', name:'月隐之祠', type:'HE',
    label:'[HE] 月隐之祠 — 月读命的最后之泪',
    triggerNode:'waterfall', triggerDay:2,
    description:'在瀑布后方找到了传说中的月隐之祠。那里沉睡着月读命的最后一缕神性——一滴永远不干的眼泪。\n\n巫女白说，如果将这滴眼泪带回神社，灵脉将被净化，整片深渊边境将恢复往日的安宁。',
    chapters: [
      { id:'ml1', name:'穿过瀑布', desc:'在瀑布后方找到狭窄的洞穴入口。', flag:'entered_waterfall_cave' },
      { id:'ml2', name:'月隐之祠', desc:'洞穴深处的古老神社，供奉着一轮石制的明月。', flag:'found_moon_shrine' },
      { id:'ml3', name:'神灵的眼泪', desc:'石制明月的中心，悬浮着一滴发光的液体——那是月读命的最后之泪。', flag:'obtained_tear' },
    ],
    endings: [
      { id:'he1', name:'月读命的祝福', desc:'你将眼泪带回了水无月神社。巫女白将其放回祭坛——瞬间，整个深渊边境的雾气开始消散。阳光穿过云层，这是几十年来第一次有真正的阳光照在这片土地上。\n\n「谢谢你，槐诗。」白微笑着，眼神不再空洞。\n\n—— HAPPY END「月读命的祝福」——', flag:'returned_tear' },
    ],
  },
  // Branch C: 妖兽巢穴线 → True End (TE)
  beastcave: {
    id:'beastcave', name:'深渊之王的觉醒', type:'TE',
    label:'[TE] 深渊之王 — 太一的觉醒',
    triggerNode:'cave', triggerDay:3,
    description:'妖兽巢穴中潜伏的并不只是普通的怪物——而是一只被黄金黎明改造过的「归净之兽」。在它的体内，你发现了赤瞳之石的共鸣。\n\n这块石头与深渊领主「太一」有关。当你触碰它时，一个古老的声音在你脑中响起：\n\n「你……是新的太一吗？」',
    chapters: [
      { id:'tc1', name:'妖兽讨伐', desc:'击败归净之兽，获得赤瞳之石。', flag:'defeated_beast_boss' },
      { id:'tc2', name:'太一的呼唤', desc:'赤瞳之石与你产生共鸣。你看到了太古的记忆——前任太一的末日。', flag:'activated_stone' },
      { id:'tc3', name:'最终的抉择', desc:'乌鸦（彤姬）的声音在你耳边响起：「你可以成为新的太一——或者拒绝。这是你的选择。」', flag:'final_choice' },
    ],
    endings: [
      { id:'te1', name:'新世界的守墓人', desc:'你接受了太一的力量。45万年的守墓时光在你眼前一闪而过——你见证了无数文明的兴起与衰落。当最后一个人类离开地球时，你依然站在深渊的边缘。\n\n「这就是太一的使命。」鸦羽飘落在你的肩头。\n\n—— TRUE END「守墓人」——', flag:'became_taiyi' },
      { id:'he2', name:'平凡之路', desc:'你拒绝了。赤瞳之石在你手中碎成了粉末。深渊的呼唤渐渐远去，你选择了做回一个普通的冒险者。\n\n雾之老人拍了拍你的肩：「有时候，拒绝力量比获得力量更需要勇气。」\n\n—— HAPPY END「平凡之路」——', flag:'refused_taiyi' },
    ],
  },
};

// === Talent / Perk System ===
export const talents = [
  { id:'t1', name:'深渊之眼', desc:'你能看见常人看不见的深渊能量流动。察觉检定获得优势。', prereq:{}, effect:{skillAdvantage:'perception'} },
  { id:'t2', name:'冰之血脉', desc:'你的血液中流淌着寒冰的力量。冰属性攻击额外造成 +1d4 伤害。', prereq:{}, effect:{iceDamage:'1d4'} },
  { id:'t3', name:'炼金学徒', desc:'你在象牙之塔接受过基础炼金训练。可使用炼金术鉴定物品。', prereq:{int:12}, effect:{alchemy:true} },
  { id:'t4', name:'厨魔入门', desc:'你能将击败的怪物素材转化为可食用（？）的料理。恢复效果+50%。', prereq:{}, effect:{cookingBonus:1.5} },
  { id:'t5', name:'灾厄乐师', desc:'你的音乐能够影响现实。表演检定获得+2加成，可在战斗中演奏。', prereq:{cha:12}, effect:{performanceBonus:2} },
  { id:'t6', name:'鸦羽守护', desc:'衔烛之鸦在你遇到致命伤害时会为你抵挡一次。每场战斗限一次。', prereq:{}, effect:{deathSave:true} },
  { id:'t7', name:'武艺精通', desc:'近战攻击检定获得+2加成。', prereq:{str:12}, effect:{meleeAttack:2} },
  { id:'t8', name:'博学者', desc:'你对边境的历史和怪物了如指掌。历史和宗教检定获得优势。', prereq:{int:14}, effect:{loreAdvantage:true} },
];

export function canTakeTalent(talent, player) {
  const attrs = player.attributes || player.baseStats;
  if (talent.prereq.str && (attrs.str||10) < talent.prereq.str) return false;
  if (talent.prereq.int && (attrs.int||10) < talent.prereq.int) return false;
  if (talent.prereq.cha && (attrs.cha||10) < talent.prereq.cha) return false;
  if (talent.prereq.dex && (attrs.dex||10) < talent.prereq.dex) return false;
  return true;
}

// === NPC Templates for player creation ===
export const npcTemplates = {
  merchant: { name:'旅行商人', personality:'精明但友善，喜欢讨价还价',
    dialogPreset:['欢迎光临！','这个可是稀有货哦','小心保管好你的钱包'], icon:'ShoppingBag' },
  warrior: { name:'流浪剑士', personality:'沉默寡言，重视荣誉',
    dialogPreset:['……','要过两招吗？','这片土地不适合弱者'], icon:'Swords' },
  sage: { name:'边境学者', personality:'好奇心旺盛，喜欢长篇大论',
    dialogPreset:['让我看看这个……有意思','根据我的研究……','知识就是力量！'], icon:'GraduationCap' },
  mystic: { name:'神秘旅人', personality:'说话含糊，喜欢打哑谜',
    dialogPreset:['命运之风正在改变……','你不知道前方有什么','有些秘密还是不要追问的好'], icon:'Moon' },
};
