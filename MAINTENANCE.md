# Avaritia Roo Code 维护文档

## 结论

长期维护入口是这个源码仓库：`D:\AI_alice\Avaritia-Roo-Code`。

`C:\Users\rain\.vscode\extensions\avaritiachaos.avaritia-roo-code-3.53.0-avaritia.1` 是 VS Code 已安装扩展的产物目录，只用于运行、临时排障和确认已安装版本；不要把它当成项目维护目录。

## 维护边界

- 源码修改、功能开发、回归测试、构建打包：在 `D:\AI_alice\Avaritia-Roo-Code` 做。
- VS Code 实际加载运行的扩展：来自 `.vscode\extensions\avaritiachaos.avaritia-roo-code-*`。
- 插件安装目录里的文件会被重新安装、升级或清理覆盖，不适合作为长期记录或源码维护位置。
- 如果为了止血临时改过插件安装目录，必须尽快把有效改动回流到源码仓库。

## 当前源码仓库

- 路径：`D:\AI_alice\Avaritia-Roo-Code`
- 包名：`roo-code`
- 包管理器：`pnpm@10.8.1`
- Node 目标：`20.19.2`
- 主要源码：`src/`
- Webview 源码：`webview-ui/`
- 应用/包工作区：`apps/`、`packages/`
- 构建脚本入口：根目录 `package.json`

## 当前已安装扩展

- 路径：`C:\Users\rain\.vscode\extensions\avaritiachaos.avaritia-roo-code-3.53.0-avaritia.1`
- 扩展名：`avaritia-roo-code`
- 显示名：`Avaritia Roo Code`
- 发布者：`avaritiachaos`
- 已安装版本：`3.53.0-avaritia.1`
- 运行入口：`dist/extension.js`

## 推荐工作流

1. 在源码仓库里修改代码：`D:\AI_alice\Avaritia-Roo-Code`。
2. 按改动范围运行检查，例如类型检查、测试或目标包构建。
3. 打包 Avaritia 版本：

```powershell
corepack pnpm vsix:avaritia
```

4. 安装生成的 VSIX，或使用项目已有安装脚本：

```powershell
corepack pnpm install:vsix:avaritia
```

5. 在 VS Code 里执行 `Developer: Reload Window`，确认加载的是新版本。
6. 如果行为异常，先对照源码仓库的提交和已安装扩展目录的 `package.json` 版本。

## 什么时候看插件安装目录

只在这些场景进入 `.vscode\extensions`：

- 确认 VS Code 当前实际加载了哪个扩展版本。
- 排查安装后的产物是否缺文件，例如 `dist/extension.js`、`webview-ui/build/`、`assets/`。
- 对比源码构建结果和已安装产物是否一致。
- 极少数情况下做临时热修验证。

不要在插件安装目录里做长期代码维护、文档维护、依赖安装或源码级构建。

## 是否保留两个目录

`D:\AI_alice\Avaritia-Roo-Code` 必须保留，这是维护项目的源码仓库。

`.vscode\extensions\avaritiachaos.avaritia-roo-code-*` 也需要保留当前正在使用的版本目录，因为 VS Code 运行扩展时会读取它。但它不是项目根目录，不需要把维护文档放在那里；如果重新安装扩展，VS Code 可以重新生成或替换这个目录。

## 排障清单

- 扩展不启动：先检查已安装目录的 `package.json` 是否指向存在的 `dist/extension.js`。
- 侧边栏空白：检查源码 `webview-ui/`，再确认安装产物 `webview-ui/build/` 是否存在。
- 命令缺失：检查源码中对应 contribution 配置，打包后再确认已安装 `package.json`。
- 修改无效：确认改动是否已经重新打包并安装，不要只看源码仓库文件。
- 升级后丢改动：检查改动是否只做在 `.vscode\extensions` 里，若是，需要回源码仓库重做。

## 维护记录

| 日期       | 操作         | 说明                                              |
| ---------- | ------------ | ------------------------------------------------- |
| 2026-05-18 | 新增维护文档 | 明确源码仓库与 VS Code 已安装扩展目录的维护边界。 |
