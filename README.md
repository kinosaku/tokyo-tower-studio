# Tokyo Tower Studio · 东京塔结构工作室

**AI 生成 / AI-generated** — 本项目的界面、代码、说明和程序化东京塔模型由 OpenAI Codex 生成。

**[打开在线 Demo](https://kinosaku.github.io/tokyo-tower-studio/)** · [GitHub 源码](https://github.com/kinosaku/tokyo-tower-studio)

一个可交互的东京塔 3D 工作室：深色场景、圆形展台、红白塔身、结构说明和渐进拆解。灵感来自 [ashemag/model-x-studio](https://github.com/ashemag/model-x-studio) 的交互形式。本项目重新实现界面和几何模型，没有复制参考项目代码或汽车模型资产。

## 体验

- 640 个独立几何部件，分为基础、四面支撑、下部桁架、主展望台、上部桁架、顶层展望台、天线与塔尖 7 个结构系统。
- 拖动旋转、滚轮或双指缩放、相机重置、自动旋转、线框视图。
- 点击模型或结构列表，查看说明；使用下拉列表进行键盘可操作的单件选择。
- 独立查看结构或单个部件，连续拆解滑杆从完整建筑过渡到结构分离，再到 640 件独立排列。
- 可切换高度标注，适配桌面和手机。

## 本地运行

需要 Node.js **22.13+**（推荐 Node 24）和 npm。

```sh
npm ci
npm run dev:demo
```

```sh
npm run typecheck
npm run validate:model
npm run build:demo
npm run preview:demo
```

静态输出位于 `dist/`，相对资源路径可直接用于 GitHub Pages 或任意静态托管。仓库的 `docs/` 保存与源码对应的已构建 Demo，通过 GitHub Pages 的 `main /docs` 发布。更新后执行 `npm run publish:docs`，一并提交源码和 `docs/`。

初始 Sites 脚手架的 `dev` / `build` 脚本保留；本项目的已验证发布流程使用 `dev:demo` / `build:demo`。静态 Demo 不需要账户登录、API key、数据库或外部模型下载。

## 代码位置

| 文件 | 用途 |
| --- | --- |
| `lib/tower-geometry.ts` | 原创程序化几何、部件 ID 和结构划分 |
| `app/tower-scene.tsx` | Three.js 场景、灯光、拾取、相机及拆解动画 |
| `app/page.tsx` | React 交互界面 |
| `app/globals.css` | 工作室样式与响应式布局 |
| `lib/tower-sections.ts` | 中文结构说明 |
| `lib/use-explorer-tools.ts` | 可选的浏览器 WebMCP 工具，支持时才注册 |
| `demo/main.tsx` | 静态 Demo 入口 |
| `docs/` | GitHub Pages 可运行版本 |

## 模型来源与事实边界

**这是 AI 生成的程序化建筑示意模型，不是测绘模型、工程图纸或真实构件清单，也不是东京塔官方产品。** 几何由代码生成，640 是本模型的部件数量。塔脚尺寸、杆件粗细、平台比例及构件划分均为展示所作的近似。

已核对的建筑资料：总高 333 m、主展望台 150 m、顶层展望台 250 m；1958 年 12 月 23 日竣工；设计师为内藤多仲；外部涂装为国际橙和白色。

- [东京塔官方设施介绍](https://en.tokyotower.co.jp/guidance/)
- [Tokyo Tower Gallery：历史及建筑师](https://gallery.tokyotower.co.jp/en/index.html)
- [官方 Towerpedia：红白涂装](https://en.tokyotower.co.jp/plan/towerpedia/)

验证范围见 [VALIDATION.md](./VALIDATION.md)。AI 生成标识同时显示在 Demo 顶栏、模型说明、此 README 和仓库简介中。
