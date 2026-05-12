import { useState } from 'react';
import { Dices, Zap, Sparkles } from 'lucide-react';
import { roll, rollAdvantage, rollDisadvantage, rollDice, mod, ATTRS, ATTR_NAMES, SKILLS, SKILL_NAMES, skillCheck } from '../systems/dice';

export default function DiceRoller({ open, onClose, player }) {
  if (!open) return null;
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('d20');
  const attrs = player.attributes || { str:12, dex:12, con:12, int:12, wis:12, cha:12 };

  const rollAction = (type) => {
    switch(type) {
      case 'd20': setResult({label:'d20', value:roll(20)}); break;
      case 'adv': setResult({label:'d20(优势)', value:rollAdvantage()}); break;
      case 'dis': setResult({label:'d20(劣势)', value:rollDisadvantage()}); break;
      case 'd4': setResult({label:'d4', value:roll(4)}); break;
      case 'd6': setResult({label:'d6', value:roll(6)}); break;
      case 'd8': setResult({label:'d8', value:roll(8)}); break;
      case 'd10': setResult({label:'d10', value:roll(10)}); break;
      case 'd12': setResult({label:'d12', value:roll(12)}); break;
      case '2d6': { const r = rollDice(2,6); setResult({label:'2d6', value:r.total, detail:r.results.join('+')}); } break;
    }
  };

  const rollSkill = (sk) => {
    const r = skillCheck(attrs, sk, 2, null, true);
    setResult({label:SKILL_NAMES[sk]||sk, value:r.total, detail:`d20(${r.d20})+${r.modifier+2}=${r.total}`, isCrit:r.isCrit, isFumble:r.isFumble});
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="dice-modal glass modal-content">
        <div className="drawer-header"><h3><Dices size={18}/>骰子系统</h3><button className="btn-close" onClick={onClose}><Sparkles size={16}/></button></div>
        <div className="dice-body">
          <div className="dice-tabs">
            {['d20','技能','基础'].map(t=><button key={t} className={`dice-tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)}>{t}</button>)}
          </div>
          {activeTab==='d20' && (
            <div className="dice-grid">
              <button className="dice-btn glass-light ripple-container" onClick={()=>rollAction('d20')}>🎲 d20</button>
              <button className="dice-btn glass-light ripple-container" onClick={()=>rollAction('adv')}><Zap size={14}/>优势</button>
              <button className="dice-btn glass-light ripple-container" onClick={()=>rollAction('dis')}>劣势</button>
            </div>
          )}
          {activeTab==='技能' && (
            <div className="skill-rolls">
              {Object.entries(SKILL_NAMES).map(([key,name])=>(
                <div key={key} className="skill-row" onClick={()=>rollSkill(key)}>
                  <span className="skill-name">{name}</span>
                  <span className="skill-attr">{ATTR_NAMES[SKILLS[key]]}(+{mod(attrs[SKILLS[key]]||10)+2})</span>
                </div>
              ))}
            </div>
          )}
          {activeTab==='基础' && (
            <div className="dice-grid-basic">
              {['d4','d6','d8','d10','d12','2d6'].map(d=>
                <button key={d} className="dice-btn glass-light ripple-container" onClick={()=>rollAction(d)}>{d}</button>
              )}
            </div>
          )}
          {result && (
            <div className={`dice-result glass-light ${result.isCrit?'crit':''} ${result.isFumble?'fumble':''}`}>
              <span className="result-label">{result.label}:</span>
              <span className={`result-value ${result.isCrit?'crit-text':''} ${result.isFumble?'fumble-text':''}`}>{result.value}</span>
              {result.detail && <span className="result-detail">({result.detail})</span>}
              {result.isCrit && <span className="crit-badge">暴击!</span>}
              {result.isFumble && <span className="fumble-badge">大失败!</span>}
            </div>
          )}

          {/* Attribute modifiers display */}
          <div className="attr-mods">
            {ATTRS.map(a=>(
              <div key={a} className="attr-mod-item">
                <span className="attr-mod-name">{ATTR_NAMES[a]}</span>
                <span className="attr-mod-score">{attrs[a]||10}</span>
                <span className={`attr-mod-val ${mod(attrs[a]||10)>=0?'positive':'negative'}`}>
                  {mod(attrs[a]||10)>=0?'+':''}{mod(attrs[a]||10)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
