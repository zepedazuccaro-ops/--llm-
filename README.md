# 深渊手札 (Abyss Codex) — LLM 文字冒险 RPG

基于大语言模型驱动的沉浸式 COC 1d100 文字冒险 RPG。日系极简美学，React 18 + Vite。

## 快速开始

```bash
git clone https://github.com/zepedazuccaro-ops/--llm-.git
cd --llm-
npm install
npm run dev
```

Windows 用户直接双击 `start.bat` 一键启动。

## 功能

### 核心系统
| 模块 | 说明 |
|------|------|
| **COC 1d100 骰子系统** | d100 检定，极难/困难/成功/失败/大失败五级判定，奖励骰/惩罚骰，18项技能，8项属性 |
| **LLM 故事引擎** | 流式打字机文本，GM/玩家对话双色区分，Mock模式离线可用 |
| **探险地图** | SVG 连线节点，已探索/当前位置/未探索区分，悬停详情卡片，NPC交互入口 |
| **战斗系统** | 回合制，怪物信息卡+HP进度条，技能消耗，战利品掉落（骰子自动判定） |
| **装备系统** | 武器/防具/饰品三槽，属性加成预览，可随时装卸，稀有度边框 |
| **道具系统** | 消耗品使用/装备/丢弃，点击弹出操作面板，使用效果受骰子检定影响 |
| **NPC 系统** | 多话题分支对话，物品交易，委托任务，支持自定义创建NPC |
| **存档系统** | JSON 导入/导出，localStorage 自动保存，跨设备迁移 |
| **角色创建** | COC 8属性点分配(5-95)，自定义技能，人物立绘URL |
| **游戏时钟** | 系统时间+游戏内时间(1:10)，清晨/午后/黄昏/深夜周期，天启预报世界观主线 |
| **天赋系统** | 8种天赋可选，属性前置要求 |
| **联网搜索** | DuckDuckGo 匿名搜索，内置游戏资料查询 |
| **Toast 通知** | 4种类型(信息/成功/警告/危险)，角落滑入自动消失 |
| **教学系统** | 7步新手指南，首次访问自动弹出 |
| **API 警告** | 未配置 API Key 时顶部红色横幅提醒 |

### 多结局分支
- BE「黄金黎明之影」— 2个结局
- HE「月读命祝福」— 1个结局
- TE「守墓人 / 平凡之路」— 2个结局

### 天启预报世界观
槐诗、应芳州、别西卜、归净之民、黄金黎明、天文会、月隐之祠等设定融入游戏

## 接入 LLM

侧边栏 → 「API设置」填入 DeepSeek API Key：

```
端点: https://api.deepseek.com/anthropic
模型: deepseek-v4-pro[1m]
```

支持 Anthropic-compatible 和 OpenAI-compatible 端点。无 API 时使用 Mock 模式。

## 技术栈

| 用途 | 技术 |
|------|------|
| 框架 | React 18 |
| 构建 | Vite 8 |
| 图标 | Lucide React |
| 字体 | Noto Sans SC + Noto Serif SC |
| 骰子 | COC 7e 1d100 + d4-d100 |
| 存储 | localStorage + JSON 导入导出 |

## 项目结构

```
src/
├── App.jsx                    # 主应用 (700+行，13个功能模块)
├── App.css                    # 日系极简CSS (500+行)
├── index.css                  # 全局变量+动画
├── main.jsx                   # 入口
├── systems/
│   ├── dice.js                # COC 1d100 骰子系统
│   ├── clock.js               # 游戏时钟
│   └── save.js                # 存档系统
├── components/
│   ├── ClockDisplay.jsx       # 时钟UI
│   ├── DiceRoller.jsx         # 骰子面板 (1d100)
│   ├── NPCCreator.jsx         # NPC创建器
│   └── Tutorial.jsx           # 新手教学
├── data/
│   ├── mock.js                # 游戏数据
│   └── storyline.js           # 主线+分支+天赋+NPC模板
└── api/
    └── llm.js                 # LLM API接口
start.bat                      # 一键启动
```

## 快捷键
- `Enter` — 发送消息
- `Shift+Enter` — 换行
- 地图节点 — 悬停详情/点击传送
- 背包物品 — 点击弹出操作面板
- 装备位 — 点击卸下

## 许可
MIT
