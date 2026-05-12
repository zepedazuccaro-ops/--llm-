import { useState } from 'react';
import { Dices, Zap, Sparkles } from 'lucide-react';
import { rollD100, rollDice, skillCheck, bonusDie, penaltyDie, ATTRIBUTES, ATTRIBUTE_KEYS, SKILLS, calcSkillBase, narrativeEffect, normalizeSkill } from '../systems/dice';

export default function DiceRoller({ open, onClose, player }) {
  if (!open) return null;
  const [result, setResult] = useState(null);
  const [resultText, setResultText] = useState('');
  const [activeTab, setActiveTab] = useState('coc');
  const attrs = player.attributes || { str:50, con:50, siz:50, dex:50, app:50, int:50, pow:50, edu:50 };

  const rollAction = (type) => {
    switch(type) {
      case 'd100': { const r = rollD100(); setResult({label:'d100', value:r}); setResultText(`掷出 ${r}`); break; }
      case 'bonus': { const r = bonusDie(50); setResult({label:'奖励骰', value:r.roll}); setResultText(`${r.label}`); break; }
      case 'penalty': { const r = penaltyDie(50); setResult({label:'惩罚骰', value:r.roll}); setResultText(`${r.label}`); break; }
      case 'd4': setResult({label:'d4', value:Math.floor(Math.random()*4)+1}); break;
      case 'd6': setResult({label:'d6', value:Math.floor(Math.random()*6)+1}); break;
      case 'd8': setResult({label:'d8', value:Math.floor(Math.random()*8)+1}); break;
      case 'd10': setResult({label:'d10', value:Math.floor(Math.random()*10)+1}); break;
      case '2d6': { const r = rollDice(2,6); setResult({label:'2d6', value:r.total, detail:r.results.join('+')}); break; }
      case '3d6': { const r = rollDice(3,6); setResult({label:'3d6', value:r.total, detail:r.results.join('+')}); break; }
    }
  };

  const rollSkill = (sk) => {
    const baseVal = calcSkillBase(sk, attrs);
    const r = skillCheck(baseVal);
    const eff = narrativeEffect(r, 'exploration');
    setResult({label:SKILLS[sk]?.name||sk, value:r.roll, detail:`掷${r.roll} vs ${baseVal} → ${r.level}`});
    setResultText(`${eff.text} ${eff.bonus||''}`);
    if (r.level==='extreme') setResult(prev=>({...prev,isCrit:true}));
    if (r.level==='fumble') setResult(prev=>({...prev,isFumble:true}));
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="dice-modal glass modal-content">
        <div className="drawer-header"><h3><Dices size={18}/>骰子系统</h3><button className="btn-close" onClick={onClose}><Sparkles size={16}/></button></div>
        <div className="dice-body">
          <div className="dice-tabs">
            {['COC','技能','基础'].map(t=><button key={t} className={`dice-tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)}>{t}</button>)}
          </div>
          {activeTab==='COC' && (
            <div className="dice-grid">
              <button className="dice-btn glass-light ripple-container" onClick={()=>rollAction('d100')}>d100</button>
              <button className="dice-btn glass-light ripple-container" onClick={()=>rollAction('bonus')}><Zap size={14}/>奖励骰</button>
              <button className="dice-btn glass-light ripple-container" onClick={()=>rollAction('penalty')}>惩罚骰</button>
            </div>
          )}
          {activeTab==='技能' && (
            <div className="skill-rolls">
              {Object.entries(SKILLS).map(([key,sk])=>(
                <div key={key} className="skill-row" onClick={()=>rollSkill(key)}>
                  <span className="skill-name">{sk.name}</span>
                  <span className="skill-attr">{calcSkillBase(key,attrs)}%</span>
                </div>
              ))}
            </div>
          )}
          {activeTab==='基础' && (
            <div className="dice-grid-basic">
              {['d4','d6','d8','d10','2d6','3d6'].map(d=>
                <button key={d} className="dice-btn glass-light ripple-container" onClick={()=>rollAction(d)}>{d}</button>
              )}
            </div>
          )}
          {result && (
            <div className={`dice-result glass-light ${result.isCrit?'crit':''} ${result.isFumble?'fumble':''}`}>
              <span className="result-label">{result.label}:</span>
              <span className={`result-value ${result.isCrit?'crit-text':''} ${result.isFumble?'fumble-text':''}`}>{result.value}</span>
              {result.detail && <span className="result-detail">({result.detail})</span>}
              {result.isCrit && <span className="crit-badge">极难成功!</span>}
              {result.isFumble && <span className="fumble-badge">大失败!</span>}
              {resultText && <p className="dice-narrative">{resultText}</p>}
            </div>
          )}

          <div className="attr-mods">
            {ATTRIBUTE_KEYS.map(a=>(
              <div key={a} className="attr-mod-item">
                <span className="attr-mod-name">{ATTRIBUTES[a].name}</span>
                <span className="attr-mod-score">{attrs[a]||50}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
