# 贡献指南

欢迎为 Ruck 项目做出贡献！本文档将指导您如何参与 Ruck 的开发。

## 📋 目录

- [开发环境搭建](#开发环境搭建)
- [项目结构](#项目结构)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [PR 流程](#pr-流程)
- [测试要求](#测试要求)

---

## 🛠️ 开发环境搭建

### 前置要求

- **Node.js**: >= 16.19.1
- **npm**: >= 8.0.0 (或 yarn >= 1.22.0)
- **操作系统**: macOS、Windows 或 Linux

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

### 子应用依赖安装

Ruck 包含多个子应用，需要分别安装依赖：

```bash
# 安装插件市场依赖
cd feature && yarn install && cd ..

# 安装分离窗口依赖
cd detach && yarn install && cd ..

# 安装模板依赖
cd tpl && yarn install && cd ..

# 安装引导页依赖
cd guide && yarn install && cd ..
```

### 启动开发服务器

#### 主应用

```bash
npm run dev
# 或
yarn dev
```

这将启动 Electron 应用的开发模式。

#### 子应用开发

```bash
# 开发插件市场
npm run feature:dev

# 开发分离窗口
npm run detach:dev

# 开发模板
npm run tpl:dev

# 开发引导页
npm run guide:dev
```

---

## 📁 项目结构

详细的项目结构说明请参考 [架构文档](ARCHITECTURE.md#目录结构)。

**核心目录**：
- `src/main/` - 主进程代码
- `src/renderer/` - 渲染进程代码
- `src/core/` - 核心功能模块
- `src/common/` - 公共代码
- `feature/` - 插件市场子应用
- `detach/` - 分离窗口子应用

---

## 🔄 开发流程

### 1. 创建分支

从 `main` 分支创建新的功能分支：

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

**分支命名规范**：
- `feature/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `docs/xxx` - 文档更新
- `refactor/xxx` - 代码重构
- `test/xxx` - 测试相关

### 2. 开发

在您的分支上进行开发，遵循以下原则：

- **保持简洁**：避免过度工程化
- **单一职责**：每个 PR 只解决一个问题
- **测试优先**：编写测试用例
- **文档同步**：更新相关文档

### 3. 测试

在提交之前，请确保：

- ✅ 代码可以正常运行
- ✅ 没有 ESLint 错误
- ✅ 没有 TypeScript 类型错误
- ✅ 新功能有对应的测试用例
- ✅ 所有测试通过

```bash
# 运行 lint
npm run lint

# 运行测试（如果有）
npm test
```

### 4. 提交

提交代码前，请确保遵循[提交规范](#提交规范)。

```bash
git add .
git commit -m "feat: 添加新功能"
```

### 5. 推送

```bash
git push origin feature/your-feature-name
```

### 6. 创建 Pull Request

在 GitHub 上创建 Pull Request，详见 [PR 流程](#pr-流程)。

---

## 📝 代码规范

### TypeScript / JavaScript

**ESLint 配置**：项目使用 ESLint 和 Prettier 进行代码格式化。

**规则**：
- 使用 TypeScript 编写新代码
- 优先使用 `const`，其次 `let`，避免使用 `var`
- 使用箭头函数
- 使用模板字符串而不是字符串拼接
- 避免使用 `any` 类型（除非必要）

**示例**：

```typescript
// ✅ 好的做法
const getUserName = (user: User): string => {
  return `${user.firstName} ${user.lastName}`;
};

// ❌ 避免
var getUserName = function(user: any) {
  return user.firstName + ' ' + user.lastName;
};
```

### Vue 组件

- 使用 Composition API（Vue 3）
- 组件名使用 PascalCase
- Props 使用 camelCase
- 事件名使用 kebab-case

```vue
<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  title: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'item-click': [id: number];
}>();

const handleClick = () => {
  emit('item-click', 123);
};
</script>
```

### 注释

- **模块级注释**：每个文件开头添加模块说明
- **函数注释**：使用 JSDoc 格式
- **中文注释**：所有注释使用简体中文
- **注释内容**：说明"为什么"，而不仅仅是"做什么"

```typescript
/**
 * 注册所有全局快捷键
 * 
 * 本函数是快捷键注册的入口点，负责：
 * 1. 设置开机启动
 * 2. 设置暗黑模式和主题
 * 3. 注册主窗口显示/隐藏快捷键
 * 
 * @param mainWindow 主窗口实例
 * @param API API 实例
 */
const registerHotKey = (mainWindow: BrowserWindow, API: any): void => {
  // 实现...
};
```

### 文件命名

- TypeScript/JavaScript 文件：`camelCase.ts`
- Vue 组件：`PascalCase.vue`
- 样式文件：`kebab-case.css` / `kebab-case.less`
- 常量文件：`UPPER_CASE.ts`

---

## 📮 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（类型）

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### Scope（范围）

可选，表示影响范围：
- `main`: 主进程
- `renderer`: 渲染进程
- `plugin`: 插件系统
- `ui`: 用户界面
- `docs`: 文档

### Subject（主题）

简短描述，不超过 50 个字符。

### 示例

```bash
# 新功能
git commit -m "feat(plugin): 添加插件自动更新功能"

# Bug 修复
git commit -m "fix(main): 修复主窗口无法隐藏的问题"

# 文档更新
git commit -m "docs: 更新插件开发文档"

# 重构
git commit -m "refactor(renderer): 重构插件管理器代码结构"
```

---

## 🔀 PR 流程

### 1. 创建 Pull Request

在 GitHub 上创建 Pull Request，填写以下信息：

**PR 标题**：遵循提交规范格式

```
feat(plugin): 添加插件自动更新功能
```

**PR 描述**：包含以下内容

```markdown
## 变更类型
- [ ] Bug 修复
- [x] 新功能
- [ ] 重构
- [ ] 文档更新

## 变更说明
添加了插件自动更新功能，每次打开插件时会检查是否有新版本。

## 测试
- [x] 本地测试通过
- [x] 没有 ESLint 错误
- [x] 类型检查通过

## 相关 Issue
Closes #123

## 截图（如果有）
（贴上截图）
```

### 2. Code Review

等待项目维护者进行代码审查。

**审查要点**：
- 代码质量
- 测试覆盖
- 文档完整性
- 性能影响

### 3. 修改反馈

根据审查意见修改代码，然后推送更新：

```bash
git add .
git commit -m "refactor: 根据 review 意见优化代码"
git push origin feature/your-feature-name
```

### 4. 合并

审查通过后，维护者会合并 PR。

---

## ✅ 测试要求

### 单元测试

（待完善）目前项目还没有完整的测试框架，欢迎贡献。

### 手动测试清单

在提交 PR 前，请手动测试以下功能：

**基本功能**：
- [ ] 应用可以正常启动
- [ ] 主窗口可以通过快捷键呼起
- [ ] 可以搜索系统应用
- [ ] 可以安装插件
- [ ] 可以卸载插件
- [ ] 可以打开插件
- [ ] 可以关闭插件

**插件相关**：
- [ ] UI 插件可以正常显示
- [ ] 系统插件可以正常加载
- [ ] App 插件可以正常启动应用
- [ ] 插件分离功能正常
- [ ] 插件历史记录正常

**系统集成**：
- [ ] 剪贴板功能正常
- [ ] 截图功能正常
- [ ] 系统通知正常
- [ ] 文件对话框正常

---

## 🌍 国际化

Ruck 支持多语言，请在添加新文本时考虑国际化。

（待完善）目前还没有完整的 i18n 支持，欢迎贡献。

---

## 📚 参考资源

- [Electron 文档](https://www.electronjs.org/docs)
- [Vue 3 文档](https://cn.vuejs.org/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Ant Design Vue 文档](https://antdv.com/)

---

## ❓ 遇到问题？

如果在开发过程中遇到问题：

1. 查看 [常见问题解答](docs/FAQ.md)
2. 搜索 [GitHub Issues](https://github.com/iamxiaojianzheng/ruck/issues)
3. 创建新的 Issue 提问

---

## 📝 许可证

通过贡献代码，您同意您的贡献将在 [MIT License](LICENSE) 下发布。

---

感谢您对 Ruck 的贡献！🎉
