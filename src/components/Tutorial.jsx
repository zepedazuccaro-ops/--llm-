import { useState } from 'react';
import { BookOpen, Map, Backpack, Swords, ArrowRight, X } from 'lucide-react';

const STEPS = [
  { id:'welcome', title:'欢迎来到深渊边境', icon:BookOpen,
    text:'这是一款基于COC 1d100骰子机制的LLM文字冒险RPG。每一次行动都会触发骰子检定，结果将由系统自动判定。你准备好了吗？' },
  { id:'story', title:'故事面板', icon:BookOpen,
    text:'在故事面板中输入你的行动。你可以自由探索、与NPC对话、调查环境。所有行动都会自动触发骰子检定。\n\n提示: 尝试「环顾四周」「与老人交谈」「走向神社」等自然语言指令。' },
  { id:'map', title:'探索地图', icon:Map,
    text:'切换到地图标签查看深渊边境。点击节点查看区域详情，点击「前往此处」移动。已探索区域显示为暗色，未探索区域为半透明。某些地点有NPC等待着你。' },
  { id:'dice', title:'骰子系统', icon:Swords,
    text:'本游戏使用COC 1d100机制。技能值从1到100，掷骰结果需小于等于技能值才能成功。\n\n• 掷出 <= 技能的1/5 = 极难成功\n• 掷出 <= 技能的1/2 = 困难成功\n• 掷出 <= 技能 = 成功\n• 掷出 >= 96 = 大失败\n\n侧边栏的「骰子」面板可以手动掷骰。' },
  { id:'combat', title:'战斗系统', icon:Swords,
    text:'战斗中骰子自动判定攻击命中。极难成功后伤害最大化，大失败可能导致武器脱手。\n\n使用技能需要消耗MP，回复HP使用道具。你可以随时选择撤退。' },
  { id:'inventory', title:'背包与装备', icon:Backpack,
    text:'点击侧边栏「背包」打开角色面板。\n• 装备栏: 点击已装备物品可卸下\n• 物品栏: 点击物品选择使用/装备/丢弃\n• 消耗品使用后自动触发骰子效果判定\n• 右上角可导出/导入存档' },
  { id:'tips', title:'进阶技巧', icon:ArrowRight,
    text:'• 在API设置中填入DeepSeek Key启用AI剧情\n• 无API时红色提醒会显示在顶部\n• 点击「创建NPC」自定义NPC\n• 双击地图节点展开详情\n• Enter发送消息 Shift+Enter换行' },
];

export default function Tutorial({ open, onClose }) {
  const [step, setStep] = useState(0);
  if (!open) return null;
  const s = STEPS[step];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tutorial-modal glass modal-content" onClick={e=>e.stopPropagation()}>
        <div className="tutorial-header">
          <div className="tutorial-icon">{s.icon&&<s.icon size={22}/>}</div>
          <div><h3>{s.title}</h3><p className="tutorial-step-text">第 {step+1}/{STEPS.length} 步</p></div>
          <button className="btn-close" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="tutorial-body">
          <p className="tutorial-text">{s.text}</p>
        </div>
        <div className="tutorial-footer">
          <div className="tutorial-dots">
            {STEPS.map((_,i)=><div key={i} className={`tutorial-dot ${i===step?'active':i<step?'done':''}`}/>)}
          </div>
          <div className="tutorial-btns">
            {step>0&&<button className="btn-trade ripple-container" onClick={()=>setStep(step-1)}>上一步</button>}
            {step<STEPS.length-1?<button className="btn-trade ripple-container" onClick={()=>setStep(step+1)}>下一步<ArrowRight size={14}/></button>
            :<button className="btn-save ripple-container" onClick={onClose} style={{padding:'8px 16px',fontSize:13}}>开始冒险</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
