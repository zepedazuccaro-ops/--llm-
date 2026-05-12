// === Game Clock System ===
// Syncs with system clock, maintains game time at configurable speed ratio

const TIME_RATIO = 10; // 1 real minute = 10 game minutes

export function getSystemTime() {
  const now = new Date();
  return {
    hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(),
    day: now.getDate(), month: now.getMonth()+1, year: now.getFullYear(),
    weekday: ['日','一','二','三','四','五','六'][now.getDay()],
    iso: now.toISOString(),
    formatted: now.toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
    dateFormatted: `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}`,
  };
}

export function initGameTime(startHour = 6) {
  const saved = localStorage.getItem('llmgame_time');
  if (saved) try { return JSON.parse(saved); } catch(e) {}
  return { day: 1, hours: startHour, minutes: 0, period: 'morning' };
}

export function updateGameTime(gameTime, realElapsedMs = 1000) {
  const gameMinutesElapsed = (realElapsedMs / 60000) * TIME_RATIO;
  let totalMinutes = gameTime.hours * 60 + gameTime.minutes + gameMinutesElapsed;
  let days = gameTime.day;

  while (totalMinutes >= 1440) { totalMinutes -= 1440; days++; }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  let period = 'night';
  if (hours >= 6 && hours < 12) period = 'morning';
  else if (hours >= 12 && hours < 17) period = 'afternoon';
  else if (hours >= 17 && hours < 21) period = 'evening';

  const result = { day: days, hours, minutes, period };
  localStorage.setItem('llmgame_time', JSON.stringify(result));
  return result;
}

export function formatGameTime(gt) {
  return `第 ${gt.day} 天 · ${String(gt.hours).padStart(2,'0')}:${String(gt.minutes).padStart(2,'0')}`;
}

export const PERIOD_NAMES = { morning:'清晨', afternoon:'午后', evening:'黄昏', night:'深夜' };

export function timeOfDayDescription(period) {
  const descs = {
    morning: '雾气在晨光中渐渐稀薄。新的一天开始了，边境的生物开始活动。',
    afternoon: '阳光穿过云层投下斑驳的影子。这是深渊边境最安静的时刻。',
    evening: '夕阳将整片天空染成深红色。雾气重新开始聚拢，夜晚的危险正在逼近。',
    night: '浓雾笼罩了一切。月光勉强透过雾气，在地面上投下惨白的光斑。深渊的力量在夜晚达到顶峰。',
  };
  return descs[period] || '';
}
