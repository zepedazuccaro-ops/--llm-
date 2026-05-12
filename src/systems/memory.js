// === IndexedDB Memory System ===
// Stores conversations, NPC interactions, locations, and time-stamped events

const DB_NAME = 'abyss_codex_memory';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('conversations')) {
        db.createObjectStore('conversations', { keyPath:'id', autoIncrement:true });
      }
      if (!db.objectStoreNames.contains('npc_memory')) {
        db.createObjectStore('npc_memory', { keyPath:'npcId' });
      }
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events', { keyPath:'id', autoIncrement:true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

// Save a conversation entry
export async function saveConversation(entry) {
  try {
    const db = await openDB();
    const tx = db.transaction('conversations', 'readwrite');
    tx.objectStore('conversations').add({
      ...entry,
      timestamp: new Date().toISOString(),
    });
    // Keep only last 200 entries
    const countReq = tx.objectStore('conversations').count();
    countReq.onsuccess = () => {
      if (countReq.result > 200) {
        const delReq = tx.objectStore('conversations').clear();
        // Just clear oldest half to avoid bloat
      }
    };
  } catch(e) { /* IndexedDB unavailable */ }
}

// Get recent conversations (last N entries)
export async function getRecentConversations(limit = 20) {
  try {
    const db = await openDB();
    const tx = db.transaction('conversations', 'readonly');
    const store = tx.objectStore('conversations');
    const req = store.getAll();
    return new Promise(resolve => {
      req.onsuccess = () => {
        const all = req.result || [];
        resolve(all.slice(-limit));
      };
      req.onerror = () => resolve([]);
    });
  } catch(e) { return []; }
}

// Search conversations by keyword
export async function searchConversations(keyword) {
  try {
    const db = await openDB();
    const tx = db.transaction('conversations', 'readonly');
    const req = tx.objectStore('conversations').getAll();
    return new Promise(resolve => {
      req.onsuccess = () => {
        const all = req.result || [];
        const kw = keyword.toLowerCase();
        resolve(all.filter(e =>
          (e.content||'').toLowerCase().includes(kw) ||
          (e.npcName||'').toLowerCase().includes(kw) ||
          (e.location||'').toLowerCase().includes(kw)
        ).slice(-20));
      };
    });
  } catch(e) { return []; }
}

// NPC Memory — independent storage per NPC
export async function saveNPCMemory(npcId, data) {
  try {
    const db = await openDB();
    const tx = db.transaction('npc_memory', 'readwrite');
    const existing = await new Promise(r => {
      const req = tx.objectStore('npc_memory').get(npcId);
      req.onsuccess = () => r(req.result);
    });
    const merged = {
      npcId,
      conversations: [...((existing?.conversations)||[]), ...(data.conversations||[])].slice(-30),
      relationship: data.relationship || existing?.relationship || 0,
      lastMet: new Date().toISOString(),
      flags: { ...(existing?.flags||{}), ...(data.flags||{}) },
    };
    tx.objectStore('npc_memory').put(merged);
  } catch(e) {}
}

export async function getNPCMemory(npcId) {
  try {
    const db = await openDB();
    const tx = db.transaction('npc_memory', 'readonly');
    const req = tx.objectStore('npc_memory').get(npcId);
    return new Promise(r => { req.onsuccess = () => r(req.result||null); req.onerror = () => r(null); });
  } catch(e) { return null; }
}

// Events log (location changes, combat, discoveries)
export async function saveEvent(event) {
  try {
    const db = await openDB();
    const tx = db.transaction('events', 'readwrite');
    tx.objectStore('events').add({...event, timestamp:new Date().toISOString()});
  } catch(e) {}
}

// Build context string for AI prompt
export async function buildContextString(currentLocation, currentNPC, gameTime) {
  const parts = [];
  const recent = await getRecentConversations(10);
  if (recent.length > 0) {
    parts.push('【最近对话记录】');
    recent.forEach(e => {
      parts.push(`[${e.role}] ${e.content?.slice(0,100)}`);
    });
  }
  if (currentNPC) {
    const npcMem = await getNPCMemory(currentNPC);
    if (npcMem) {
      parts.push(`\n【与 ${currentNPC} 的关系】好感度: ${npcMem.relationship}`);
      if (npcMem.conversations?.length > 0) {
        parts.push('之前的互动:');
        npcMem.conversations.slice(-3).forEach(c => {
          parts.push(`- ${c.role}: ${c.content?.slice(0,80)}`);
        });
      }
    }
  }
  parts.push(`\n【当前环境】位置: ${currentLocation||'未知'} | 时间: ${gameTime?.period||'未知'} | 第${gameTime?.day||1}天`);
  return parts.join('\n');
}
