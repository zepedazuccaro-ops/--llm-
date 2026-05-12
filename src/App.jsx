import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Menu, Swords, Map, BookOpen, Backpack, Settings, Send, X, Heart, Zap, Star, Crosshair, Shield, Swords as Atk, Footprints, Sparkles, FlaskRound, Droplets, Key, Diamond, UtensilsCrossed, Gem, Flame, Skull, Bug, CloudFog, Wind, Snowflake, Sword, Package, Circle, MapPin, User, Heart as HeartIcon, Trash2, Wrench, Plus, Search, Globe, Eye, UserPlus, RefreshCw, Download, Upload, Dices, Users, Clock } from 'lucide-react';
import './App.css';
import { playerData, itemDatabase, startingInventory, mapNodes, npcs, monsters, playerSkills, sampleStoryLog, quests, sceneStories } from './data/mock.js';
import { sendGameMessage, getConfig, updateConfig, loadConfig } from './api/llm.js';
import { mainStory, branches, talents, canTakeTalent } from './data/storyline.js';
import { initGameTime } from './systems/clock.js';
import { createSave, exportSave, importSaveFile, validateSave } from './systems/save.js';
import ClockDisplay from './components/ClockDisplay.jsx';
import DiceRoller from './components/DiceRoller.jsx';
import NPCCreator from './components/NPCCreator.jsx';

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

// === STORY PANEL ===
function StoryPanel({ storyLog, playerInput, setPlayerInput, onSend, isLoading }) {
  const endRef = useRef(null), ripple = useRipple();
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [storyLog]);

  const send = () => { if (!playerInput.trim() || isLoading) return; onSend(playerInput.trim()); setPlayerInput(''); };

  return (
    <div className="story-panel">
      <div className="story-log">
        {storyLog.map((e,i) => (
          <div key={i} className={`story-entry ${e.role}`} style={{animation:`fadeInUp var(--duration-normal) var(--ease-out-expo) forwards`,animationDelay:`${i*25}ms`,opacity:0}}>
            <div className={`entry-wrap ${e.role}`}>
              <div className="entry-label">{e.role==='narrator'?'GM':'你'}</div>
              <div className="entry-content">{e.content.split('\n').map((l,j)=><p key={j}>{l||' '}</p>)}</div>
            </div>
          </div>
        ))}
        {isLoading && <div className="story-entry narrator"><div className="entry-wrap narrator"><div className="entry-label">GM</div><div className="entry-content"><span className="typewriter-cursor">思考中</span></div></div></div>}
        <div ref={endRef} />
      </div>
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

// === NPC DIALOG MODAL ===
function NPCDialog({ npc, onClose, onTrade, onAcceptQuest, playerQuests, toast }) {
  if (!npc) return null;
  const [topic, setTopic] = useState('greeting'), [shownTopics, setShownTopics] = useState(new Set()), ripple = useRipple();
  const dialogText = topic==='greeting'?npc.dialogs.greeting:npc.dialogs.topics[topic]||'（NPC沉默不语）';

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
        </div>
      </div>
    </div>
  );
}

// === SEARCH PANEL ===
function SearchPanel({ open, onClose, toast }) {
  if (!open) return null;
  const [query, setQuery] = useState(''), [results, setResults] = useState(null), [loading, setLoading] = useState(false), ripple = useRipple();

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query+' 天启预报 novel')}`);
      const text = await res.text();
      const snippets = text.match(/class="result__snippet"[^>]*>(.*?)<\/a>/gi)||[];
      const items = snippets.slice(0,5).map((s,i)=>{
        const clean = s.replace(/<[^>]+>/g,'').slice(0,200);
        return {title:`结果 ${i+1}`,snippet:clean,url:''};
      });
      setResults(items.length?items:[{title:'未找到结果',snippet:'尝试更换搜索词或检查网络连接。'}]);
    } catch(e) {
      setResults([{title:'搜索失败',snippet:e.message}]);
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
              {results.map((r,i)=><div key={i} className="search-item glass-light">
                <h4>{r.title}</h4><p>{r.snippet}</p>
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
  const [name, setName] = useState(''), [pts, setPts] = useState(15);
  const [stats, setStats] = useState({atk:5,def:5,spd:5,int:5,luk:5});
  const ripple = useRipple();

  const adjust = (key, delta) => {
    if (pts-delta<0||stats[key]+delta<1||stats[key]+delta>20) return;
    setStats(prev=>({...prev,[key]:prev[key]+delta})); setPts(prev=>prev-delta);
  };

  const create = () => {
    if (!name.trim()) { toast('warning','请输入角色名称'); return; }
    onCreate({ name:name.trim(), baseStats:{...stats}, title:'冒险者 · 新手', level:1, hp:200, maxHp:200, mp:50, maxMp:50, exp:0, expToNext:100,
      equipment:{weapon:null,armor:null,accessory:null} });
    toast('success',`角色「${name.trim()}」创建成功！`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="settings-modal glass modal-content">
        <div className="drawer-header"><h3><UserPlus size={18}/>创建新角色</h3><button className="btn-close" onClick={onClose}><X size={16}/></button></div>
        <div className="settings-body">
          <label className="setting-label">角色名称</label>
          <input className="setting-input" value={name} onChange={e=>setName(e.target.value)} placeholder="输入你的角色名..." />
          <label className="setting-label">属性分配 (剩余点数: {pts})</label>
          <div className="stat-alloc">
            {Object.entries(stats).map(([k,v])=><div key={k} className="alloc-row">
              <span className="alloc-label">{k==='atk'?'攻击':k==='def'?'防御':k==='spd'?'速度':k==='int'?'智力':'幸运'}</span>
              <button className="alloc-btn ripple-container" onClick={e=>{ripple(e);adjust(k,-1);}}>-</button>
              <span className="alloc-val">{v}</span>
              <button className="alloc-btn ripple-container" onClick={e=>{ripple(e);adjust(k,1);}}>+</button>
            </div>)}
          </div>
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
  const [ep, setEp] = useState(cfg.endpoint), [key, setKey] = useState(cfg.apiKey), [mdl, setMdl] = useState(cfg.model), ripple = useRipple();

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="settings-modal glass modal-content" style={{maxWidth:460}}>
        <div className="drawer-header"><h3><Settings size={18}/>LLM API 设置</h3><button className="btn-close" onClick={onClose}><X size={16}/></button></div>
        <div className="settings-body">
          <label className="setting-label">API 端点</label><input className="setting-input" value={ep} onChange={e=>setEp(e.target.value)}/>
          <label className="setting-label">API Key</label><input className="setting-input" type="password" value={key} onChange={e=>setKey(e.target.value)}/>
          <label className="setting-label">模型</label><input className="setting-input" value={mdl} onChange={e=>setMdl(e.target.value)}/>
          <button className="btn-save ripple-container" onClick={e=>{ripple(e);updateConfig({endpoint:ep,apiKey:key,model:mdl});toast('success','设置已保存');onClose();}}>保存配置</button>
          <p className="settings-hint">默认 DeepSeek API。也可使用 OpenAI-compatible 端点。API Key 仅存储于浏览器本地。</p>
        </div>
      </div>
    </div>
  );
}

// === SIDEBAR ===
function Sidebar({ screen, setScreen, invOpen, setInvOpen, setOpen, searchOpen, setSearchOpen, charOpen, setCharOpen, diceOpen, setDiceOpen, npcCreatorOpen, setNpcCreatorOpen, quests, onExport, onImport }) {
  return (
    <aside className="sidebar glass">
      <div className="sidebar-logo"><BookOpen size={20}/><span className="logo-text">深渊手札</span></div>
      <nav className="sidebar-nav">
        <button className={`nav-btn ripple-container ${screen==='story'?'active':''}`} onClick={()=>setScreen('story')}><BookOpen size={18}/><span>故事</span></button>
        <button className={`nav-btn ripple-container ${screen==='map'?'active':''}`} onClick={()=>setScreen('map')}><Map size={18}/><span>地图</span></button>
        <button className={`nav-btn ripple-container ${invOpen?'active':''}`} onClick={()=>setInvOpen(true)}><Backpack size={18}/><span>背包</span></button>
        <button className="nav-btn ripple-container" onClick={()=>setDiceOpen(true)}><Dices size={18}/><span>骰子</span></button>
        <button className="nav-btn ripple-container" onClick={()=>setSearchOpen(true)}><Globe size={18}/><span>搜索</span></button>
      </nav>
      <div className="sidebar-actions">
        <button className="nav-btn ripple-container" onClick={onExport}><Download size={16}/><span>导出存档</span></button>
        <button className="nav-btn ripple-container" onClick={onImport}><Upload size={16}/><span>导入存档</span></button>
        <button className="nav-btn ripple-container" onClick={()=>setNpcCreatorOpen(true)}><Users size={16}/><span>创建NPC</span></button>
        <button className="nav-btn ripple-container" onClick={()=>setCharOpen(true)}><UserPlus size={16}/><span>新角色</span></button>
      </div>
      <div className="sidebar-quests"><div className="quests-title">任务</div>
        {quests.map(q=><div key={q.id} className={`quest-item ${q.status}`}><div className="quest-name">{q.name}</div><div className="quest-progress">{q.progress}</div></div>)}
      </div>
      <div className="sidebar-footer"><button className="nav-btn ripple-container" onClick={()=>setOpen(true)}><Settings size={16}/><span>API设置</span></button></div>
    </aside>
  );
}

// === HEADER ===
function Header({ player, gameTime, setGameTime }) {
  return (
    <header className="header glass-light">
      <div className="header-left">
        <div className="player-badge"><div className="player-avatar-sm">{player.name[0]}</div><div><span className="player-name-sm">{player.name}</span><span className="player-title-sm">{player.title}</span></div></div>
      </div>
      <ClockDisplay gameTime={gameTime} setGameTime={setGameTime} />
      <div className="header-stats">
        <div className="header-stat"><Heart size={14} color="var(--danger)"/><span>{player.hp}/{player.maxHp}</span></div>
        <div className="header-stat"><Zap size={14} color="#7b8fba"/><span>{player.mp}/{player.maxMp}</span></div>
        <div className="header-stat"><Star size={14} color="var(--warning)"/><span>Lv.{player.level}</span></div>
      </div>
    </header>
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

  // === SEND MESSAGE ===
  const handleSend = useCallback(async (input) => {
    setStoryLog(prev=>[...prev,{role:'player',content:input}]); setIsLoading(true);
    try {
      const cfg = getConfig();
      if (cfg.apiKey) {
        const resp = await sendGameMessage({storyLog:[...storyLog,{role:'player',content:input}],playerInput:input});
        setStoryLog(prev=>[...prev,{role:'narrator',content:resp}]);
      } else {
        await new Promise(r=>setTimeout(r,600+Math.random()*1000));
        const mocks = [
          '你沿着小径继续前行。雾气似乎更浓了，在脚踝的高度翻滚涌动。远处的树影在雾中若隐若现。\n\n一阵凉风拂过，带来了远处隐约的金属碰撞声——是矿坑的方向。也可能是别的什么。\n\n[选项] 朝矿坑方向前进\n[选项] 在附近搜索隐藏的路径\n[选项] 停下来仔细观察周围的痕迹',
          '脚下的碎石在寂静中发出清脆的响声。路边的石碑上刻着已经模糊不清的文字。\n\n弯下腰，你用手指轻轻拂去碑面的泥土。隐约可以辨认出几个字：「……者，勿……前……」——这是一块警示碑。\n\n[选项] 继续无视警告向前\n[选项] 仔细拓印石碑内容\n[选项] 绕路从旁边的树林穿过',
        ];
        setStoryLog(prev=>[...prev,{role:'narrator',content:mocks[Math.floor(Math.random()*mocks.length)]}]);
        if (Math.random()<0.25) { const m=monsters[Math.floor(Math.random()*monsters.length)];
          setCombat({active:true,monster:{...m,hp:m.maxHp},playerState:{...player,hp:player.hp,mp:player.mp}}); toast('warning',`遭遇了 ${m.name}！`); }
      }
    } catch(e) { toast('danger',`${e.message}`); }
    finally { setIsLoading(false); }
  },[storyLog,player,toast]);

  // === MAP ===
  const handleTravel = useCallback((node) => {
    setCurrentNodeId(node.id); setScreen('story');
    const story = sceneStories[node.id]||node.desc;
    setStoryLog(prev=>[...prev,{role:'player',content:`前往「${node.name}」。`},{role:'narrator',content:story}]);
    toast('success',`到达「${node.name}」`);
    if (node.npcHere) { setNpcDialog(npcs[node.npcHere]); }
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
    toast('success',`NPC「${npc.name}」已创建在 ${npc.location}。`);
  },[toast]);

  return (
    <div className="app-container">
      <Sidebar screen={screen} setScreen={setScreen} invOpen={invOpen} setInvOpen={setInvOpen} setOpen={setSettingsOpen}
        searchOpen={searchOpen} setSearchOpen={setSearchOpen} charOpen={charOpen} setCharOpen={setCharOpen}
        diceOpen={diceOpen} setDiceOpen={setDiceOpen} npcCreatorOpen={npcCreatorOpen} setNpcCreatorOpen={setNpcCreatorOpen}
        quests={quests} onExport={handleExport} onImport={handleImport} />
      <div className="main-area">
        <Header player={player} gameTime={gameTime} setGameTime={setGameTime} />
        <main className="content">
          {screen==='story'&&<StoryPanel storyLog={storyLog} playerInput={playerInput} setPlayerInput={setPlayerInput}
            onSend={handleSend} isLoading={isLoading} />}
          {screen==='map'&&<MapPanel nodes={mapNodes} currentNodeId={currentNodeId} onTravel={handleTravel}
            onNpcInteract={(id)=>setNpcDialog(allNpcs[id])} npcsHere={allNpcs} />}
        </main>
      </div>
      <CombatModal combat={combat} onAction={handleCombatAction} onFlee={()=>{setCombat({active:false});toast('info','脱离了战斗');}} />
      <InventoryDrawer open={invOpen} onClose={()=>setInvOpen(false)} player={player} inventory={inventory}
        onUseItem={handleUseItem} onDiscardItem={handleDiscardItem} onEquipItem={handleEquipItem}
        onUnequipItem={handleUnequipItem} toast={toast} />
      <NPCDialog npc={npcDialog} onClose={()=>setNpcDialog(null)} onTrade={handleTrade}
        onAcceptQuest={(q)=>{toast('success',`接受了委托「${q.name}」`);}}
        playerQuests={quests} toast={toast} />
      <DiceRoller open={diceOpen} onClose={()=>setDiceOpen(false)} player={player} />
      <NPCCreator open={npcCreatorOpen} onClose={()=>setNpcCreatorOpen(false)} onCreateNpc={handleCreateNpc} gameNpcs={customNpcs} />
      <SearchPanel open={searchOpen} onClose={()=>setSearchOpen(false)} toast={toast} />
      <CharacterCreation open={charOpen} onClose={()=>setCharOpen(false)}
        onCreate={(newChar)=>{setPlayer({...newChar,equipment:{weapon:null,armor:null,accessory:null},hp:newChar.maxHp,mp:newChar.maxMp});setInventory({...startingInventory});setStoryLog([{role:'narrator',content:`欢迎，${newChar.name}。你踏入了深渊边境的迷雾之中，一段全新的冒险即将开始。\n\n雾中隐约可见一个三岔路口。远处有一座旧神社的鸟居轮廓。你的故事，从此刻开始书写。`}]);setCurrentNodeId('crossroads');setScreen('story');}}
        toast={toast} />
      <SettingsModal open={settingsOpen} onClose={()=>setSettingsOpen(false)} toast={toast} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
