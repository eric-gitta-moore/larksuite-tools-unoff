---
name: larksuite-tools
description: "飞书/LarkSuite CLI 总路由 Skill：统一覆盖审批、多维表格、日历、通讯录、云文档、云空间、事件订阅、即时通讯、邮箱、妙记、电子表格、任务、视频会议、知识库、画板，以及跨域工作流与原生 OpenAPI 探索。当用户提到飞书、Feishu、Lark、LarkSuite、lark-cli，或不确定该使用哪个 lark-* skill 时使用。"
metadata:
  requires:
    bins: ["lark-cli"]
  cliHelp: "lark-cli --help"
---

# LarkSuite Tools

这个 skill 是 `lark-cli` 的统一入口和路由层。`references/` 下保留了原始子 skill 的完整目录，优先按任务只读取最相关的子 skill，不要一次性加载全部内容。

## 使用顺序

1. 先判断是不是初始化、认证、身份切换、权限或 scope 问题；如果是，先读 [`lark-shared`](references/lark-shared/GUIDE.md)。
2. 再按任务领域读取对应子 skill；跨领域任务只补充读取必要的 2 到 3 个子 skill。
3. 如果现有子 skill 和 CLI 已注册命令都无法覆盖，再读 [`lark-openapi-explorer`](references/lark-openapi-explorer/GUIDE.md)。
4. 如果用户要新建或改造一个 lark-cli skill，再读 [`lark-skill-maker`](references/lark-skill-maker/GUIDE.md)。
5. 执行命令前，遵守子 skill 中写明的“先读 reference 再执行命令”规则，不要跳步骤。

## 路由表

| 场景 | 子 skill |
| --- | --- |
| 应用初始化、`auth login`、`--as user/bot`、权限 / scope / `Permission denied` | [`lark-shared`](references/lark-shared/GUIDE.md) |
| 审批实例、审批任务、撤回 / 同意 / 拒绝 / 转交 | [`lark-approval`](references/lark-approval/GUIDE.md) |
| 多维表格 Base、字段/记录/视图/仪表盘/公式/lookup/自动化 | [`lark-base`](references/lark-base/GUIDE.md) |
| 日历、日程预约、议程、忙闲、时间推荐、RSVP | [`lark-calendar`](references/lark-calendar/GUIDE.md) |
| 通讯录、查人、部门、`open_id`、联系方式 | [`lark-contact`](references/lark-contact/GUIDE.md) |
| 云文档、Markdown 创建、文档更新、文档搜索、媒体读写 | [`lark-doc`](references/lark-doc/GUIDE.md) |
| 云空间、文件夹、上传下载、权限、评论、导入导出 | [`lark-drive`](references/lark-drive/GUIDE.md) |
| 事件订阅、WebSocket 监听、NDJSON 输出 | [`lark-event`](references/lark-event/GUIDE.md) |
| 即时消息、群聊、线程、消息搜索、资源下载、表情 | [`lark-im`](references/lark-im/GUIDE.md) |
| 邮箱、草稿、发送、回复、转发、会话、标签、附件 | [`lark-mail`](references/lark-mail/GUIDE.md) |
| 妙记、会议录音录像、总结/待办/章节、下载音视频 | [`lark-minutes`](references/lark-minutes/GUIDE.md) |
| 电子表格 Sheets、读写单元格、查找、导出 | [`lark-sheets`](references/lark-sheets/GUIDE.md) |
| 任务、清单、分配、提醒、评论、完成/重开 | [`lark-task`](references/lark-task/GUIDE.md) |
| 视频会议记录、会议纪要、逐字稿、历史会议检索 | [`lark-vc`](references/lark-vc/GUIDE.md) |
| 知识库、空间、节点、复制/移动/创建 | [`lark-wiki`](references/lark-wiki/GUIDE.md) |
| 飞书画板、流程图、架构图、Mermaid/DSL 绘制 | [`lark-whiteboard`](references/lark-whiteboard/GUIDE.md) |
| 会议纪要汇总工作流 | [`lark-workflow-meeting-summary`](references/lark-workflow-meeting-summary/GUIDE.md) |
| 日程 + 待办 standup 工作流 | [`lark-workflow-standup-report`](references/lark-workflow-standup-report/GUIDE.md) |
| 现有能力不覆盖，需要裸调原生 OpenAPI | [`lark-openapi-explorer`](references/lark-openapi-explorer/GUIDE.md) |
| 需要新建或改造 lark-cli skill | [`lark-skill-maker`](references/lark-skill-maker/GUIDE.md) |

## 常见组合

- 文档 / 云空间 / 知识库 URL 解析：通常先看 `lark-doc` 或 `lark-drive`，遇到 wiki token 再结合 `lark-wiki`。
- 会议场景：未来日程优先 `lark-calendar`，已结束会议和纪要优先 `lark-vc`，音视频转写产物看 `lark-minutes`。
- 搜索资源名称时：文档和表格资源发现优先 `lark-doc`；结构化数据分析优先 `lark-base`。
- 需要“摘要 / 汇总 / 周报”类结果时，优先复用已有 workflow skill，而不是从零拼装命令。

## 使用约束

- 不要在没确认身份、scope、token 类型之前猜命令或猜参数。
- 不要跳过子 skill 中明确标注的前置阅读要求。
- 不要一次性把整个 `references/` 读进上下文，只加载当前任务需要的那部分。
