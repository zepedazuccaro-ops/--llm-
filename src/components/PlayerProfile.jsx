import { useState, useEffect } from 'react';
import { User, Save, X } from 'lucide-react';

const DEFAULT_PROFILE = {
  name:'冒险者', gender:'未指定', age:'?', occupation:'旅人',
  personality:'', backstory:'', appearance:'',
  goals:'探索深渊边境的真相', fears:'',
};

export function loadProfile() {
  try {
    const s=localStorage.getItem('llmgame_player_profile');
    return s?{...DEFAULT_PROFILE,...JSON.parse(s)}:{...DEFAULT_PROFILE};
  } catch(e) { return {...DEFAULT_PROFILE}; }
}

export function saveProfile(profile) {
  localStorage.setItem('llmgame_player_profile', JSON.stringify(profile));
}

export function buildPlayerPersona() {
  const p = loadProfile();
  const parts = [`姓名: ${p.name}`, `性别: ${p.gender}`, `年龄: ${p.age}`];
  if (p.occupation) parts.push(`职业: ${p.occupation}`);
  if (p.personality) parts.push(`性格: ${p.personality}`);
  if (p.backstory) parts.push(`背景: ${p.backstory}`);
  if (p.appearance) parts.push(`外貌: ${p.appearance}`);
  if (p.goals) parts.push(`目标: ${p.goals}`);
  if (p.fears) parts.push(`恐惧: ${p.fears}`);
  return parts.join(' | ');
}

export default function PlayerProfile({ open, onClose, toast }) {
  if (!open) return null;
  const [profile, setProfile] = useState(loadProfile);

  const save = () => {
    saveProfile(profile);
    toast('success','角色人设已保存，将影响AI对话风格。');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="settings-modal glass modal-content" style={{width:520,maxHeight:'85vh',overflowY:'auto'}}>
        <div className="drawer-header"><h3><User size={18}/>玩家角色人设</h3><button className="btn-close" onClick={onClose}><X size={16}/></button></div>
        <div className="settings-body">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div><label className="setting-label">姓名</label><input className="setting-input" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></div>
            <div><label className="setting-label">性别</label><select className="setting-input" value={profile.gender} onChange={e=>setProfile({...profile,gender:e.target.value})}><option>未指定</option><option>男</option><option>女</option><option>其他</option></select></div>
            <div><label className="setting-label">年龄</label><input className="setting-input" value={profile.age} onChange={e=>setProfile({...profile,age:e.target.value})} placeholder="18"/></div>
            <div><label className="setting-label">职业</label><input className="setting-input" value={profile.occupation} onChange={e=>setProfile({...profile,occupation:e.target.value})} placeholder="冒险者/学者/佣兵..."/></div>
          </div>
          <label className="setting-label">外貌描述</label>
          <input className="setting-input" value={profile.appearance} onChange={e=>setProfile({...profile,appearance:e.target.value})} placeholder="黑色短发，深邃的眼眸，穿着旅行大衣..."/>
          <label className="setting-label">性格描述 (AI扮演依据)</label>
          <textarea className="setting-input" value={profile.personality} onChange={e=>setProfile({...profile,personality:e.target.value})} placeholder="冷静理智但偶尔冲动，对未知有强烈好奇心..." style={{minHeight:50}}/>
          <label className="setting-label">背景故事</label>
          <textarea className="setting-input" value={profile.backstory} onChange={e=>setProfile({...profile,backstory:e.target.value})} placeholder="从哪里来，经历过什么关键事件..." style={{minHeight:50}}/>
          <label className="setting-label">当前目标</label>
          <input className="setting-input" value={profile.goals} onChange={e=>setProfile({...profile,goals:e.target.value})}/>
          <label className="setting-label">内心恐惧</label>
          <input className="setting-input" value={profile.fears} onChange={e=>setProfile({...profile,fears:e.target.value})} placeholder="害怕失去重要的人/害怕黑暗..."/>
          <button className="btn-save ripple-container" onClick={save}><Save size={14}/>保存人设</button>
          <p className="settings-hint">此人设将在每次AI对话时注入系统提示词，影响NPC对你的态度和AI叙述风格。</p>
        </div>
      </div>
    </div>
  );
}
