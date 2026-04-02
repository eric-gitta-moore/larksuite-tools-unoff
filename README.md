# larksuite-tools

`larksuite-tools` 是一个面向 AI Agent 的飞书 / LarkSuite Skill 聚合仓库。

它把原本零散的 `lark-*` skills 汇总成一个统一入口 `larksuite-tools`，用于在使用 `lark-cli` 时做任务路由、能力发现和按需加载。适合这样的场景：

- 用户只说“帮我查一下飞书日程 / 文档 / 任务 / 邮件”，但没有明确该用哪个子 skill
- 需要先从一个总入口判断是认证问题、领域问题，还是需要走 OpenAPI 探索
- 希望把飞书相关能力作为一套独立 skills 单独维护，而不是继续散落在多个目录里

## 安装

安装 skills：

```bash
npx skills add https://github.com/eric-gitta-moore/larksuite-tools-unoff
```

查看仓库里的 skills：

```bash
npx skills add https://github.com/eric-gitta-moore/larksuite-tools-unoff -l
```

## 仓库目标

- 提供一个统一的总入口 skill：[`skills/SKILL.md`](./skills/SKILL.md)
- 在 `references/` 下保留原始子 skill 的完整结构，方便按需读取
- 尽量不破坏原有相对链接和子 skill 内部引用关系
- 让 Agent 在飞书场景下优先“先路由、再读取、后执行”，避免上来就猜命令

## 目录结构

```text
.
├── README.md
└── skills/
    ├── SKILL.md                     # 聚合入口：larksuite-tools
    └── references/
        ├── lark-shared/             # 认证、身份、scope、权限处理
        ├── lark-calendar/           # 日历与日程
        ├── lark-doc/                # 云文档
        ├── lark-drive/              # 云空间
        ├── lark-im/                 # 即时通讯
        ├── lark-mail/               # 邮箱
        ├── lark-task/               # 任务
        ├── lark-vc/                 # 视频会议
        ├── lark-base/               # 多维表格
        ├── ...                      # 其他 lark-* 子 skill
        └── lark-skill-maker/        # 自定义 lark-cli skill 生成
```

## 使用方式

### 1. 从总入口开始

优先阅读 [`skills/SKILL.md`](./skills/SKILL.md)。

这个文件负责：

- 定义 `larksuite-tools` 的触发描述
- 说明整体使用顺序
- 把常见需求路由到对应子 skill
- 提供跨域场景下的组合建议

### 2. 遇到认证 / 权限问题先看 lark-shared

飞书场景里，很多失败并不是命令本身错了，而是身份、scope 或 token 类型不对。

所以出现这些问题时，优先读：

- [`skills/references/lark-shared/SKILL.md`](./skills/references/lark-shared/SKILL.md)

典型信号包括：

- `auth login`
- `Permission denied`
- `--as user` / `--as bot`
- scope 不足
- 不确定该用用户身份还是应用身份

### 3. 再按领域读取子 skill

常见路由示例：

- 日历 / 日程 / 忙闲 / RSVP：[`lark-calendar`](./skills/references/lark-calendar/SKILL.md)
- 文档 / Markdown 创建 / 文档更新：[`lark-doc`](./skills/references/lark-doc/SKILL.md)
- 云盘 / 上传下载 / 文件夹 / 权限：[`lark-drive`](./skills/references/lark-drive/SKILL.md)
- 消息 / 群聊 / 线程 / 文件消息：[`lark-im`](./skills/references/lark-im/SKILL.md)
- 邮件 / 草稿 / 发送 / 回复：[`lark-mail`](./skills/references/lark-mail/SKILL.md)
- 待办 / 任务 / 清单：[`lark-task`](./skills/references/lark-task/SKILL.md)
- 历史会议 / 纪要 / 逐字稿：[`lark-vc`](./skills/references/lark-vc/SKILL.md)
- 多维表格 / 字段 / 记录 / 分析：[`lark-base`](./skills/references/lark-base/SKILL.md)

### 4. 能力不够再走 OpenAPI

如果：

- 现有子 skill 覆盖不了需求
- `lark-cli` 已注册命令也没有对应能力
- 必须调用原生 OpenAPI

再读取：

- [`skills/references/lark-openapi-explorer/SKILL.md`](./skills/references/lark-openapi-explorer/SKILL.md)

### 5. 需要继续扩展 skill 时

如果要在这套体系里继续新增或改造自定义飞书 skill，参考：

- [`skills/references/lark-skill-maker/SKILL.md`](./skills/references/lark-skill-maker/SKILL.md)

## 依赖

这个仓库本身主要提供 skill 文档与路由结构，真正执行命令依赖：

- `lark-cli`

如果 Agent 需要查看命令帮助，一般可以从这里开始：

```bash
lark-cli --help
```

然后再进入具体领域命令，例如：

```bash
lark-cli calendar --help
lark-cli docs --help
lark-cli task --help
```

## 维护原则

- 聚合入口尽量保持精简，只写路由、选择策略和全局约束
- 领域细节优先留在各自子 skill 中，避免在入口里重复复制
- `references/` 下尽量保持子 skill 原始结构，减少搬运后的断链风险
- 修改子 skill 时，优先保证相对链接、前置阅读顺序和命令约束仍然成立
- 不要让入口文档重新变成“大而全说明书”，它应该始终是路由层

## 适合谁使用

- 希望把飞书能力单独沉淀成一套 skills 的 Agent 使用者
- 需要在 Codex / 其他支持 Skill 的 Agent 环境中统一接入 `lark-cli`
- 想先用一个总 skill 分流，再按需加载具体领域知识的人
