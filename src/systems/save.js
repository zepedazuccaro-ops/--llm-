// === Save/Load System ===
const SAVE_VERSION = '2.0';

export function createSave(player, inventory, storyLog, currentNodeId, gameTime, quests, flags) {
  return {
    version: SAVE_VERSION,
    timestamp: new Date().toISOString(),
    player, inventory, storyLog, currentNodeId, gameTime, quests, flags,
  };
}

export function exportSave(saveData) {
  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  a.download = `abyss-codex-save-${ts}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return `存档已导出: abyss-codex-save-${ts}.json`;
}

export function importSaveFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return reject('未选择文件');
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!data.version || !data.player) return reject('无效的存档文件');
          resolve(data);
        } catch(err) { reject('存档文件解析失败'); }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

export function validateSave(data) {
  if (!data || !data.version) return { valid: false, reason: '无效存档格式' };
  if (!data.player || !data.player.name) return { valid: false, reason: '存档缺少角色数据' };
  return { valid: true };
}
