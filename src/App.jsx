import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Menu, Swords, Map, BookOpen, Backpack, Settings, Send, X, Heart, Zap, Star, Crosshair, Shield, Swords as Atk, Footprints, Sparkles, FlaskRound, Droplets, Key, Diamond, UtensilsCrossed, Gem, Flame, Skull, Bug, CloudFog, Wind, Snowflake, Sword, Package, Circle, MapPin, User, Heart as HeartIcon, Trash2, Wrench, Plus, Search, Globe, Eye, UserPlus, RefreshCw, Download, Upload, Dices, Users, Clock } from 'lucide-react';
import './App.css';
import { playerData, itemDatabase, startingInventory, mapNodes, npcs, monsters, playerSkills, sampleStoryLog, quests, sceneStories } from './data/mock.js';
import { sendGameMessage, getConfig, updateConfig, loadConfig, selectProvider, setApiKey, PROVIDERS } from './api/llm.js';
import { mainStory, branches, talents, canTakeTalent } from './data/storyline.js';
import { initGameTime } from './systems/clock.js';
import { createSave, exportSave, importSaveFile, validateSave } from './systems/save.js';
import { skillCheck, narrativeEffect, rollD100, rollDice, calcSkillBase } from './systems/dice.js';
import { buildWorldBookContext, worldBook } from './data/worldbook.js';
import ClockDisplay from './components/ClockDisplay.jsx';
import DiceRoller from './components/DiceRoller.jsx';
import NPCCreator from './components/NPCCreator.jsx';
import Tutorial from './components/Tutorial.jsx';
import PlayerProfile, { buildPlayerPersona } from './components/PlayerProfile.jsx';

// === UTILITY ===
let toastId = 0;
function uid() { return ++toastId; }

function useRipple() {
  const createRipple = useCallback((e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const el = document.createElement('span');
    el.className = 'ripple-el';
    el.style.cssText = `left:${x}px;top:${y}px;position:absolute;border-radius:50%;background:rgba(255,255,255,0.12);transform:scale(0);animation:ripple 0.6s linear;pointer-events:none;`;
    btn.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }, []);
  return createRipple;
}

// === STATS CALCULATOR ===
function calcStats(baseStats, equipment) {
  const bonus = { atk:0, def:0, spd:0, int:0, luk:0, mp:0 };
  Object.values(equipment).forEach(eq => {
    if (!eq) return;
    Object.entries(eq.stats || {}).forEach(([k,v]) => { bonus[k] = (bonus[k] || 0) + v; });
  });
  const stats = {};
  Object.keys(baseStats).forEach(k => { stats[k] = baseStats[k] + (bonus[k] || 0); });
  stats.mp = bonus.mp || 0;
  return { stats, bonus };
}

// === TOAST CONTAINER ===
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item glass-light toast-${t.type}`} onClick={() => removeToast(t.id)}>
          <span>{t.message}</span><X size={13} className="toast-close" />
        </div>
      ))}
    </div>
  );
}

// === STORY PANEL (with quick replies + dice display) ===
function StoryPanel({ storyLog, playerInput, setPlayerInput, onSend, isLoading, quickReplies, onQuickReply }) {
  const endRef = useRef(null), ripple = useRipple();
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [storyLog]);

  const send = () => { if (!playerInput.trim() || isLoading) return; onSend(playerInput.trim()); setPlayerInput(''); };

  return (
    <div className="story-panel">
      <div className="story-log">
        {storyLog.map((e,i) => (
          <div key={i} className={`story-entry ${e.role}`} style={{animation:`fadeInUp var(--duration-normal) var(--ease-out-expo) forwards`,animationDelay:`${i*25}ms`,opacity:0}}>
            <div className={`entry-wrap ${e.role}`}>
              <div className="entry-label">{e.role==='narrator'?'GM':e.role==='system'?'系统':'你'}</div>
              <div className="entry-content">
                {e.content.split('\n').map((l,j)=><p key={j}>{l||' '}</p>)}
                {e.diceResult && (
                  <div className={`dice-inline ${e.diceResult.level}`}>
                    <span className="dice-inline-label">🎲 {e.diceResult.label}:</span>
                    <span className="dice-inline-value">{e.diceResult.roll} vs {e.diceResult.skill}</span>
                    <span className={`dice-inline-level ${e.diceResult.level}`}>{e.diceResult.level==='extreme'?'极难成功':e.diceResult.level==='hard'?'困难成功':e.diceResult.level==='regular'?'成功':e.diceResult.level==='fumble'?'大失败':'失败'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="story-entry narrator"><div className="entry-wrap narrator"><div className="entry-label">GM</div><div className="entry-content"><span className="typewriter-cursor">思考中</span></div></div></div>}
        <div ref={endRef} />
      </div>
      {quickReplies && quickReplies.length>0 && !isLoading && (
        <div className="quick-replies">
          {quickReplies.map((qr,i)=><button key={i} className="quick-reply-btn glass-light ripple-container" onClick={e=>{ripple(e);onQuickReply(qr);}}>{qr}</button>)}
        </div>
      )}
      <div className="story-input-area glass-light">
        <input id="player-input" className="player-input" value={playerInput} onChange={e=>setPlayerInput(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="输入你的行动...（Enter发送，Shift+Enter换行）" disabled={isLoading} />
        <button id="btn-send" className="btn-send ripple-container" onClick={e=>{ripple(e);send();}} disabled={isLoading}><Send size={16}/></button>
      </div>
    </div>
  );
}

// === MAP PANEL ===
function MapPanel({ nodes, currentNodeId, onTravel, onNpcInteract, npcsHere }) {
  const [selected, setSelected] = useState(null), ripple = useRipple();
  const current = nodes.find(n=>n.id===currentNodeId);

  return (
    <div className="map-panel">
      <div className="map-header"><h2>深渊边境 · 探索地图</h2><p className="map-subtitle">{current?.name} — 可交互区域</p></div>
      <div className="map-grid">
        {nodes.map(node => {
          const conn = (current?.connections||[]).includes(node.id)||node.id===currentNodeId;
          return (
            <div key={node.id} className={`map-node ${node.type} ${node.id===currentNodeId?'current':''} ${!conn?'disconnected':''}`}
              style={{left:`${node.x}%`,top:`${node.y}%`}} onClick={()=>conn&&setSelected(node)} onMouseEnter={()=>conn&&setSelected(node)}>
              <div className={`node-marker ${node.id===currentNodeId?'node-current':''}`}>
                {node.id===currentNodeId ? <Circle size={12} fill="var(--accent)" color="var(--accent)"/> :
                 node.status==='explored' ? <Circle size={10} color="var(--text-dim)"/> :
                 <Circle size={10} color="var(--text-dim)" style={{opacity:0.3}}/>}
              </div>
              <span className={`node-label ${node.id===currentNodeId?'active':''}`}>{node.name}</span>
              {selected?.id===node.id && (
                <div className="node-tooltip glass">
                  <div className="tooltip-header">
                    <span className={`node-badge ${node.type}`}>{node.type==='hub'?'据点':node.type==='dungeon'?'遗迹':node.type==='wild'?'野外':'危险'}</span>
                    <span className={`node-badge status ${node.status}`}>{node.status==='current'?'当前位置':node.status==='explored'?'已探索':'未探索'}</span>
                  </div>
                  <p className="tooltip-desc">{node.desc?.split('\n')[0]}</p>
                  {node.npcHere && npcsHere[node.npcHere] && (
                    <button className="btn-npc ripple-container" onClick={e=>{ripple(e);onNpcInteract(node.npcHere);}}>
                      <User size={13}/>与 {npcsHere[node.npcHere].name} 交谈
                    </button>
                  )}
                  {conn && node.id!==currentNodeId && (
                    <button className="btn-travel ripple-container" onClick={e=>{ripple(e);onTravel(node);}}>
                      <MapPin size={13}/>前往此处
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {nodes.flatMap(n=>n.connections.map(cid=>{const t=nodes.find(x=>x.id===cid);if(!t)return null;
            return <line key={`${n.id}-${cid}`} x1={n.x} y1={n.y} x2={t.x} y2={t.y}
              stroke={t.status==='explored'||t.id===currentNodeId?'rgba(112,148,186,0.3)':'rgba(255,255,255,0.05)'}
              strokeWidth="0.2" strokeDasharray={t.status==='explored'?'none':'0.8,0.8'}/>;}))}
        </svg>
      </div>
    </div>
  );
}

// === COMBAT MODAL ===
function CombatModal({ combat, onAction, onFlee }) {
  const [log, setLog] = useState([]), [selSkill, setSelSkill] = useState(null), ripple = useRipple();
  if (!combat?.active) return null;
  const { monster, playerState: p } = combat;
  const mHp = (monster.hp/monster.maxHp*100).toFixed(0), pHp = (p.hp/p.maxHp*100).toFixed(0);

  const act = (type, data) => {
    setLog(prev=>[...prev, {role:'player',msg:type==='attack'?'你发动了普通攻击！':type==='skill'?`你使用了「${data.name}」！`:`你使用了「${data.name}」！`}].slice(-8));
    onAction(type, data);
  };

  return (
    <div className="modal-overlay">
      <div className="combat-modal glass modal-content">
        <div className="combat-header"><Swords size={18}/><h3>战斗</h3><button className="btn-close" onClick={onFlee}><X size={16}/></button></div>
        <div className="combat-body">
          <div className="monster-card glass-light">
            <div className="monster-icon-wrap">{monster.icon==='Flame'?<Flame size={32}/>:monster.icon==='Skull'?<Skull size={32}/>:monster.icon==='Bug'?<Bug size={32}/>:<CloudFog size={32}/>}</div>
            <div className="monster-info">
              <h4>{monster.name}</h4>
              <div className="monster-tags">{monster.tags.map((t,i)=><span key={i} className="tag">{t}</span>)}</div>
              <div className="hp-bar-container"><div className="hp-bar" style={{width:`${mHp}%`,background:mHp<30?'var(--danger)':'var(--danger-dim)'}}/><span className="hp-text">{monster.hp}/{monster.maxHp}</span></div>
              <div className="monster-stats"><span><Atk size={12}/>ATK {monster.atk}</span><span><Shield size={12}/>DEF {monster.def}</span><span><Footprints size={12}/>SPD {monster.spd}</span></div>
            </div>
          </div>
          <div className="player-status glass-light">
            <div className="status-row"><span className="status-label">{p.name}</span><span className="status-level">Lv.{p.level}</span></div>
            <div className="status-bars">
              <div className="hp-bar-container small"><div className="hp-bar" style={{width:`${pHp}%`,background:pHp<25?'var(--danger)':'var(--accent)',animation:pHp<20?'hpWarning 0.8s infinite':'none'}}/><span className="hp-text">HP {p.hp}/{p.maxHp}</span></div>
              <div className="hp-bar-container small mp"><div className="hp-bar" style={{width:`${(p.mp/p.maxMp*100).toFixed(0)}%`,background:'#7b8fba'}}/><span className="hp-text">MP {p.mp}/{p.maxMp}</span></div>
            </div>
          </div>
          {log.length>0 && <div className="combat-log glass-light">{log.map((l,i)=><p key={i} className={l.role}>{l.msg}</p>)}</div>}
          <div className="combat-actions">
            <button className="btn-combat ripple-container" onClick={e=>{ripple(e);act('attack');}}><Sword size={15}/><span>攻击</span></button>
            <div className="skills-group">
              {playerSkills.map(s=><button key={s.id} className={`btn-combat skill ripple-container ${selSkill===s.id?'selected':''}`}
                onClick={e=>{ripple(e);setSelSkill(s.id);act('skill',s);}} disabled={p.mp<s.cost}>
                {s.icon==='Snowflake'?<Snowflake size={14}/>:s.icon==='Wind'?<Wind size={14}/>:<Sword size={14}/>}
                <span>{s.name}</span>{s.cost>0&&<span className="skill-cost">{s.cost}MP</span>}
              </button>)}
            </div>
            <button className="btn-combat item" onClick={e=>{ripple(e);act('item',{name:'回复药·小'});}}><FlaskRound size={15}/><span>物品</span></button>
            <button className="btn-combat flee" onClick={e=>{ripple(e);onFlee();}}><Footprints size={15}/><span>撤退</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === INVENTORY DRAWER (with item actions) ===
function InventoryDrawer({ open, onClose, player, inventory, onUseItem, onDiscardItem, onEquipItem, onUnequipItem, toast }) {
  if (!open) return null;
  const [itemMenu, setItemMenu] = useState(null), ripple = useRipple();
  const { stats, bonus } = useMemo(()=>calcStats(player.baseStats, player.equipment), [player]);

  const getItem = (id) => itemDatabase[id];
  const equippedIds = Object.values(player.equipment).filter(Boolean).map(e=>e.id);

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="inventory-drawer glass">
        <div className="drawer-header"><h3><Backpack size={18}/>角色与背包</h3><button className="btn-close" onClick={onClose}><X size={16}/></button></div>
        <div className="drawer-body">
          {/* Character Card */}
          <div className="char-card glass-light">
            <div className="char-header">
              <div className="char-avatar">{player.name[0]}</div>
              <div><h4>{player.name}</h4><p className="char-title">{player.title}</p></div>
              <div className="char-level">Lv.{player.level}</div>
            </div>
            <div className="char-stats-grid">
              {Object.entries(stats).map(([k,v])=>(
                <div key={k} className="stat-item">
                  <span className="stat-icon">{k==='atk'?<Atk size={13}/>:k==='def'?<Shield size={13}/>:k==='spd'?<Footprints size={13}/>:k==='int'?<Sparkles size={13}/>:<Star size={13}/>}</span>
                  <span className="stat-key">{k==='atk'?'攻击':k==='def'?'防御':k==='spd'?'速度':k==='int'?'智力':'幸运'}</span>
                  <span className="stat-val">{v}{bonus[k]?<span style={{fontSize:10,color:'var(--accent)',marginLeft:4}}>+{bonus[k]}</span>:''}</span>
                </div>
              ))}
            </div>
            <div className="exp-bar-container"><div className="exp-bar" style={{width:`${(player.exp/player.expToNext*100).toFixed(0)}%`}}/><span className="exp-text">EXP {player.exp}/{player.expToNext}</span></div>
          </div>

          {/* Equipment Slots */}
          <div className="section-title">装备</div>
          <div className="equip-grid">
            {['weapon','armor','accessory'].map(slot=>{
              const eq = player.equipment[slot];
              return (
                <div key={slot} className={`equip-slot ${eq?'has-item':''} rarity-${eq?.rarity||'common'} glass-light`}
                  onClick={()=>eq&&setItemMenu({type:'equipped',slot,item:eq})}>
                  <span className="slot-label">{slot==='weapon'?'武器':slot==='armor'?'防具':'饰品'}</span>
                  {eq ? <><span className="equip-name">{eq.name}</span>
                    <span className="equip-rarity">{eq.rarity==='legendary'?'传奇':eq.rarity==='rare'?'稀有':eq.rarity==='uncommon'?'精良':'普通'}</span>
                    <div className="equip-tooltip glass">{eq.desc}{eq.stats&&<div className="stat-bonus">{Object.entries(eq.stats).map(([k,v])=><span key={k}>{k==='atk'?'ATK':k==='def'?'DEF':k==='spd'?'SPD':k==='int'?'INT':k==='luk'?'LUK':k==='mp'?'MP':''}+{v>0?'+':''}{v}</span>)}</div>}</div></>
                    : <span className="slot-empty">空</span>}
                </div>
              );
            })}
          </div>

          {/* Inventory Grid */}
          <div className="section-title">物品 ({Object.keys(inventory).length} 种)</div>
          <div className="item-grid">
            {Object.entries(inventory).map(([itemId,qty])=>{
              const item = getItem(itemId); if(!item||qty<=0) return null;
              const isEquipped = equippedIds.includes(item.id);
              return (
                <div key={itemId} className={`item-slot rarity-${item.rarity} glass-light ${isEquipped?'equipped':''}`}
                  onClick={()=>setItemMenu({type:'inventory',id:itemId,item,qty})}>
                  {item.icon==='FlaskRound'?<FlaskRound size={18}/>:item.icon==='Droplets'?<Droplets size={18}/>:item.icon==='UtensilsCrossed'?<UtensilsCrossed size={18}/>:item.icon==='Key'?<Key size={18}/>:item.icon==='Map'?<Map size={18}/>:item.icon==='Diamond'?<Diamond size={18}/>:item.icon==='Sword'?<Sword size={18}/>:item.icon==='Shield'?<Shield size={18}/>:item.icon==='Gem'?<Gem size={18}/>:item.icon==='Flame'?<Flame size={18}/>:item.icon==='CloudFog'?<CloudFog size={18}/>:item.icon==='BookOpen'?<BookOpen size={18}/>:item.icon==='Swords'?<Swords size={18}/>:<Package size={18}/>}
                  {qty>1&&<span className="item-qty">{qty}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Item Action Menu */}
        {itemMenu && (
          <div className="item-action-overlay" onClick={()=>setItemMenu(null)}>
            <div className="item-action-menu glass" onClick={e=>e.stopPropagation()}>
              <div className="item-action-header">
                {itemMenu.item?.icon==='Flame'?<Flame size={16}/>:<Package size={16}/>}
                <strong>{itemMenu.item?.name||itemMenu.item?.name||'物品'}</strong>
                {itemMenu.qty>1&&<span className="item-action-qty">x{itemMenu.qty}</span>}
              </div>
              <p className="item-action-desc">{itemMenu.item?.desc}</p>
              <div className="item-action-btns">
                {itemMenu.type==='equipped' ? (
                  <button className="btn-action danger ripple-container" onClick={e=>{ripple(e);onUnequipItem(itemMenu.slot);setItemMenu(null);}}><Wrench size={14}/>卸下</button>
                ) : (
                  <>
                    {itemMenu.item?.usable && <button className="btn-action primary ripple-container" onClick={e=>{ripple(e);onUseItem(itemMenu.id);setItemMenu(null);}}><FlaskRound size={14}/>使用</button>}
                    {itemMenu.item?.equipable && <button className="btn-action secondary ripple-container" onClick={e=>{ripple(e);onEquipItem(itemMenu.id);setItemMenu(null);}}><Wrench size={14}/>装备</button>}
                    {!itemMenu.item?.equipable && !itemMenu.item?.usable && <span className="no-action">此物品无法直接使用</span>}
                    <button className="btn-action danger ripple-container" onClick={e=>{ripple(e);onDiscardItem(itemMenu.id);setItemMenu(null);}}><Trash2 size={14}/>丢弃</button>
                  </>
                )}
                <button className="btn-action cancel ripple-container" onClick={e=>{ripple(e);setItemMenu(null);}}><X size={14}/>取消</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// === NPC DIALOG MODAL (with AI thinking chain) ===
function NPCDialog({ npc, onClose, onTrade, onAcceptQuest, playerQuests, toast, playerInput, setPlayerInput, onNpcChat, npcChatLog, isLoading }) {
  if (!npc) return null;
  const [topic, setTopic] = useState('greeting'), ripple = useRipple();
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [npcChatLog]);

  // NPC thinking chain: persona + memory
  const thinkingChain = `${npc.name}(${npc.gender||'?'}, ${npc.age||'?'}岁, ${npc.occupation||'旅人'})。性格: ${npc.personality||npc.desc||'未知'}。外表: ${npc.appearance||''}`;

  const sendNpcMsg = () => {
    if (!playerInput?.trim() || isLoading) return;
    onNpcChat(npc, playerInput.trim(), thinkingChain);
    setPlayerInput?.('');
  };

  const dialogText = topic==='greeting'?npc.dialogs?.greeting||`你好，我是${npc.name}。`:npc.dialogs?.topics?.[topic]||'（对方沉默着...）';

  const selectTopic = (t) => {
    setTopic(t); setShownTopics(prev=>new Set([...prev,t]));
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="npc-dialog glass modal-content">
        <div className="npc-header">
          <div className="npc-avatar"><User size={20}/></div>
          <div><h3>{npc.name}</h3><p className="npc-desc">{npc.desc}</p></div>
          <button className="btn-close" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="npc-body">
          {/* NPC info bar */}
          <div className="npc-info-bar">
            <span>{npc.gender&&`${npc.gender}`} {npc.age&&`· ${npc.age}岁`} {npc.occupation&&`· ${npc.occupation}`}</span>
          </div>
          {/* Chat log */}
          {npcChatLog.length>0 && (
            <div className="npc-chat-log">
              {npcChatLog.map((e,i)=><div key={i} className={`npc-chat-msg ${e.role}`}><span className="npc-chat-label">{e.role==='player'?'你':npc.name}</span><p>{e.content}</p></div>)}
              {isLoading&&<div className="npc-chat-msg narrator"><span className="npc-chat-label">{npc.name}</span><p className="typewriter-cursor">思考中</p></div>}
              <div ref={endRef}/>
            </div>
          )}
          {/* Free text input for NPC chat */}
          <div className="npc-chat-input-row">
            <input className="setting-input" value={playerInput||''} onChange={e=>setPlayerInput?.(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();sendNpcMsg();}}}
              placeholder={`对 ${npc.name} 说...`} style={{flex:1}}/>
            <button className="btn-send ripple-container" onClick={()=>sendNpcMsg()} disabled={isLoading} style={{width:36,height:36}}><Send size={14}/></button>
          </div>
          {npcChatLog.length===0&&<>
          <p className="npc-text">{dialogText}</p>
          <div className="npc-topics">
            <button className={`topic-btn ripple-container ${topic==='greeting'?'active':''}`} onClick={()=>selectTopic('greeting')}>问候</button>
            {Object.keys(npc.dialogs.topics).map(t=><button key={t} className={`topic-btn ripple-container ${topic===t?'active':''}`}
              onClick={()=>selectTopic(t)}>{t}</button>)}
            {npc.trades&&<button className={`topic-btn trade ripple-container ${topic==='trade'?'active':''}`}
              onClick={()=>selectTopic('trade')}>交易</button>}
            {npc.quest&&<button className={`topic-btn quest ripple-container ${topic==='quest'?'active':''}`}
              onClick={()=>{selectTopic('quest');}}>委托</button>}
          </div>
          {topic==='trade' && npc.trades && (
            <div className="npc-trades">
              {npc.trades.map((tr,i)=>(
                <div key={i} className="trade-item glass-light">
                  <div className="trade-info">
                    <span>交换: {itemDatabase[tr.give]?.name||tr.give}</span>
                    <RefreshCw size={14}/>
                    <span>{itemDatabase[tr.receive]?.name||tr.receive}</span>
                  </div>
                  <button className="btn-trade ripple-container" onClick={e=>{ripple(e);onTrade(tr, npc.id);}}>交换</button>
                </div>
              ))}
            </div>
          )}
          {topic==='quest' && npc.quest && (
            <div className="npc-quest glass-light">
              <h4>{npc.quest.name}</h4>
              <p>{npc.quest.desc}</p>
              <p className="quest-reward">奖励: {npc.quest.reward&&itemDatabase[npc.quest.reward]?.name||npc.quest.reward}</p>
              {npc.quest.status!=='active'&&<button className="btn-trade ripple-container" onClick={e=>{ripple(e);onAcceptQuest(npc.quest);}}>接受委托</button>}
            </div>
          )}
          </>}
        </div>
      </div>
    </div>
  );
}

// === SEARCH PANEL (fixed) ===
function SearchPanel({ open, onClose, toast }) {
  if (!open) return null;
  const [query, setQuery] = useState(''), [results, setResults] = useState(null), [loading, setLoading] = useState(false), ripple = useRipple();

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setResults(null);
    try {
      // Use DuckDuckGo Instant Answer API (no CORS issues)
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(ddgUrl);
      const data = await res.json();

      const items = [];
      if (data.AbstractText) items.push({title:data.Heading||'摘要',snippet:data.AbstractText,url:data.AbstractURL||''});
      if (data.RelatedTopics?.length) {
        data.RelatedTopics.slice(0,8).forEach(t => {
          if (t.Text) items.push({title:'相关',snippet:t.Text.slice(0,200),url:t.FirstURL||''});
        });
      }
      // Fallback: open a search in new tab
      if (items.length===0) {
        items.push({title:'在浏览器中搜索',snippet:`点击此处在新标签页中搜索「${query}」`,url:`https://duckduckgo.com/?q=${encodeURIComponent(query)}`});
      }
      setResults(items.slice(0,8));
    } catch(e) {
      // Ultimate fallback
      setResults([{title:'在浏览器中搜索',snippet:`点击此处在新标签页中搜索「${query}」`,url:`https://duckduckgo.com/?q=${encodeURIComponent(query)}`}]);
      toast('info','API搜索不可用，提供浏览器搜索链接');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="search-modal glass modal-content" style={{width:560}}>
        <div className="drawer-header"><h3><Globe size={18}/>联网搜索</h3><button className="btn-close" onClick={onClose}><X size={16}/></button></div>
        <div className="search-body">
          <div className="search-input-row">
            <input className="setting-input" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}
              placeholder="搜索游戏世界相关资讯..." style={{flex:1}}/>
            <button className="btn-send ripple-container" onClick={e=>{ripple(e);search();}} disabled={loading}><Search size={15}/></button>
          </div>
          {loading && <div className="search-loading"><div className="shimmer" style={{height:60,borderRadius:'var(--radius-md)'}}/></div>}
          {results && (
            <div className="search-results">
              {results.map((r,i)=><div key={i} className="search-item glass-light"
                onClick={()=>{if(r.url)window.open(r.url,'_blank','noopener,noreferrer');}}
                style={{cursor:r.url?'pointer':'default'}}>
                <h4>{r.title}{r.url&&' ↗'}</h4><p>{r.snippet}</p>
              </div>)}
            </div>
          )}
          <p className="settings-hint">使用 DuckDuckGo 匿名搜索。用于查找游戏世界资料、小说设定参考等。</p>
        </div>
      </div>
    </div>
  );
}

// === CHARACTER CREATION MODAL ===
function CharacterCreation({ open, onClose, onCreate, toast }) {
  if (!open) return null;
  const [name, setName] = useState(''), [pts, setPts] = useState(40);
  const [stats, setStats] = useState({str:50,con:50,siz:50,dex:50,app:50,int:50,pow:50,edu:50});
  const [portrait, setPortrait] = useState('');
  const [customSkills, setCustomSkills] = useState('');
  const ripple = useRipple();

  const adjust = (key, delta) => {
    if (pts-delta<0||stats[key]+delta<5||stats[key]+delta>95) return;
    setStats(prev=>({...prev,[key]:prev[key]+delta})); setPts(prev=>prev-delta);
  };

  const create = () => {
    if (!name.trim()) { toast('warning','请输入角色名称'); return; }
    const finalStats = {...stats};
    const hp = Math.floor((finalStats.con+finalStats.siz)/10);
    const san = finalStats.pow;
    // Parse custom skills
    const extraSkills = {};
    if (customSkills.trim()) {
      customSkills.split(',').forEach(s=>{
        const [sk,val] = s.split(':').map(x=>x.trim());
        if (sk&&val) extraSkills[sk] = parseInt(val)||0;
      });
    }
    onCreate({ name:name.trim(), attributes:finalStats, title:'冒险者 · 新手', level:1, hp, maxHp:hp, mp:finalStats.pow, maxMp:finalStats.pow,
      san, maxSan:san, exp:0, expToNext:100, portrait:portrait||'', skills:{...extraSkills},
      equipment:{weapon:null,armor:null,accessory:null} });
    toast('success',`角色「${name.trim()}」创建成功！HP:${hp} SAN:${san}`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="settings-modal glass modal-content">
        <div className="drawer-header"><h3><UserPlus size={18}/>创建新角色</h3><button className="btn-close" onClick={onClose}><X size={16}/></button></div>
        <div className="settings-body">
          <label className="setting-label">角色名称</label>
          <input className="setting-input" value={name} onChange={e=>setName(e.target.value)} placeholder="输入你的角色名..." />
          <label className="setting-label">角色立绘 (图片URL)</label>
          <input className="setting-input" value={portrait} onChange={e=>setPortrait(e.target.value)} placeholder="粘贴图片URL或留空使用默认头像..." />
          <label className="setting-label">COC属性分配 (剩余: {pts}点, 范围5-95)</label>
          <div className="stat-alloc">
            {Object.entries(stats).map(([k,v])=><div key={k} className="alloc-row">
              <span className="alloc-label">{{str:'力量',con:'体质',siz:'体型',dex:'敏捷',app:'外貌',int:'智力',pow:'意志',edu:'教育'}[k]}</span>
              <button className="alloc-btn ripple-container" onClick={e=>{ripple(e);adjust(k,-5);}}>-5</button>
              <span className="alloc-val">{v}</span>
              <button className="alloc-btn ripple-container" onClick={e=>{ripple(e);adjust(k,5);}}>+5</button>
            </div>)}
          </div>
          <label className="setting-label">自定义技能 (格式: 技能名:数值, ...)</label>
          <input className="setting-input" value={customSkills} onChange={e=>setCustomSkills(e.target.value)}
            placeholder="例如: 大提琴:65, 炼金术:50, 厨艺:45" />
          <button className="btn-save ripple-container" onClick={e=>{ripple(e);create();}}>创建角色</button>
        </div>
      </div>
    </div>
  );
}

// === SETTINGS ===
function SettingsModal({ open, onClose, toast }) {
  if (!open) return null;
  const cfg = getConfig();
  const [provider, setProvider] = useState(localStorage.getItem('llmgame_provider')||'deepseek');
  const [ep, setEp] = useState(cfg.baseURL);
  const [key, setKey] = useState(cfg.apiKey);
  const [mdl, setMdl] = useState(cfg.model);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const ripple = useRipple();

  const switchProvider = (pkey) => {
    const c = selectProvider(pkey);
    setProvider(pkey); setEp(c.baseURL); setMdl(c.model);
  };

  const testConnection = async () => {
    setTesting(true); setTestResult('');
    const url = (ep||cfg.baseURL).replace(/\/$/,'') + '/v1/messages';
    try {
      const headers = {
        'Content-Type':'application/json',
        [cfg.authHeader||'Authorization']: (cfg.authPrefix||'Bearer ') + (key||cfg.apiKey),
      };
      const body = JSON.stringify({model:mdl||cfg.model, max_tokens:5, messages:[{role:'user',content:'hi'}]});
      const res = await fetch(url, {method:'POST', headers, body, signal:AbortSignal.timeout(10000)});
      if (res.ok) {
        const data = await res.json();
        setTestResult(`连接成功! 模型: ${data.model||mdl} 已就绪。`);
        toast('success','API连接测试通过');
      } else {
        const err = await res.text().catch(()=>'');
        setTestResult(`HTTP ${res.status}: ${err.slice(0,150)}`);
        toast('danger',`连接失败: HTTP ${res.status}`);
      }
    } catch(e) {
      setTestResult(`网络错误: ${e.message}`);
      toast('danger',`连接失败: ${e.message}`);
    } finally { setTesting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="settings-modal glass modal-content" style={{maxWidth:500}}>
        <div className="drawer-header"><h3><Settings size={18}/>API 设置 (酒馆式多提供商)</h3><button className="btn-close" onClick={onClose}><X size={16}/></button></div>
        <div className="settings-body">
          <label className="setting-label">提供商预设</label>
          <div className="provider-select">
            {Object.entries(PROVIDERS).map(([k,v])=>(
              <button key={k} className={`provider-btn ${provider===k?'active':''} ripple-container`}
                onClick={()=>switchProvider(k)}>{v.name}</button>
            ))}
          </div>
          <label className="setting-label">API 端点</label><input className="setting-input" value={ep} onChange={e=>setEp(e.target.value)}/>
          <label className="setting-label">API Key</label><input className="setting-input" type="password" value={key} onChange={e=>setKey(e.target.value)}/>
          <label className="setting-label">模型</label><input className="setting-input" value={mdl} onChange={e=>setMdl(e.target.value)}/>
          <div style={{display:'flex',gap:8}}>
            <button className="btn-save ripple-container" onClick={e=>{ripple(e);updateConfig({baseURL:ep,apiKey:key,model:mdl});setApiKey(key);setApiEnabled(true);toast('success','设置已保存，API已自动启用');onClose();}} style={{flex:1}}>保存并启用</button>
            <button className="btn-save ripple-container" onClick={()=>testConnection()} disabled={testing} style={{flex:1,background:'var(--bg-elevated)',border:'1px solid var(--border-default)'}}>
              {testing?'测试中...':'测试连接'}
            </button>
          </div>
          {testResult && <div className={`api-test-result ${testResult.includes('成功')?'success':'fail'}`}>{testResult}</div>}
          <div className="settings-recommend">
            <strong>推荐设置 (DeepSeek):</strong>
            <p>端点: https://api.deepseek.com/anthropic<br/>模型: deepseek-v4-pro[1m]<br/>API Key: 从 platform.deepseek.com 获取</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// === SIDEBAR ===
function Sidebar({ screen, setScreen, invOpen, setInvOpen, setOpen, searchOpen, setSearchOpen, npcCreatorOpen, setNpcCreatorOpen, profileOpen, setProfileOpen, quests, onExport, onImport }) {
  return (
    <aside className="sidebar glass">
      <div className="sidebar-logo"><BookOpen size={20}/><span className="logo-text">深渊手札</span></div>
      <nav className="sidebar-nav">
        <button className={`nav-btn ripple-container ${screen==='story'?'active':''}`} onClick={()=>setScreen('story')}><BookOpen size={18}/><span>故事</span></button>
        <button className={`nav-btn ripple-container ${screen==='map'?'active':''}`} onClick={()=>setScreen('map')}><Map size={18}/><span>地图</span></button>
        <button className={`nav-btn ripple-container ${invOpen?'active':''}`} onClick={()=>setInvOpen(true)}><Backpack size={18}/><span>背包</span></button>
        <button className="nav-btn ripple-container" onClick={()=>setSearchOpen(true)}><Globe size={18}/><span>搜索</span></button>
      </nav>
      <div className="sidebar-actions">
        <button className="nav-btn ripple-container" onClick={onExport}><Download size={16}/><span>导出存档</span></button>
        <button className="nav-btn ripple-container" onClick={onImport}><Upload size={16}/><span>导入存档</span></button>
        <button className="nav-btn ripple-container" onClick={()=>setNpcCreatorOpen(true)}><Users size={16}/><span>创建NPC</span></button>
        <button className="nav-btn ripple-container" onClick={()=>setWorldBookOpen(true)}><BookOpen size={16}/><span>世界书</span></button>
        <button className="nav-btn ripple-container" onClick={()=>setShowVars(!showVars)}><Eye size={16}/><span>{showVars?'隐藏变量':'变量'}</span></button>
        <button className="nav-btn ripple-container" onClick={()=>setProfileOpen(true)}><User size={16}/><span>人设</span></button>
      </div>
      <div className="sidebar-quests"><div className="quests-title">任务</div>
        {quests.map(q=><div key={q.id} className={`quest-item ${q.status}`}><div className="quest-name">{q.name}</div><div className="quest-progress">{q.progress}</div></div>)}
      </div>
      <div className="sidebar-footer">
        <div className="style-quick">
          <label className="setting-label" style={{fontSize:10}}>文风</label>
          <input className="setting-input" style={{fontSize:11,padding:'4px 8px'}}
            defaultValue={localStorage.getItem('llmgame_style')||''}
            onBlur={e=>{localStorage.setItem('llmgame_style',e.target.value);}}
            placeholder="简洁冷峻, 每段2-4句, 200-400字"/>
          <label style={{display:'flex',alignItems:'center',gap:4,marginTop:4,cursor:'pointer'}}>
            <input type="checkbox" defaultChecked={localStorage.getItem('llmgame_autodice')!=='false'}
              onChange={e=>localStorage.setItem('llmgame_autodice',e.target.checked)}/>
            <span style={{fontSize:10,color:'var(--text-dim)'}}>自动骰值</span>
          </label>
        </div>
        <button className="nav-btn ripple-container" onClick={()=>setOpen(true)}><Settings size={16}/><span>API设置</span></button>
      </div>
    </aside>
  );
}

// === HEADER ===
function Header({ player, gameTime, setGameTime, hasApi }) {
  return (
    <>
      {!hasApi && (
        <div className="api-warning">
          <span>未配置API Key — 当前使用Mock模式运行。点击侧边栏「API设置」接入LLM获得AI剧情生成。</span>
          <button className="api-warn-btn ripple-container" onClick={()=>{}}>⚙ 前往设置</button>
        </div>
      )}
      <header className="header glass-light">
        <div className="header-left">
          <div className="player-badge">
            <div className="player-avatar-sm" style={player.portrait?{backgroundImage:`url(${player.portrait})`,backgroundSize:'cover'}:{}}>{!player.portrait&&player.name[0]}</div>
            <div><span className="player-name-sm">{player.name}</span><span className="player-title-sm">{player.title}</span></div>
          </div>
        </div>
        <ClockDisplay gameTime={gameTime} setGameTime={setGameTime} />
        <div className="header-stats">
          <div className="header-stat"><Heart size={14} color="var(--danger)"/><span>{player.hp}/{player.maxHp}</span></div>
          <div className="header-stat">SAN {player.san!==undefined?player.san:'—'}/{player.maxSan||'—'}</div>
          <div className="header-stat"><Star size={14} color="var(--warning)"/><span>Lv.{player.level}</span></div>
        </div>
      </header>
    </>
  );
}

// === VARIABLE PANEL ===
function VariablePanel({ player, inventory, currentNodeId, gameTime, storyLog, onClose }) {
  const node = mapNodes.find(n=>n.id===currentNodeId);
  return (
    <div className="vars-panel glass" style={{position:'fixed',right:8,top:60,bottom:8,width:260,zIndex:1000,overflowY:'auto',padding:12,borderRadius:'var(--radius-lg)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <h4 style={{fontSize:13}}>变量监视器</h4><button className="btn-close" onClick={onClose}><X size={14}/></button>
      </div>
      <div className="var-group"><span className="var-label">玩家</span><span>{player.name} Lv.{player.level}</span></div>
      <div className="var-group"><span className="var-label">HP/MP</span><span>{player.hp}/{player.maxHp} | {player.mp}/{player.maxMp}</span></div>
      <div className="var-group"><span className="var-label">位置</span><span>{node?.name||'?'}</span></div>
      <div className="var-group"><span className="var-label">时间</span><span>第{gameTime.day}天 {gameTime.period}</span></div>
      <div className="var-group"><span className="var-label">道具数</span><span>{Object.keys(inventory).length}种</span></div>
      <div className="var-group"><span className="var-label">对话数</span><span>{storyLog.length}条</span></div>
      <div className="var-group"><span className="var-label">装备</span><span>{player.equipment.weapon?.name||'无'} / {player.equipment.armor?.name||'无'}</span></div>
      <div className="var-group"><span className="var-label">属性</span></div>
      {player.attributes&&Object.entries(player.attributes).map(([k,v])=><div key={k} className="var-row"><span>{k}</span><span>{v}</span></div>)}
    </div>
  );
}

// === WORLD BOOK EDITOR ===
function WorldBookEditor({ open, onClose, toast }) {
  if (!open) return null;
  const [entries, setEntries] = useState(()=>{
    const s=localStorage.getItem('llmgame_worldbook');
    return s?JSON.parse(s):worldBook.entries;
  });
  const [editIdx, setEditIdx] = useState(-1);
  const [newEntry, setNewEntry] = useState({keys:'',title:'',content:'',category:'world'});

  const save = () => {
    localStorage.setItem('llmgame_worldbook',JSON.stringify(entries));
    toast('success','世界书已保存');
  };
  const add = () => {
    if(!newEntry.title.trim())return;
    setEntries([...entries,{...newEntry,keys:newEntry.keys.split(',')}]);
    setNewEntry({keys:'',title:'',content:'',category:'world'});
    toast('info','条目已添加');
  };
  const remove = (i) => {setEntries(entries.filter((_,j)=>j!==i));};

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="settings-modal glass modal-content" style={{width:600,maxHeight:'85vh',overflowY:'auto'}}>
        <div className="drawer-header"><h3><BookOpen size={18}/>世界书编辑器</h3><button className="btn-close" onClick={onClose}><X size={16}/></button></div>
        <div className="settings-body">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:8}}>
            <input className="setting-input" placeholder="条目名称" value={newEntry.title} onChange={e=>setNewEntry({...newEntry,title:e.target.value})}/>
            <select className="setting-input" value={newEntry.category} onChange={e=>setNewEntry({...newEntry,category:e.target.value})}>
              <option value="world">世界观</option><option value="faction">势力</option><option value="location">地点</option><option value="character">角色</option><option value="bestiary">怪物</option><option value="item">物品</option><option value="rules">规则</option>
            </select>
          </div>
          <input className="setting-input" placeholder="触发关键词(逗号分隔)" value={newEntry.keys} onChange={e=>setNewEntry({...newEntry,keys:e.target.value})}/>
          <textarea className="setting-input" placeholder="条目内容" value={newEntry.content} onChange={e=>setNewEntry({...newEntry,content:e.target.value})} style={{minHeight:60}}/>
          <button className="btn-trade ripple-container" onClick={add} style={{marginBottom:8}}>添加条目</button>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            {entries.map((e,i)=><div key={i} className="trade-item glass-light" style={{marginBottom:4}}>
              <div style={{flex:1}}><strong style={{fontSize:12}}>{e.title}</strong><span style={{fontSize:10,color:'var(--text-dim)',marginLeft:8}}>{e.category}</span></div>
              <button className="api-copy-btn" onClick={()=>remove(i)} style={{fontSize:10}}>删除</button>
            </div>)}
          </div>
          <button className="btn-save ripple-container" onClick={save} style={{marginTop:8}}>保存世界书</button>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [screen, setScreen] = useState('story');
  const [storyLog, setStoryLog] = useState(sampleStoryLog);
  const [playerInput, setPlayerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState('crossroads');
  const [combat, setCombat] = useState({active:false,monster:null,playerState:null});
  const [invOpen, setInvOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [charOpen, setCharOpen] = useState(false);
  const [npcDialog, setNpcDialog] = useState(null);
  const [diceOpen, setDiceOpen] = useState(false);
  const [npcCreatorOpen, setNpcCreatorOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [gameTime, setGameTime] = useState(initGameTime);
  const [customNpcs, setCustomNpcs] = useState(()=>{
    const s = localStorage.getItem('llmgame_custom_npcs'); return s?JSON.parse(s):{};
  });
  const [playerTalents, setPlayerTalents] = useState(()=>{
    const s = localStorage.getItem('llmgame_talents'); return s?JSON.parse(s):[];
  });
  const [tutorialOpen, setTutorialOpen] = useState(()=>!localStorage.getItem('llmgame_tutorial_done'));
  const [quickReplies, setQuickReplies] = useState(null);
  const [apiError, setApiError] = useState('');
  const [apiEnabled, setApiEnabled] = useState(()=>{
    const key=localStorage.getItem('llmgame_apikey')||getConfig().apiKey;
    return !!key;
  });
  const [npcChatLog, setNpcChatLog] = useState([]);
  const [npcChatInput, setNpcChatInput] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [streamMode, setStreamMode] = useState(()=>localStorage.getItem('llmgame_stream')!=='false');
  const [showThinking, setShowThinking] = useState(true);
  const [showVars, setShowVars] = useState(false);
  const [worldBookOpen, setWorldBookOpen] = useState(false);
  const [writingStyle, setWritingStyle] = useState(()=>localStorage.getItem('llmgame_style')||'');
  const [autoSendDice, setAutoSendDice] = useState(()=>localStorage.getItem('llmgame_autodice')!=='false');
  const [player, setPlayer] = useState(()=>{
    const saved = localStorage.getItem('llmgame_player');
    if (saved) try {return JSON.parse(saved);} catch(e){}
    return playerData;
  });
  const [inventory, setInventory] = useState(()=>{
    const saved = localStorage.getItem('llmgame_inventory');
    if (saved) try {return JSON.parse(saved);} catch(e){}
    return {...startingInventory};
  });

  // Merged NPCs (built-in + custom)
  const allNpcs = useMemo(()=>({...npcs,...customNpcs}),[customNpcs]);

  useEffect(()=>{localStorage.setItem('llmgame_custom_npcs',JSON.stringify(customNpcs));},[customNpcs]);
  useEffect(()=>{localStorage.setItem('llmgame_talents',JSON.stringify(playerTalents));},[playerTalents]);
  useEffect(()=>{localStorage.setItem('llmgame_player',JSON.stringify(player));},[player]);
  useEffect(()=>{localStorage.setItem('llmgame_inventory',JSON.stringify(inventory));},[inventory]);

  const toast = useCallback((type,msg)=>{
    const id = uid(); setToasts(p=>[...p,{id,type,message:msg}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3500);
  },[]);
  const removeToast = useCallback((id)=>setToasts(p=>p.filter(t=>t.id!==id)),[]);

  // Initial load
  useEffect(()=>{loadConfig();},[]);

  // === SAVE / LOAD ===
  const handleExport = useCallback(()=>{
    const save = createSave(player, inventory, storyLog, currentNodeId, gameTime, quests, {});
    const msg = exportSave(save); toast('success',msg);
  },[player,inventory,storyLog,currentNodeId,gameTime,toast]);

  const handleImport = useCallback(async ()=>{
    try {
      const data = await importSaveFile();
      const v = validateSave(data); if (!v.valid) return toast('warning',v.reason);
      setPlayer(data.player); setInventory(data.inventory||{...startingInventory});
      setStoryLog(data.storyLog||sampleStoryLog);
      setCurrentNodeId(data.currentNodeId||'crossroads');
      if (data.gameTime) setGameTime(data.gameTime);
      toast('success','存档加载成功！欢迎回来。');
    } catch(e) { if(e!=='未选择文件') toast('danger',e.toString()); }
  },[toast]);

  // === ITEM ACTIONS ===
  const handleUseItem = useCallback((itemId) => {
    const item = itemDatabase[itemId]; if (!item?.usable||!item.effect) return;
    const newInv = {...inventory};
    newInv[itemId] = Math.max(0,(newInv[itemId]||0)-1);
    if (newInv[itemId]<=0) delete newInv[itemId];
    setInventory(newInv);
    const p = {...player};
    if (item.effect.hp) { p.hp = Math.min(p.maxHp, p.hp+item.effect.hp); toast('success',`使用「${item.name}」，恢复了 ${item.effect.hp} HP！`); }
    if (item.effect.mp) { p.mp = Math.min(p.maxMp, p.mp+item.effect.mp); toast('success',`使用「${item.name}」，恢复了 ${item.effect.mp} MP！`); }
    if (item.effect.atk_boost) { toast('info',`使用「${item.name}」，攻击力暂时提升 ${item.effect.atk_boost} 点！`); }
    setPlayer(p);
  },[inventory,player,toast]);

  const handleDiscardItem = useCallback((itemId) => {
    const newInv = {...inventory};
    newInv[itemId] = Math.max(0,(newInv[itemId]||0)-1);
    if (newInv[itemId]<=0) delete newInv[itemId];
    setInventory(newInv);
    toast('info',`丢弃了「${itemDatabase[itemId]?.name||itemId}」`);
  },[inventory,toast]);

  const handleEquipItem = useCallback((itemId) => {
    const item = itemDatabase[itemId]; if (!item?.equipable) return;
    const newInv = {...inventory};
    newInv[itemId] = Math.max(0,(newInv[itemId]||0)-1);
    if (newInv[itemId]<=0) delete newInv[itemId];

    const p = {...player, equipment:{...player.equipment}};
    const old = p.equipment[item.slot];
    if (old&&old.id) { newInv[old.id] = (newInv[old.id]||0)+1; }

    p.equipment[item.slot] = {...item};
    setInventory(newInv); setPlayer(p);
    toast('success',`装备了「${item.name}」`);
  },[inventory,player,toast]);

  const handleUnequipItem = useCallback((slot) => {
    const p = {...player, equipment:{...player.equipment}};
    const eq = p.equipment[slot]; if (!eq) return;
    const newInv = {...inventory};
    newInv[eq.id] = (newInv[eq.id]||0)+1;
    p.equipment[slot] = null;
    setInventory(newInv); setPlayer(p);
    toast('info',`卸下了「${eq.name}」`);
  },[inventory,player,toast]);

  // === NPC TRADE ===
  const handleTrade = useCallback((trade, npcId) => {
    if (!inventory[trade.give]||inventory[trade.give]<=0) { toast('warning','你没有所需的交易物品。'); return; }
    const newInv = {...inventory};
    newInv[trade.give]--;
    if (newInv[trade.give]<=0) delete newInv[trade.give];
    newInv[trade.receive] = (newInv[trade.receive]||0)+1;
    setInventory(newInv);
    toast('success',trade.dialog||`交易成功！`);
  },[inventory,toast]);

  // === SEND MESSAGE (keyword-dice + worldbook + style) ===
  const handleSend = useCallback(async (input) => {
    setStoryLog(prev=>[...prev,{role:'player',content:input}]); setIsLoading(true); setApiError('');
    setQuickReplies(null);

    // Dice: ONLY on explicit trigger keywords
    const diceKw=['探索','调查','战斗','攻击','潜行','偷','说服','恐吓','闪避','格斗','聆听','侦查','搜寻','跟踪','攀爬'];
    const shouldRoll=diceKw.some(k=>input.includes(k));
    const diceResult=shouldRoll?skillCheck(50):null;
    const actType=diceKw.some(k=>input.includes(k))?'exploration':'social';
    const diceResult=shouldRoll?skillCheck(50):null;
    const diceMsg=(diceResult&&autoSendDice)
      ?`\n[骰子:${diceResult.roll} vs 50→${diceResult.level==='extreme'?'极难成功':diceResult.level==='hard'?'困难成功':diceResult.level}]`
      :'';
    const autoDice=localStorage.getItem('llmgame_autodice')!=='false';

    // Build context: World Book + Writing Style
    const currentNode=mapNodes.find(n=>n.id===currentNodeId);
    const locName=currentNode?.name||'未知';
    const worldBookCtx=buildWorldBookContext(input,currentNodeId,null,gameTime);
    const style=localStorage.getItem('llmgame_style')||'';
    const stylePrompt=style?`\n【文风要求】${style}\n`:'\n【文风要求】简洁冷峻的日系叙事，每段2-4句，注重光影/声音/气味描写，控制200-400字。\n';
    const sysPrompt=`你是沉浸式文字冒险RPG《深渊边境》的GM。你负责主持日式黑暗奇幻风格的冒险故事。

【玩家角色】${buildPlayerPersona()}
【当前位置】${locName} | 【时间】第${gameTime.day}天 ${gameTime.period} | 【时段特征】${gameTime.period==='night'?'深渊力量达到顶峰，妖兽活性增强':gameTime.period==='evening'?'雾气重新聚拢，危险正在逼近':gameTime.period==='morning'?'晨光初现，雾气渐薄':'午后是边境最安静的时刻'}
${worldBookCtx}${stylePrompt}
【结构化输出格式】你必须严格按以下格式一次性回复：

[叙事]你的剧情叙述内容。根据当前地点、时间、NPC和世界设定原创剧情。
[变量]{"hp_change":0,"mp_change":0,"exp_gain":0,"items_gained":[],"flags":{}}
[选项]符合当前情境的选项1
[选项]符合当前情境的选项2
[选项]符合当前情境的选项3

【规则】
1. [叙事]中以第二人称「你」叙述，严格遵循文风要求
2. [叙事]内容必须基于当前位置「${locName}」、时间「第${gameTime.day}天${gameTime.period}」原创，拒绝套用模板
3. [选项]必须与当前位置和时间匹配——人在瀑布不能出现「去矿坑」选项，夜晚不能出现白天专属选项
4. [变量]根据剧情发展更新：战斗扣HP/MP，探索加EXP，获得物品
5. 涉及战斗/探索判定时，参考骰子结果调整叙述
6. 如与NPC对话，基于该NPC的人设和记忆作答
${diceMsg?`\n[本次骰子]${diceMsg}`:''}`;

    try {
      const cfg = getConfig();
      if (cfg.apiKey && apiEnabled) {
        const resp = await sendGameMessage({storyLog:[...storyLog,{role:'player',content:input}],playerInput:input,systemPrompt:sysPrompt});
        // Parse structured response: [叙事], [变量], [选项]
        const narrativeMatch=resp.match(/\[叙事\]([\s\S]*?)(?=\[变量\]|\[选项\]|$)/);
        const varsMatch=resp.match(/\[变量\]([\s\S]*?)(?=\[选项\]|\[叙事\]|$)/);
        const optionMatches=resp.match(/\[选项\](.*?)(?=\[选项\]|$)/gs)||[];
        const narrative=narrativeMatch?narrativeMatch[1].trim():resp;
        const options=optionMatches.map(o=>o.replace('[选项]','').trim()).filter(Boolean);
        // Apply variable updates
        try{if(varsMatch){const vars=JSON.parse(varsMatch[1].trim());if(vars.hp_change)setPlayer(p=>({...p,hp:Math.max(1,Math.min(p.maxHp,p.hp+vars.hp_change))}));if(vars.items_gained?.length){setInventory(pi=>{const ni={...pi};vars.items_gained.forEach(it=>{ni[it]=(ni[it]||0)+1});return ni;});vars.items_gained.forEach(it=>toast('success',`获得「${it}」`));}}}catch(e){}
        setQuickReplies(options.length>=2?options.slice(0,4):['继续向前探索','仔细观察周围环境','与附近的人交谈']);
        setStoryLog(prev=>[...prev,{role:'narrator',content:narrative,diceResult:diceResult&&diceResult.level!=='regular'?{...diceResult,label:'行动检定'}:null}]);
      } else {
        await new Promise(r=>setTimeout(r,500+Math.random()*800));
        const check=skillCheck(45+Math.floor(Math.random()*20));
        const eff=narrativeEffect(check,'exploration');
        const diceDisplay=shouldRoll?`\n[骰子·${['侦查','聆听','调查','探索'][Math.floor(Math.random()*4)]}检定→${check.roll}vs${check.skill}—${check.level==='extreme'?'极难成功':check.level==='hard'?'困难成功':check.level}]\n`:'';
        const locBasedOptions = (()=>{
          const loc=currentNodeId; const t=gameTime.period;
          const opts={
            crossroads:{morning:['向旧神社走去','查看石碑上的文字','与雾之老人交谈'],night:['回到据点','在黑暗中保持警惕','生起篝火等待天明']},
            shrine:{morning:['向巫女白询问神社的历史','调查祭坛上的异常','前往瀑布方向'],night:['在神社借宿一晚','帮助白维护结界','前往瀑布方向']},
            forest:{morning:['深入密林调查妖兽踪迹','采集草药','前往妖兽巢穴'],night:['在林中找一个安全的地方扎营','生火驱赶野兽','退回十字路口']},
            mine:{morning:['推开铁栅栏进入矿坑','在入口处调查足迹','向附近的老人打听矿坑的事'],night:['矿坑入口弥漫着不祥的气息——你确定要进入吗？','在入口处设置照明','退回十字路口']},
            waterfall:{morning:['穿过瀑布进入月隐之祠','调查瀑布的水源','返回神社向白报告'],night:['月光照在瀑布上泛着诡异的银光','在瀑布边冥想','返回神社']},
            cave:{morning:['握紧武器深入洞穴','在洞口设置陷阱','呼唤洞内的生物'],night:['洞内传来低沉的咆哮——夜晚进入极其危险','在洞穴附近设伏','退回密林']},
          };
          const locOpts=opts[loc]||opts.crossroads;
          return locOpts[t]||locOpts.morning;
        })();
        const sceneText = (currentNode?.desc||'').split('\n')[0];
        setStoryLog(prev=>[...prev,{role:'narrator',content:diceDisplay+sceneText+'\n'+locBasedOptions.map((o,i)=>`[选项]${o}`).join('\n'),diceResult:shouldRoll?{...check,label:'探索检定'}:null}]);
        setQuickReplies(locBasedOptions);
        if(Math.random()<0.2){const m=monsters[Math.floor(Math.random()*monsters.length)];setCombat({active:true,monster:{...m,hp:m.maxHp},playerState:{...player,hp:player.hp,mp:player.mp}});toast('warning',`遭遇了${m.name}！`);}
      }
    } catch(e) {
      setApiError(e.message);
      toast('danger','API调用失败，已切换至Mock模式');
      setApiEnabled(false);
    } finally { setIsLoading(false); }
  },[storyLog,player,toast,apiEnabled,currentNodeId,gameTime,autoSendDice]);

  // === MAP ===
  const handleTravel = useCallback((node) => {
    setCurrentNodeId(node.id); setScreen('story');
    const story = sceneStories[node.id]||node.desc;
    setStoryLog(prev=>[...prev,{role:'player',content:`前往「${node.name}」。`},{role:'narrator',content:story}]);
    toast('success',`到达「${node.name}」`);
    // Don't auto-open NPC dialog - let player choose to interact
  },[toast]);

  // === COMBAT ===
  const handleCombatAction = useCallback((type, data) => {
    setCombat(prev=>{if(!prev.active)return prev;
      const m={...prev.monster}, pl={...prev.playerState};
      let dmg=0;
      if (type==='attack') dmg=Math.max(1,Math.floor((player.baseStats.atk+Object.values(player.equipment).filter(Boolean).reduce((s,e)=>s+(e.stats?.atk||0),0))*(0.8+Math.random()*0.4)-m.def*0.3));
      else if (type==='skill'&&data.power) {dmg=Math.max(1,Math.floor((player.baseStats.atk+Object.values(player.equipment).filter(Boolean).reduce((s,e)=>s+(e.stats?.atk||0),0))*data.power-m.def*0.3));pl.mp-=data.cost||0;}
      else if (type==='skill'&&data.heal) {pl.hp=Math.min(player.maxHp,Math.floor(pl.hp+player.maxHp*data.heal));}
      m.hp=Math.max(0,m.hp-dmg);
      if (type!=='skill'||!data.heal) toast('info',`对 ${m.name} 造成 ${dmg} 点伤害！`);
      if (m.hp<=0) { toast('success',`击败了 ${m.name}！`);
        const lootItem = m.loot?.find(l=>Math.random()*100<parseFloat(l.chance));
        if (lootItem) { setInventory(pi=>{const ni={...pi};ni[lootItem.item]=(ni[lootItem.item]||0)+1;return ni;}); toast('success',`获得了「${itemDatabase[lootItem.item]?.name||lootItem.item}」！`); }
        return {active:false,monster:null,playerState:null}; }
      const mdmg=Math.max(1,Math.floor(m.atk*(0.8+Math.random()*0.4)-player.baseStats.def*0.2));
      pl.hp=Math.max(0,pl.hp-mdmg); toast('danger',`${m.name} 对你造成 ${mdmg} 点伤害！`);
      if (pl.hp<=0){toast('danger','你被击败了...');return {active:false,monster:null,playerState:null};}
      return {...prev,monster:m,playerState:pl};});
  },[player,toast]);

  const handleCreateNpc = useCallback((npc) => {
    setCustomNpcs(prev=>({...prev,[npc.id]:npc}));
    toast('success',`NPC「${npc.name}」已创建在 ${npc.location || 'crossroads'}。`);
  },[toast]);

  // === NPC CHAT (with thinking chain) ===
  const handleNpcChat = useCallback(async (npc, input, thinkingChain) => {
    setNpcChatLog(prev=>[...prev,{role:'player',content:input}]); setIsLoading(true);
    try {
      const cfg=getConfig();
      const wbCtx=buildWorldBookContext(input, currentNodeId, npc.id, gameTime);
      const sys=`你是NPC「${npc.name}」。${thinkingChain}\n【当前环境】${currentNodeId} | 第${gameTime.day}天${gameTime.period}\n${wbCtx}\n【要求】以第一人称「我」回答玩家。保持角色一致性。回复控制在100-200字。`;
      if (cfg.apiKey && apiEnabled) {
        const resp=await sendGameMessage({storyLog:[...npcChatLog,{role:'player',content:input}],playerInput:input,systemPrompt:sys});
        setNpcChatLog(prev=>[...prev,{role:'narrator',content:resp,npcName:npc.name}]);
      } else {
        await new Promise(r=>setTimeout(r,400+Math.random()*600));
        const mockReplies=[
          `${npc.name}看了你一眼。「${npc.dialogs?.greeting?.slice(0,50)||'嗯...你说得对。'}」`,
          `「有意思。」${npc.name}微微点了点头。`,
          `「我不确定该怎么回答这个问题。」${npc.name}若有所思地说，「但既然你问了...我觉得这不重要。」`,
        ];
        setNpcChatLog(prev=>[...prev,{role:'narrator',content:mockReplies[Math.floor(Math.random()*mockReplies.length)],npcName:npc.name}]);
      }
    } catch(e){toast('danger',e.message);} finally{setIsLoading(false);}
  },[npcChatLog,currentNodeId,gameTime,apiEnabled,toast]);

  return (
    <div className="app-container">
      <Sidebar screen={screen} setScreen={setScreen} invOpen={invOpen} setInvOpen={setInvOpen} setOpen={setSettingsOpen}
        searchOpen={searchOpen} setSearchOpen={setSearchOpen} npcCreatorOpen={npcCreatorOpen} setNpcCreatorOpen={setNpcCreatorOpen}
        profileOpen={profileOpen} setProfileOpen={setProfileOpen}
        quests={quests} onExport={handleExport} onImport={handleImport} />
      <div className="main-area">
        <Header player={player} gameTime={gameTime} setGameTime={setGameTime} hasApi={!!getConfig().apiKey} />
        <main className="content">
          {screen==='story'&&<StoryPanel storyLog={storyLog} playerInput={playerInput} setPlayerInput={setPlayerInput}
            onSend={handleSend} isLoading={isLoading} quickReplies={quickReplies}
            onQuickReply={(qr)=>{setQuickReplies(null);handleSend(qr);}} />}
          {apiError && (
            <div className="api-error-banner">
              <span>API Error: {apiError.slice(0,150)}</span>
              <button className="api-copy-btn" onClick={()=>{navigator.clipboard.writeText(apiError);toast('info','错误信息已复制到剪贴板');}}>复制错误</button>
              <button className="api-copy-btn" onClick={()=>{setApiError('');setApiEnabled(true);}}>重试</button>
            </div>
          )}
          {screen==='map'&&<MapPanel nodes={mapNodes} currentNodeId={currentNodeId} onTravel={handleTravel}
            onNpcInteract={(id)=>setNpcDialog(allNpcs[id])} npcsHere={allNpcs} />}
        </main>
      </div>
      <CombatModal combat={combat} onAction={handleCombatAction} onFlee={()=>{setCombat({active:false});toast('info','脱离了战斗');}} />
      <InventoryDrawer open={invOpen} onClose={()=>setInvOpen(false)} player={player} inventory={inventory}
        onUseItem={handleUseItem} onDiscardItem={handleDiscardItem} onEquipItem={handleEquipItem}
        onUnequipItem={handleUnequipItem} toast={toast} />
      <NPCDialog npc={npcDialog} onClose={()=>{setNpcDialog(null);setNpcChatLog([]);}} onTrade={handleTrade}
        onAcceptQuest={(q)=>{toast('success',`接受了委托「${q.name}」`);}}
        playerQuests={quests} toast={toast} playerInput={npcChatInput} setPlayerInput={setNpcChatInput}
        onNpcChat={handleNpcChat} npcChatLog={npcChatLog} isLoading={isLoading} />
      <DiceRoller open={diceOpen} onClose={()=>setDiceOpen(false)} player={player} />
      <NPCCreator open={npcCreatorOpen} onClose={()=>setNpcCreatorOpen(false)} onCreateNpc={handleCreateNpc} gameNpcs={customNpcs} />
      <SearchPanel open={searchOpen} onClose={()=>setSearchOpen(false)} toast={toast} />
      <CharacterCreation open={charOpen} onClose={()=>setCharOpen(false)}
        onCreate={(newChar)=>{setPlayer({...newChar,equipment:{weapon:null,armor:null,accessory:null},hp:newChar.maxHp,mp:newChar.maxMp});setInventory({...startingInventory});setStoryLog([{role:'narrator',content:`欢迎，${newChar.name}。你踏入了深渊边境的迷雾之中，一段全新的冒险即将开始。\n\n雾中隐约可见一个三岔路口。远处有一座旧神社的鸟居轮廓。你的故事，从此刻开始书写。`}]);setCurrentNodeId('crossroads');setScreen('story');}}
        toast={toast} />
      {showVars && <VariablePanel player={player} inventory={inventory} currentNodeId={currentNodeId} gameTime={gameTime} storyLog={storyLog} onClose={()=>setShowVars(false)} />}
      {worldBookOpen && <WorldBookEditor open={worldBookOpen} onClose={()=>setWorldBookOpen(false)} toast={toast} />}
      <SettingsModal open={settingsOpen} onClose={()=>setSettingsOpen(false)} toast={toast} />
        <PlayerProfile open={profileOpen} onClose={()=>setProfileOpen(false)} toast={toast} />
        <Tutorial open={tutorialOpen} onClose={()=>{setTutorialOpen(false);localStorage.setItem('llmgame_tutorial_done','1');}} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
