import { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { Menu, Swords, Map, BookOpen, Backpack, Settings, Send, X, ChevronRight, Heart, Zap, Star, Crosshair, Shield, Swords as Atk, Footprints, Sparkles, FlaskRound, Droplets, Key, Diamond, UtensilsCrossed, Gem, Flame, Skull, Bug, CloudFog, Wind, Snowflake, Sword, Package, ChevronUp, MapPin, Circle } from 'lucide-react';
import './App.css';
import { playerData, mapNodes, monsters, playerSkills, sampleStoryLog, quests } from './data/mock.js';
import { sendGameMessage, getConfig, updateConfig, loadConfig } from './api/llm.js';

// ==================== GAME CONTEXT ====================
const GameContext = createContext(null);
function useGame() { return useContext(GameContext); }

// ==================== UTILITY HOOKS ====================
function useRipple() {
  const ripples = useRef([]);
  const createRipple = useCallback((e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `left:${x}px;top:${y}px;position:absolute;border-radius:50%;background:rgba(255,255,255,0.15);transform:scale(0);animation:ripple 0.6s linear;pointer-events:none;`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }, []);
  return createRipple;
}

// ==================== TOAST SYSTEM ====================
let toastId = 0;
function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
      {toasts.map(t => (
        <div key={t.id}
          className={`glass-light toast-item`}
          style={{
            padding: '10px 18px', borderRadius: 'var(--radius-md)',
            fontSize: 13, fontWeight: 500, color: 'var(--text-bright)',
            minWidth: 200, maxWidth: 340,
            borderLeft: `3px solid ${t.type === 'danger' ? 'var(--danger)' : t.type === 'success' ? 'var(--success)' : t.type === 'warning' ? 'var(--warning)' : 'var(--accent)'}`,
            animation: 'slideInRight var(--duration-normal) var(--ease-out-expo) forwards',
            pointerEvents: 'auto', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between'
          }}
          onClick={() => removeToast(t.id)}
        >
          <span>{t.icon && <span style={{marginRight:8}}>{t.icon}</span>}{t.message}</span>
          <X size={14} style={{opacity:0.5, flexShrink:0}} />
        </div>
      ))}
    </div>
  );
}

// ==================== STORY PANEL ====================
function StoryPanel({ storyLog, playerInput, setPlayerInput, onSend, isLoading }) {
  const logEndRef = useRef(null);
  const ripple = useRipple();

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [storyLog]);

  const handleSend = () => {
    if (!playerInput.trim() || isLoading) return;
    onSend(playerInput.trim());
    setPlayerInput('');
  };

  return (
    <div className="story-panel">
      <div className="story-log">
        {storyLog.map((entry, i) => (
          <div key={i} className={`story-entry ${entry.role}`} style={{animation: `fadeInUp var(--duration-normal) var(--ease-out-expo) forwards`, animationDelay: `${i * 30}ms`, opacity: 0}}>
            {entry.role === 'narrator' ? (
              <div className="entry-narrator">
                <div className="entry-label">GM</div>
                <div className="entry-content">
                  {entry.content.split('\n').map((line, j) => (
                    <p key={j}>{line || ' '}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="entry-player">
                <div className="entry-label">你</div>
                <p>{entry.content}</p>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="story-entry narrator">
            <div className="entry-narrator">
              <div className="entry-label">GM</div>
              <div className="entry-content">
                <span className="typewriter-cursor">思考中</span>
              </div>
            </div>
          </div>
        )}
        <div ref={logEndRef} />
      </div>
      <div className="story-input-area glass-light">
        <input
          id="player-input"
          className="player-input"
          value={playerInput}
          onChange={e => setPlayerInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="输入你的行动..."
          disabled={isLoading}
        />
        <button id="btn-send" className="btn-send ripple-container" onClick={e => { ripple(e); handleSend(); }} disabled={isLoading}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ==================== MAP PANEL ====================
function MapPanel({ nodes, currentNodeId, onTravel, toast }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const ripple = useRipple();

  const currentNode = nodes.find(n => n.id === currentNodeId);
  const connectedIds = currentNode?.connections || [];

  const handleTravel = (node) => {
    if (node.status === 'unexplored' || node.id !== currentNodeId) {
      onTravel(node);
    }
  };

  return (
    <div className="map-panel">
      <div className="map-header">
        <h2>深渊边境 · 探索地图</h2>
        <p className="map-subtitle">{currentNode?.name} — {currentNode?.desc?.slice(0,40)}...</p>
      </div>
      <div className="map-grid">
        {nodes.map(node => {
          const isConnected = connectedIds.includes(node.id) || node.id === currentNodeId;
          const isCurrent = node.id === currentNodeId;
          const isExplored = node.status === 'explored';

          return (
            <div key={node.id}
              className={`map-node ${node.type} ${isCurrent ? 'current' : ''} ${isExplored ? 'explored' : ''} ${!isConnected ? 'disconnected' : ''}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onClick={() => isConnected && setSelectedNode(node)}
              onMouseEnter={() => isConnected && setSelectedNode(node)}
            >
              <div className={`node-marker ${isCurrent ? 'node-current' : ''}`}>
                {isCurrent ? <Circle size={12} fill="var(--accent)" color="var(--accent)" /> :
                 isExplored ? <Circle size={10} color="var(--text-dim)" /> :
                 <Circle size={10} color="var(--text-dim)" style={{opacity:0.3}} />}
              </div>
              <span className={`node-label ${isCurrent ? 'active' : ''}`}>{node.name}</span>

              {/* Tooltip */}
              {selectedNode?.id === node.id && (
                <div className="node-tooltip glass" style={{animation: 'fadeInUp var(--duration-fast) var(--ease-out-expo) forwards'}}>
                  <div className="tooltip-header">
                    <span className={`node-badge ${node.type}`}>
                      {node.type === 'hub' ? '据点' : node.type === 'dungeon' ? '遗迹' : node.type === 'wild' ? '野外' : '危险'}
                    </span>
                    <span className={`node-badge status ${node.status}`}>
                      {node.status === 'current' ? '当前位置' : node.status === 'explored' ? '已探索' : '未探索'}
                    </span>
                  </div>
                  <p className="tooltip-desc">{node.desc}</p>
                  <div className="tooltip-connects">
                    <Footprints size={12} />
                    <span>可前往: {node.connections.map(c => nodes.find(n => n.id === c)?.name || c).join(' / ')}</span>
                  </div>
                  {isConnected && node.id !== currentNodeId && (
                    <button className="btn-travel ripple-container" onClick={e => { ripple(e); handleTravel(node); }}>
                      <MapPin size={14} /> 前往此处
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Connection lines rendered as SVG */}
        <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {nodes.flatMap(node =>
            node.connections.map(connId => {
              const conn = nodes.find(n => n.id === connId);
              if (!conn) return null;
              return (
                <line key={`${node.id}-${connId}`}
                  x1={node.x} y1={node.y} x2={conn.x} y2={conn.y}
                  stroke={conn.status === 'explored' || conn.id === currentNodeId ? 'rgba(112,148,186,0.3)' : 'rgba(255,255,255,0.06)'}
                  strokeWidth="0.2"
                  strokeDasharray={conn.status === 'explored' ? 'none' : '0.8,0.8'}
                />
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
}

// ==================== COMBAT MODAL ====================
function CombatModal({ combat, onAction, onFlee, toast }) {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [turnLog, setTurnLog] = useState([]);
  const ripple = useRipple();

  if (!combat?.active) return null;

  const { monster } = combat;
  const player = combat.playerState;
  const monsterHpPct = (monster.hp / monster.maxHp * 100).toFixed(0);
  const playerHpPct = (player.hp / player.maxHp * 100).toFixed(0);

  const handleAction = (type, data) => {
    const msg = type === 'attack' ? '你发动了普通攻击！' :
                type === 'skill' ? `你使用了「${data.name}」！` :
                type === 'item' ? `你使用了「${data.name}」！` : '';
    setTurnLog(prev => [...prev, { role: 'player', msg }].slice(-6));
    onAction(type, data);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && null}>
      <div className="combat-modal glass modal-content">
        <div className="combat-header">
          <Swords size={18} />
          <h3>战斗</h3>
          <button className="btn-close" onClick={onFlee}><X size={16} /></button>
        </div>

        <div className="combat-body">
          {/* Monster Card */}
          <div className="monster-card glass-light">
            <div className="monster-icon">
              {monster.icon === 'Flame' ? <Flame size={32} /> :
               monster.icon === 'Skull' ? <Skull size={32} /> :
               monster.icon === 'Bug' ? <Bug size={32} /> : <CloudFog size={32} />}
            </div>
            <div className="monster-info">
              <h4>{monster.name}</h4>
              <div className="monster-tags">
                {monster.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
              </div>
              <div className="hp-bar-container">
                <div className="hp-bar" style={{width: `${monsterHpPct}%`, background: monsterHpPct < 30 ? 'var(--danger)' : 'var(--danger-dim)'}} />
                <span className="hp-text">{monster.hp} / {monster.maxHp}</span>
              </div>
              <div className="monster-stats">
                <span><Atk size={12} /> ATK {monster.atk}</span>
                <span><Shield size={12} /> DEF {monster.def}</span>
                <span><Footprints size={12} /> SPD {monster.spd}</span>
              </div>
            </div>
          </div>

          {/* Player Status */}
          <div className="player-status glass-light">
            <div className="status-row">
              <span className="status-label">{player.name}</span>
              <span className="status-level">Lv.{player.level}</span>
            </div>
            <div className="status-bars">
              <div className="hp-bar-container small">
                <div className="hp-bar" style={{width: `${playerHpPct}%`, background: playerHpPct < 25 ? 'var(--danger)' : 'var(--accent)', animation: playerHpPct < 20 ? 'hpWarning 0.8s infinite' : 'none'}} />
                <span className="hp-text">HP {player.hp}/{player.maxHp}</span>
              </div>
              <div className="hp-bar-container small mp">
                <div className="hp-bar" style={{width: `${(player.mp/player.maxMp*100).toFixed(0)}%`, background: '#7b8fba'}} />
                <span className="hp-text">MP {player.mp}/{player.maxMp}</span>
              </div>
            </div>
          </div>

          {/* Combat Log */}
          {turnLog.length > 0 && (
            <div className="combat-log glass-light">
              {turnLog.map((l, i) => (
                <p key={i} className={l.role}>{l.msg}</p>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="combat-actions">
            <button className="btn-combat ripple-container" onClick={e => { ripple(e); handleAction('attack'); }}>
              <Sword size={15} /><span>攻击</span>
            </button>
            <div className="skills-group">
              {playerSkills.map(skill => (
                <button key={skill.id} className={`btn-combat skill ripple-container ${selectedSkill === skill.id ? 'selected' : ''}`}
                  onClick={e => { ripple(e); setSelectedSkill(skill.id); handleAction('skill', skill); }}
                  disabled={player.mp < skill.cost}>
                  {skill.icon === 'Snowflake' ? <Snowflake size={14} /> :
                   skill.icon === 'Wind' ? <Wind size={14} /> : <Sword size={14} />}
                  <span>{skill.name}</span>
                  {skill.cost > 0 && <span className="skill-cost">{skill.cost}MP</span>}
                </button>
              ))}
            </div>
            <button className="btn-combat item" onClick={e => { ripple(e); handleAction('item', { name: '回复药·小' }); }}>
              <FlaskRound size={15} /><span>物品</span>
            </button>
            <button className="btn-combat flee" onClick={e => { ripple(e); onFlee(); }}>
              <Footprints size={15} /><span>撤退</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== INVENTORY DRAWER ====================
function InventoryDrawer({ open, onClose, player, toast }) {
  if (!open) return null;
  const ripple = useRipple();

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="inventory-drawer glass" style={{animation: 'slideInRight var(--duration-slow) var(--ease-out-expo) forwards'}}>
        <div className="drawer-header">
          <h3><Backpack size={18} /> 角色与背包</h3>
          <button className="btn-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="drawer-body">
          {/* Character Stats */}
          <div className="char-card glass-light">
            <div className="char-header">
              <div className="char-avatar">{player.name[0]}</div>
              <div>
                <h4>{player.name}</h4>
                <p className="char-title">{player.title}</p>
              </div>
              <div className="char-level">Lv.{player.level}</div>
            </div>
            <div className="char-stats-grid">
              {Object.entries(player.stats).map(([key, val]) => (
                <div key={key} className="stat-item">
                  <span className="stat-icon">
                    {key === 'atk' ? <Atk size={14} /> : key === 'def' ? <Shield size={14} /> :
                     key === 'spd' ? <Footprints size={14} /> : key === 'int' ? <Sparkles size={14} /> : <Star size={14} />}
                  </span>
                  <span className="stat-key">{key === 'atk' ? '攻击' : key === 'def' ? '防御' : key === 'spd' ? '速度' : key === 'int' ? '智力' : '幸运'}</span>
                  <span className="stat-val">{val}</span>
                </div>
              ))}
            </div>
            <div className="exp-bar-container">
              <div className="exp-bar" style={{width: `${(player.exp/player.expToNext*100).toFixed(0)}%`}} />
              <span className="exp-text">EXP {player.exp}/{player.expToNext}</span>
            </div>
          </div>

          {/* Equipment */}
          <div className="section-title">装备</div>
          <div className="equip-grid">
            {player.equipment.map((eq, i) => (
              <div key={i} className={`equip-slot rarity-${eq.rarity} glass-light`}>
                {eq.icon === 'Sword' ? <Sword size={16} /> : eq.icon === 'Shield' ? <Shield size={16} /> : <Gem size={16} />}
                <div className="equip-info">
                  <span className="equip-name">{eq.name}</span>
                  <span className="equip-rarity">{eq.rarity === 'rare' ? '稀有' : '普通'}</span>
                </div>
                <div className="equip-tooltip glass">{eq.desc}</div>
              </div>
            ))}
          </div>

          {/* Inventory Grid */}
          <div className="section-title">物品</div>
          <div className="item-grid">
            {player.inventory.map(item => {
              const IconComp = {
                FlaskRound, Droplets, UtensilsCrossed, Key, Map, Diamond
              }[item.icon] || Package;
              return (
                <div key={item.id} className={`item-slot rarity-${item.rarity} glass-light`}>
                  <IconComp size={20} />
                  {item.qty > 1 && <span className="item-qty">{item.qty}</span>}
                  <div className="item-tooltip glass">
                    <h5 style={{color: 'var(--text-bright)', marginBottom: 4}}>{item.name}</h5>
                    <p style={{fontSize: 12}}>{item.desc}</p>
                    {item.rarity !== 'common' && (
                      <span className={`rarity-tag ${item.rarity}`}>
                        {item.rarity === 'legendary' ? '传奇' : item.rarity === 'rare' ? '稀有' : '精良'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SETTINGS MODAL ====================
function SettingsModal({ open, onClose, toast }) {
  if (!open) return null;
  const cfg = getConfig();
  const [endpoint, setEndpoint] = useState(cfg.endpoint);
  const [apiKey, setApiKey] = useState(cfg.apiKey);
  const [model, setModel] = useState(cfg.model);
  const ripple = useRipple();

  const handleSave = () => {
    updateConfig({ endpoint, apiKey, model });
    toast('success', '设置已保存，下次对话生效。');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="settings-modal glass modal-content" style={{maxWidth: 460}}>
        <div className="drawer-header">
          <h3><Settings size={18} /> LLM API 设置</h3>
          <button className="btn-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="settings-body">
          <label className="setting-label">API 端点</label>
          <input className="setting-input" value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://api.deepseek.com/anthropic" />
          <label className="setting-label">API Key</label>
          <input className="setting-input" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." />
          <label className="setting-label">模型名称</label>
          <input className="setting-input" value={model} onChange={e => setModel(e.target.value)} placeholder="deepseek-v4-pro[1m]" />
          <button className="btn-save ripple-container" onClick={e => { ripple(e); handleSave(); }}>
            保存配置
          </button>
          <p className="settings-hint">默认使用 DeepSeek Anthropic-compatible API。也支持 OpenAI-compatible 端点。API Key 仅存储在浏览器本地。</p>
        </div>
      </div>
    </div>
  );
}

// ==================== SIDEBAR ====================
function Sidebar({ activeScreen, setActiveScreen, inventoryOpen, setInventoryOpen, settingsOpen, setSettingsOpen, quests }) {
  return (
    <aside className="sidebar glass">
      <div className="sidebar-logo">
        <BookOpen size={20} />
        <span className="logo-text">深渊手札</span>
      </div>
      <nav className="sidebar-nav">
        <button className={`nav-btn ripple-container ${activeScreen === 'story' ? 'active' : ''}`} onClick={() => setActiveScreen('story')}>
          <BookOpen size={18} /><span>故事</span>
        </button>
        <button className={`nav-btn ripple-container ${activeScreen === 'map' ? 'active' : ''}`} onClick={() => setActiveScreen('map')}>
          <Map size={18} /><span>地图</span>
        </button>
        <button className={`nav-btn ripple-container ${inventoryOpen ? 'active' : ''}`} onClick={() => setInventoryOpen(true)}>
          <Backpack size={18} /><span>背包</span>
        </button>
      </nav>

      {/* Quest tracker */}
      <div className="sidebar-quests">
        <div className="quests-title">任务</div>
        {quests.map(q => (
          <div key={q.id} className={`quest-item ${q.status}`}>
            <div className="quest-name">{q.name}</div>
            <div className="quest-progress">{q.progress}</div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="nav-btn ripple-container" onClick={() => setSettingsOpen(true)}>
          <Settings size={16} /><span>API设置</span>
        </button>
      </div>
    </aside>
  );
}

// ==================== HEADER ====================
function Header({ player }) {
  return (
    <header className="header glass-light">
      <div className="header-left">
        <div className="player-badge">
          <div className="player-avatar-sm">{player.name[0]}</div>
          <div>
            <span className="player-name-sm">{player.name}</span>
            <span className="player-title-sm">{player.title}</span>
          </div>
        </div>
      </div>
      <div className="header-stats">
        <div className="header-stat"><Heart size={14} color="var(--danger)" /><span>{player.hp}/{player.maxHp}</span></div>
        <div className="header-stat"><Zap size={14} color="#7b8fba" /><span>{player.mp}/{player.maxMp}</span></div>
        <div className="header-stat"><Star size={14} color="var(--warning)" /><span>Lv.{player.level}</span></div>
      </div>
    </header>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [activeScreen, setActiveScreen] = useState('story');
  const [storyLog, setStoryLog] = useState(sampleStoryLog);
  const [playerInput, setPlayerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState('crossroads');
  const [combat, setCombat] = useState({ active: false, monster: null, playerState: null });
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [player, setPlayer] = useState(playerData);

  // Initialize API config
  useEffect(() => { loadConfig(); }, []);

  // Toast helper
  const toast = useCallback((type, message, icon) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, message, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Handle player action
  const handleSend = useCallback(async (input) => {
    const newLog = [...storyLog, { role: 'player', content: input }];
    setStoryLog(newLog);
    setIsLoading(true);

    try {
      const config = getConfig();
      if (config.apiKey) {
        // Real LLM call
        const response = await sendGameMessage({ storyLog: newLog, playerInput: input });
        setStoryLog([...newLog, { role: 'narrator', content: response }]);
        // Parse combat triggers from response
        if (response.includes('[COMBAT]')) {
          try {
            const combatMatch = response.match(/\[COMBAT\]([\s\S]*?)\[\/COMBAT\]/);
            if (combatMatch) {
              const monsterData = JSON.parse(combatMatch[1]);
              setCombat({
                active: true,
                monster: { ...monsterData, hp: monsterData.hp, maxHp: monsterData.hp },
                playerState: { ...player, hp: player.hp, mp: player.mp },
              });
              toast('warning', `遭遇 ${monsterData.name}！`);
            }
          } catch (e) { /* combat parse fail */ }
        }
      } else {
        // Mock mode - generate simple response
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
        const mockResponses = [
          '你沿着小径继续前行。雾气似乎更浓了，在脚踝的高度翻滚涌动。远处的树影在雾中若隐若现，如同沉默的巨人。\n\n一阵凉风拂过，带来了远处隐约的金属碰撞声——是矿坑的方向。也可能是别的什么。\n\n[选项] 朝矿坑方向前进\n[选项] 在附近搜索是否有隐藏的路径\n[选项] 停下来仔细观察周围的痕迹',
          '脚下的碎石在寂静中发出清脆的响声。你注意到路边有一块半埋在土中的石碑，上面刻着已经模糊不清的文字。\n\n弯下腰，你用手指轻轻拂去碑面的泥土。隐约可以辨认出几个字：「...者，勿...前...」——这是一块警示碑。\n\n[选项] 继续无视警告向前\n[选项] 仔细拓印石碑内容\n[选项] 绕路从旁边的树林穿过',
        ];
        setStoryLog([...newLog, { role: 'narrator', content: mockResponses[Math.floor(Math.random() * mockResponses.length)] }]);

        // Random encounter
        if (Math.random() < 0.3) {
          const m = monsters[Math.floor(Math.random() * monsters.length)];
          setCombat({
            active: true,
            monster: { ...m, hp: m.maxHp },
            playerState: { ...player, hp: player.hp, mp: player.mp },
          });
          toast('warning', `遭遇了 ${m.name}！`);
        }
      }
    } catch (err) {
      toast('danger', `错误: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [storyLog, player, toast]);

  // Map travel
  const handleTravel = useCallback((node) => {
    setCurrentNodeId(node.id);
    const newLog = [...storyLog, { role: 'player', content: `前往「${node.name}」。` }];
    setStoryLog([...newLog, { role: 'narrator', content: node.desc + '\n\n新区域已发现。你可以继续探索或与周围环境互动。' }]);
    toast('success', `到达「${node.name}」`);
    setActiveScreen('story');
  }, [storyLog, toast]);

  // Combat actions
  const handleCombatAction = useCallback((type, data) => {
    setCombat(prev => {
      if (!prev.active) return prev;
      const newMonster = { ...prev.monster };
      const newPlayer = { ...prev.playerState };

      // Player turn
      let dmg = 0;
      if (type === 'attack') dmg = Math.max(1, Math.floor(player.stats.atk * (0.8 + Math.random() * 0.4) - newMonster.def * 0.3));
      else if (type === 'skill' && data.power) dmg = Math.max(1, Math.floor(player.stats.atk * data.power - newMonster.def * 0.3));
      newMonster.hp = Math.max(0, newMonster.hp - dmg);
      toast('info', `对 ${newMonster.name} 造成 ${dmg} 点伤害！`);

      // Monster dead?
      if (newMonster.hp <= 0) {
        toast('success', `击败了 ${newMonster.name}！获得经验值。`);
        return { active: false, monster: null, playerState: null };
      }

      // Monster turn
      const monsterDmg = Math.max(1, Math.floor(newMonster.atk * (0.8 + Math.random() * 0.4) - player.stats.def * 0.2));
      newPlayer.hp = Math.max(0, newPlayer.hp - monsterDmg);
      toast('danger', `${newMonster.name} 对你造成 ${monsterDmg} 点伤害！`);

      if (newPlayer.hp <= 0) {
        toast('danger', '你被击败了...');
        return { active: false, monster: null, playerState: null };
      }

      return { ...prev, monster: newMonster, playerState: newPlayer };
    });
  }, [player, toast]);

  const handleFlee = useCallback(() => {
    setCombat({ active: false, monster: null, playerState: null });
    toast('info', '你成功脱离了战斗。');
  }, [toast]);

  const contextValue = { player, storyLog, combat, toast };

  return (
    <GameContext.Provider value={contextValue}>
      <div className="app-container">
        <Sidebar
          activeScreen={activeScreen} setActiveScreen={setActiveScreen}
          inventoryOpen={inventoryOpen} setInventoryOpen={setInventoryOpen}
          settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen}
          quests={quests}
        />
        <div className="main-area">
          <Header player={player} />
          <main className="content">
            {activeScreen === 'story' && (
              <StoryPanel storyLog={storyLog} playerInput={playerInput} setPlayerInput={setPlayerInput} onSend={handleSend} isLoading={isLoading} />
            )}
            {activeScreen === 'map' && (
              <MapPanel nodes={mapNodes} currentNodeId={currentNodeId} onTravel={handleTravel} toast={toast} />
            )}
          </main>
        </div>
        <CombatModal combat={combat} onAction={handleCombatAction} onFlee={handleFlee} toast={toast} />
        <InventoryDrawer open={inventoryOpen} onClose={() => setInventoryOpen(false)} player={player} toast={toast} />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} toast={toast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </GameContext.Provider>
  );
}
