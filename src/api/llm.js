// === LLM API Connector ===
// 支持 OpenAI-compatible / Anthropic-compatible 端点
// 默认配置为 DeepSeek API，可在设置面板中修改

const DEFAULT_CONFIG = {
  endpoint: 'https://api.deepseek.com/anthropic',
  apiKey: '',
  model: 'deepseek-v4-pro[1m]',
  systemPrompt: `你是一个沉浸式文字冒险RPG的游戏主持人（Game Master）。
你负责主持一个日式黑暗奇幻风格的冒险故事，世界观设定在一个被迷雾笼罩的边境之地——「深渊边境」。

【叙事规则】
1. 使用第二人称「你」来叙述。
2. 描写细腻但克制，注重氛围和感官细节（光影、声音、气味、触感）。
3. 不要过度修饰，保持冷峻、优雅的叙事风格。
4. 每次回复控制在 2-4 段，每段不超过 4 句。
5. 在叙事末尾给出 2-4 个玩家可以采取的行动选项，参考格式：
   [选项] 向旧神社走去
   [选项] 仔细观察周围的雾气
   [选项] 返回据点

【战斗规则】
当触发战斗时，你需要描述怪物出现的方式和外观。
使用 JSON 块输出战斗数据，格式：
[COMBAT]
{"name":"怪物名","hp":200,"maxHp":200,"atk":35,"def":20,"spd":45,"tags":["标签1","标签2"],"desc":"怪物外观描述"}
[/COMBAT]
然后正常叙述战斗过程。
玩家造成伤害时输出：
[DAMAGE:怪物,数值]
玩家受到伤害时输出：
[DAMAGE:玩家,数值]

【世界规则】
- 每个地点有相邻节点的链接
- 特殊事件由概率触发
- 物品可以收集和使用

请始终保持在游戏世界的角色中。`
};

let config = { ...DEFAULT_CONFIG };

export function getConfig() { return config; }

export function updateConfig(newConfig) {
  config = { ...config, ...newConfig };
  localStorage.setItem('llmgame_api_config', JSON.stringify(config));
}

export function loadConfig() {
  try {
    const saved = localStorage.getItem('llmgame_api_config');
    if (saved) config = { ...config, ...JSON.parse(saved) };
  } catch (e) { /* ignore */ }
  return config;
}

function buildMessages(context) {
  const history = (context.storyLog || []).map(entry => ({
    role: entry.role === 'player' ? 'user' : 'assistant',
    content: entry.content
  }));
  // 取最近 10 轮（20 条消息）以避免上下文过长
  const recentHistory = history.slice(-20);
  return [
    { role: 'system', content: config.systemPrompt },
    ...recentHistory,
    { role: 'user', content: context.playerInput || '（环顾四周，等待接下来发生的事）' }
  ];
}

export async function sendGameMessage(context) {
  const messages = buildMessages(context);

  const body = {
    model: config.model,
    messages,
    max_tokens: 2048,
    temperature: 0.85,
    // Anthropic-compatible format
    ...(config.endpoint.includes('anthropic') || config.endpoint.includes('deepseek') ? {} : {}),
  };

  const headers = {
    'Content-Type': 'application/json',
  };

  // 根据不同端点设置鉴权方式
  if (config.endpoint.includes('deepseek')) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
    body.model = config.model;
  } else if (config.endpoint.includes('openai')) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  } else {
    headers['x-api-key'] = config.apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }

  const response = await fetch(config.endpoint + '/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API 调用失败 (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || data.content?.[0]?.text || '';
}

// 流式版本（用于打字机效果）
export async function* streamGameMessage(context) {
  const messages = buildMessages(context);
  const body = {
    model: config.model,
    messages,
    max_tokens: 2048,
    temperature: 0.85,
    stream: true,
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  const response = await fetch(config.endpoint + '/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`API 调用失败 (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || '';
        if (content) yield content;
      } catch (e) { /* skip malformed chunks */ }
    }
  }
}
