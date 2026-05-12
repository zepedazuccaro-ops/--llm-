# 深渊手札 (Abyss Codex) — LLM 文字冒险 RPG

基于大语言模型（LLM）驱动的沉浸式文字冒险与多节点地图探险 RPG 网页游戏前端框架。

日系高级极简美学 · 毛玻璃质感 · 思源字体 · Lucide Icons · React 18 + Vite

## 功能

### 核心模块
- **LLM 故事阅读区** — 流式文本展示，GM/玩家双色对话区分，打字机光标效果
- **交互式探险地图** — SVG 连线节点地图，已探索/未探索/当前位置视觉区分，悬停详情卡片 + NPC 交互
- **战斗系统** — 动态怪物信息卡，HP/MP 进度条，技能消耗，回合制战斗，战利品掉落
- **角色与背包** — 装备位（武器/防具/饰品）+ 属性加成预览，物品网格 + 使用/装备/丢弃操作
- **NPC 对话系统** — 多话题分支对话，物品交易，委托任务
- **全局通知系统** — Toast 平滑滑入，4种类型（信息/成功/警告/危险）
- **联网搜索** — DuckDuckGo 匿名搜索，内置游戏世界资料查询
- **角色创建** — 5维属性自由分配，localStorage 持久化存档

### 装备系统
- 武器/防具/饰品三槽位，可随时装卸
- 装备提供属性加成（ATK/DEF/SPD/INT/LUK/MP），实时在属性面板展示
- 稀有度边框区分（普通/精良/稀有/传奇）

### 道具系统
- 消耗品（回复药/灵水/兽肉/妖狐之血）— 使用后立即恢复 HP/MP
- 素材品 — 可与 NPC 交易换取装备
- 任务品 — 解锁剧情和隐藏区域
- 点击任意背包物品弹出操作面板：使用 / 装备 / 丢弃 / 取消

### NPC 互动
- 雾之老人（crossroads）— 话题对话 + 青铜钥匙交换怨恨之锏
- 巫女·白（神社）— 话题对话 + 迷雾之核交换回复药 + 净化灵脉任务

### 天启预报世界观
场景设定借鉴小说《天启预报》的深渊边境、天文会、黄金黎明等元素
- 槐诗主角线 + 象牙之塔装备
- 蝇王的残页（别西卜钢铁之书残页）
- 怨恨之锏（应芳州遗物）
- 归净之民·残渣（黄金黎明实验产物）
- 月隐之祠（月读命神社遗迹）

## 快速开始

```bash
git clone https://github.com/zepedazuccaro-ops/--llm-.git
cd --llm-
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`

### 无需后端即可体验

默认开启 Mock 模式，自动生成剧情文本，随机触发战斗遭遇。打开即可游玩。

### 接入真实 LLM

在侧边栏「API设置」中填入 DeepSeek API Key：

```
端点: https://api.deepseek.com/anthropic
模型: deepseek-v4-pro[1m]
API Key: sk-xxxxxxxx
```

保存后所有对话将由 AI 实时生成。支持 Anthropic-compatible 和 OpenAI-compatible 端点。

## 技术栈

| 用途 | 技术 |
|------|------|
| 框架 | React 18 |
| 构建 | Vite 8 |
| 图标 | Lucide React |
| 字体 | Noto Sans SC + Noto Serif SC |
| 存储 | localStorage 存档持久化 |
| API | DeepSeek / Anthropic / OpenAI compatible |

## 项目结构

```
src/
├── main.jsx              # 入口
├── App.jsx               # 主应用 (~700行，9个功能模块)
├── App.css               # 日系极简CSS (~450行)
├── index.css             # 全局变量 + 动画
├── data/mock.js          # 游戏数据（角色/道具/NPC/怪物/剧情/场景）
└── api/llm.js            # LLM API 接口（流式+普通）
```

## 快捷键

- `Enter` — 发送消息
- `Shift + Enter` — 换行
- 点击 地图节点 — 展开详情/传送
- 点击 背包物品 — 使用/装备/丢弃

## 许可

MIT
