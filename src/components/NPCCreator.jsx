import { useState } from 'react';
import { UserPlus, Wrench, Users } from 'lucide-react';
import { npcTemplates } from '../data/storyline';

export default function NPCCreator({ open, onClose, onCreateNpc, gameNpcs }) {
  if (!open) return null;
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [icon, setIcon] = useState('User');
  const [location, setLocation] = useState('crossroads');
  const [dialogs, setDialogs] = useState(['']);
  const [showCustom, setShowCustom] = useState(false);

  const applyTemplate = (tpl) => {
    setName(tpl.name); setPersonality(tpl.personality);
    setDialogs(tpl.dialogPreset||['']);
    setIcon(tpl.icon||'User');
    setShowCustom(true);
  };

  const addDialog = () => setDialogs([...dialogs,'']);
  const updateDialog = (i, v) => { const d = [...dialogs]; d[i]=v; setDialogs(d); };

  const create = () => {
    if (!name.trim()) return;
    const npc = {
      id: `custom_${Date.now()}`, name: name.trim(), icon, location,
      desc: personality || '一位神秘的旅行者。',
      dialogs: {
        greeting: dialogs[0] || `你好，我是${name}。`,
        topics: dialogs.slice(1).reduce((acc, d, i) => {
          if (d.trim()) acc[`对话选项 ${i+1}`] = d.trim();
          return acc;
        }, {}),
      },
      trades: [], quest: null,
    };
    onCreateNpc(npc);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="settings-modal glass modal-content" style={{width:520,maxHeight:'85vh',overflowY:'auto'}}>
        <div className="drawer-header"><h3><UserPlus size={18}/>创建 NPC</h3><button className="btn-close" onClick={onClose}>×</button></div>
        <div className="settings-body">
          <label className="setting-label">快速模板</label>
          <div className="npc-templates">
            {Object.entries(npcTemplates).map(([key, tpl])=>(
              <button key={key} className="tpl-btn glass-light ripple-container" onClick={()=>applyTemplate(tpl)}>
                <span>{tpl.name}</span><span className="tpl-desc">{tpl.personality.slice(0,10)}...</span>
              </button>
            ))}
          </div>
          {showCustom && <>
            <label className="setting-label">NPC 名称</label>
            <input className="setting-input" value={name} onChange={e=>setName(e.target.value)} placeholder="输入NPC名称"/>
            <label className="setting-label">性格描述</label>
            <input className="setting-input" value={personality} onChange={e=>setPersonality(e.target.value)} placeholder="精明但友善，喜欢讨价还价..."/>
            <label className="setting-label">出现地点</label>
            <select className="setting-input" value={location} onChange={e=>setLocation(e.target.value)}>
              <option value="crossroads">十字路口</option><option value="shrine">水无月神社</option>
              <option value="forest">幽暗密林</option><option value="mine">矿坑入口</option>
              <option value="waterfall">静寂瀑布</option>
            </select>
            <label className="setting-label">预设对话 (第1条为问候语)</label>
            {dialogs.map((d,i)=><input key={i} className="setting-input" value={d} onChange={e=>updateDialog(i,e.target.value)}
              placeholder={`对话 ${i+1}${i===0?' (问候语)':''}`} />)}
            <button className="btn-trade ripple-container" onClick={addDialog} style={{marginTop:4}}>+ 添加对话选项</button>
          </>}
          <button className="btn-save ripple-container" onClick={create} style={{marginTop:12}} disabled={!name.trim()}>
            <Wrench size={14}/>创建 NPC
          </button>
        </div>

        {/* Existing custom NPCs */}
        {Object.keys(gameNpcs).length>0 && (
          <div style={{marginTop:16}}>
            <label className="setting-label">已创建的 NPC ({Object.keys(gameNpcs).length}位)</label>
            {Object.values(gameNpcs).map(npc=>(
              <div key={npc.id} className="trade-item glass-light" style={{marginTop:4}}>
                <span><Users size={14}/> {npc.name}</span>
                <span style={{fontSize:11,color:'var(--text-dim)'}}>{npc.location}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
