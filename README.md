<div align="center">
<img align="center" width=200 src="./public/logo.png" />
</div>

<div align="center">
    <h1>Ruck</h1>
    <img alt="累计下载数" src="https://img.shields.io/github/downloads/iamxiaojianzheng/ruck/total" />
    <a href="https://github.com/iamxiaojianzheng/ruck/releases"><img alt="最新发布版本" src="https://img.shields.io/github/package-json/v/iamxiaojianzheng/ruck" /></a>
    <a href="https://github.com/iamxiaojianzheng/ruck/actions"><img alt="github action 构建" src="https://img.shields.io/github/actions/workflow/status/iamxiaojianzheng/ruck/main.yml" /></a>
    <a href="https://github.com/iamxiaojianzheng/ruck/blob/master/LICENSE"><img alt="许可证" src="https://img.shields.io/github/license/iamxiaojianzheng/ruck" /></a>
    <a href="https://github.com/iamxiaojianzheng/ruck/stargazers"><img alt="github 收藏数" src="https://img.shields.io/github/stars/iamxiaojianzheng/ruck?style=social" /></a>
</div>

<div align="center">
<img align="center" src="https://picx.zhimg.com/v2-6d618ffa999b1270d9b223704b9d0cc5.png" />
</div>

<br/>

<p align="center">
开源的插件化桌面端效率工具箱 💪<br/>
插件基于 npm 管理，轻便灵活 | 数据支持 WebDAV 多端同步，安全可靠 | 支持内网部署，可二次定制开发
</p>

---

## ✨ 特性

- 🔌 **插件化架构** - 基于 npm 包模式的插件管理，安装插件和安装 npm 包一样简单
- 🔒 **数据安全** - 支持 WebDAV 多端数据同步，真正的数据安全同步
- 🎯 **系统插件** - 独一无二的系统插件模式，让插件成为 Ruck 的一部分
- ⚡ **快速启动** - 支持快速启动本地 App、文件、文件夹
- 🏢 **企业友好** - 支持企业化内网部署，可二次定制化开发
- 🌍 **多语言支持** - 支持多种语言界面
- 🎨 **主题定制** - 支持明亮和暗黑主题，可自定义配色

---

## 📦 安装

### 下载安装包

从 [GitHub Releases](https://github.com/iamxiaojianzheng/ruck/releases) 下载适合您系统的最新版本：

| 平台 | 下载链接 | 支持架构 |
|------|---------|---------|
| 🍎 macOS | [下载 .dmg](https://github.com/iamxiaojianzheng/ruck/releases) | x64, arm64 |
| 🪟 Windows | [下载 .exe](https://github.com/iamxiaojianzheng/ruck/releases) | x64, ia32 |
| 🐧 Linux | [下载 .deb](https://github.com/iamxiaojianzheng/ruck/releases) | x64 |

### 快速开始

1. **安装应用**
   - macOS: 打开 .dmg 文件，将 Ruck 拖入 Applications 文件夹
   - Windows: 运行 .exe 安装程序
   - Linux: `sudo dpkg -i ruck*.deb`

2. **首次启动**
   - 安装完成后，Ruck 会在后台运行
   - 默认快捷键：`Alt + R`（Windows/Linux）或 `Option + R`（macOS）
   - 按下快捷键呼起主窗口

3. **开始使用**
   - 在搜索框中输入应用名称或插件命令
   - 支持拼音搜索和缩写搜索
   - 按 `Enter` 打开选中的应用或插件

---

## 🚀 核心功能

### 1. 应用快速启动

支持拼音和缩写搜索系统已安装应用：

- 输入 `vscode` 或 `vs` → 打开 Visual Studio Code
- 输入 `weixin` 或 `wx` → 打开微信
- 输入 `chrome` 或 `gg` → 打开 Google Chrome

### 2. 插件系统

#### UI 插件

带界面的插件，在主窗口中显示：

```
计算器、翻译工具、待办事项、笔记、天气等
```

- 点击搜索框右侧的 Ruck 图标进入插件市场
- 浏览或搜索所需插件
- 点击下载按钮安装
- 输入插件呼起命令即可使用

#### 系统插件

后台运行的插件，可以扩展 Ruck 的核心功能：

```
快捷键扩展、主题插件、全局搜索增强等
```

> ⚠️ **注意**：系统插件安装成功后，需要重启 Ruck 才能生效

#### App 插件

本地应用的快速启动方式，自定义启动命令。

### 3. 数据同步

基于 WebDAV 的多端数据同步：

1. 在 Ruck 内搜索"偏好设置"
2. 进入"账户和设置" → "多端数据同步"
3. 配置 WebDAV 服务器信息
4. 点击"导出"同步数据到云端
5. 在其他设备上"导入"恢复数据

**支持同步的内容**：
- 插件配置和数据
- 历史记录
- 用户偏好设置

### 4. 插件分离

支持将插件从主窗口分离到独立窗口：

- 独立窗口可自由移动和调整大小
- 支持多个插件同时分离
- 保持插件持续运行

### 5. 快捷键定制

支持自定义全局快捷键：

- 主窗口显示/隐藏
- 截图
- 分离窗口
- 自定义快捷键触发特定功能

---

## 📚 文档

- [📐 架构文档](ARCHITECTURE.md) - 了解 Ruck 的整体架构和技术实现
- [🤝 贡献指南](CONTRIBUTING.md) - 参与 Ruck 的开发
- [🔌 插件开发文档](docs/plugin-development.md) - 学习如何开发 Ruck 插件
- [📘 API 文档](API.md) - 插件开发 API 参考
- [📖 用户指南](docs/user-guide.md) - 详细的使用说明

---

## 🔌 插件生态

### 官方插件仓库

[Ruck 插件仓库](https://github.com/iamxiaojianzheng/ruck-plugins) - 官方维护的插件集合

### 插件市场

[Ruck 插件数据库](https://github.com/iamxiaojianzheng/ruck-plugin-registry) - 社区插件注册中心

### 开发插件

想要开发自己的插件？查看 [插件开发文档](docs/plugin-development.md) 快速开始！

插件开发非常简单，只需：
1. 创建 npm 包
2. 添加 `plugin.json` 配置
3. 实现插件功能
4. 发布到 npm
5. 提交到插件市场

---

## 🛠️ 本地开发

### 环境要求

- Node.js >= 16.19.1
- npm >= 8.0.0 或 yarn >= 1.22.0

### 克隆项目

```bash
git clone https://github.com/iamxiaojianzheng/ruck.git
cd ruck
```

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

### 打包应用

```bash
npm run electron:build
# 或
yarn electron:build
```

详细的开发指南请参考 [贡献指南](CONTRIBUTING.md)。

---

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md) 了解如何参与项目开发。

### 贡献者

感谢所有为 Ruck 做出贡献的开发者！

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- 这里会自动生成贡献者列表 -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

---

## 💬 社区与支持

- [GitHub Issues](https://github.com/iamxiaojianzheng/ruck/issues) - 报告 Bug 或提出功能建议
- [GitHub Discussions](https://github.com/iamxiaojianzheng/ruck/discussions) - 交流讨论

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

---

## 🙏 致谢

Ruck 的开发受到以下项目的启发：

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Ant Design Vue](https://antdv.com/) - 企业级 UI 组件库

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/iamxiaojianzheng">JIAHE</a> and <a href="https://github.com/iamxiaojianzheng/ruck/graphs/contributors">contributors</a></sub>
</div>
