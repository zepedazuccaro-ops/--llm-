// === LLM API Connector — 酒馆式多提供商支持 ===

// Provider presets (SillyTavern-style)
export const PROVIDERS = {
  deepseek: {
    name:'DeepSeek (推荐)', baseURL:'https://api.deepseek.com/anthropic',
    model:'deepseek-v4-pro[1m]', authHeader:'Authorization', authPrefix:'Bearer ',
    endpoint:'/v1/messages', streamEndpoint:'/v1/messages',
    systemAsTopLevel:true, // DeepSeek Anthropic format: system is top-level param
    bodyBuilder:(model,system,messages)=>({model,max_tokens:4096,temperature:0.85,stream:false,system,messages}),
    responseParser:(data)=>{
      const textBlock=(data.content||[]).find(c=>c.type==='text');
      const thinkingBlock=(data.content||[]).find(c=>c.type==='thinking');
      const text=textBlock?.text||'';
      const thinking=thinkingBlock?.thinking||'';
      // Fallback: if no text but choices exist (OpenAI compat)
      if(!text && data.choices) return data.choices[0]?.message?.content||'';
      // Return both for thinking display
      return thinking?`[THINKING]${thinking}[/THINKING]\n${text}`:text;
    },
    streamParser:(chunk)=>chunk.type==='content_block_delta'?chunk.delta?.text:chunk.choices?.[0]?.delta?.content||'',
  },
  openai: {
    name:'OpenAI-compatible', baseURL:'https://api.openai.com/v1',
    model:'gpt-4o', authHeader:'Authorization', authPrefix:'Bearer ',
    endpoint:'/chat/completions', streamEndpoint:'/chat/completions',
    systemAsTopLevel:false, // OpenAI: system inside messages array
    bodyBuilder:(model,system,messages)=>({model,max_tokens:2048,temperature:0.85,messages:[{role:'system',content:system},...messages]}),
    responseParser:(data)=>data.choices?.[0]?.message?.content||'',
    streamParser:(chunk)=>chunk.choices?.[0]?.delta?.content||'',
  },
  anthropic: {
    name:'Anthropic (官方)', baseURL:'https://api.anthropic.com',
    model:'claude-sonnet-4-6', authHeader:'x-api-key', authPrefix:'',
    endpoint:'/v1/messages', streamEndpoint:'/v1/messages',
    systemAsTopLevel:true, // Anthropic: system is top-level param
    bodyBuilder:(model,system,messages)=>({model,max_tokens:2048,temperature:0.85,system,messages}),
    responseParser:(data)=>data.content?.[0]?.text||'',
    streamParser:(chunk)=>chunk.type==='content_block_delta'?chunk.delta?.text:chunk.delta?.text||'',
  },
};

let currentProviderKey = localStorage.getItem('llmgame_provider')||'deepseek';
let config = { ...PROVIDERS[currentProviderKey], apiKey: localStorage.getItem('llmgame_apikey')||'' };

export function getConfig() { return config; }
export function getApiEnabled() { return !!config.apiKey; }

export function selectProvider(key) {
  if (!PROVIDERS[key]) return;
  currentProviderKey = key;
  config = { ...PROVIDERS[key], apiKey: config.apiKey || localStorage.getItem('llmgame_apikey')||'' };
  localStorage.setItem('llmgame_provider', key);
  return config;
}

export function setApiKey(key) {
  config.apiKey = key;
  localStorage.setItem('llmgame_apikey', key||'');
}

export function updateConfig(newCfg) {
  if (newCfg.apiKey !== undefined) { config.apiKey = newCfg.apiKey; localStorage.setItem('llmgame_apikey',newCfg.apiKey||''); }
  if (newCfg.baseURL) config.baseURL = newCfg.baseURL;
  if (newCfg.model) config.model = newCfg.model;
}

export function loadConfig() {
  const provider = localStorage.getItem('llmgame_provider')||'deepseek';
  const apikey = localStorage.getItem('llmgame_apikey')||'';
  config = { ...PROVIDERS[provider], apiKey: apikey };
  return config;
}

function buildMessages(context) {
  const history = (context.storyLog||[]).map(e=>({role:e.role==='player'?'user':'assistant',content:e.content}));
  return history.slice(-20);
}

export async function sendGameMessage(context) {
  const messages = buildMessages(context);
  const system = context.systemPrompt||'你是一个沉浸式文字冒险RPG的游戏主持人。';
  const body = config.bodyBuilder(config.model, system, messages);
  body.stream = false;

  const headers = {
    'Content-Type':'application/json; charset=utf-8',
    [config.authHeader]: config.authPrefix + config.apiKey,
  };

  let url = config.baseURL.replace(/\/$/,'') + config.endpoint;
  const response = await fetch(url, {
    method:'POST', headers, body:JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText.slice(0,400)}`);
  }

  const data = await response.json();
  return config.responseParser(data);
}

export async function* streamGameMessage(context) {
  const messages = buildMessages(context);
  const system = context.systemPrompt||'你是一个沉浸式文字冒险RPG的游戏主持人。';
  const body = config.bodyBuilder(config.model, system, messages);
  body.stream = true;

  const headers = {
    'Content-Type':'application/json; charset=utf-8',
    [config.authHeader]: config.authPrefix + config.apiKey,
  };

  let url = config.baseURL.replace(/\/$/,'') + config.streamEndpoint;
  const response = await fetch(url, {
    method:'POST', headers, body:JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText.slice(0,400)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, {stream:true});
    const lines = buffer.split('\n');
    buffer = lines.pop()||'';
    for (const line of lines) {
      if (!line.trim()||!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data==='[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const content = config.streamParser(parsed);
        if (content) yield content;
      } catch(e) {}
    }
  }
}
