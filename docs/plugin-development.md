# Ruck 插件开发文档

本文档详细说明如何为 Ruck 开发插件。

## 📋 目录

- [插件类型](#插件类型)
- [快速开始](#快速开始)
- [plugin.json 配置](#pluginjson-配置)
- [插件 API](#插件-api)
- [生命周期钩子](#生命周期钩子)
- [调试技巧](#调试技巧)
- [发布插件](#发布插件)

---

## 🔌 插件类型

Ruck 支持三种插件类型：

### UI 插件

带界面的插件，在主窗口中显示。

**适用场景**：计算器、翻译工具、待办事项、笔记等

### System 插件

后台运行的插件，可以修改 Ruck 的行为。

**适用场景**：快捷键扩展、主题插件、全局搜索增强等

### App 插件

本地应用快速启动。

**适用场景**：常用应用的快速启动入口

---

## 🚀 快速开始

### 1. 创建插件项目

```bash
mkdir my-ruck-plugin
cd my-ruck-plugin
npm init -y
```

### 2. 创建 plugin.json

```json
{
  "name": "my-ruck-plugin",
  "pluginName": "我的插件",
  "version": "1.0.0",
  "description": "这是一个示例插件",
  "entry": "index.js",
  "main": "index.html",
  "logo": "logo.png",
  "pluginType": "ui",
  "features": [
    {
      "code": "hello",
      "explain": "Hello World",
      "cmds": ["hello", "你好"]
    }
  ]
}
```

### 3. 创建插件文件

**index.html**（UI 插件）：

```html
<!DOCTYPE html>
<html>
<head>
  <title>我的插件</title>
</head>
<body>
  <h1>Hello, Ruck!</h1>
  <script src="index.js"></script>
</body>
</html>
```

**index.js**（System 插件）：

```javascript
module.exports = () => {
  return {
    /**
     * 插件准备就绪时调用
     */
    onReady(ctx) {
      console.log('插件已加载');
      // ctx 包含 electron API 和主窗口引用
    }
  };
};
```

### 4. 本地测试

```bash
# 在 Ruck 插件目录创建软链接
cd /path/to/ruck/plugins
npm link /path/to/my-ruck-plugin
```

重启 Ruck，在搜索框输入 "hello" 即可看到您的插件。

---

## ⚙️ plugin.json 配置

完整的配置说明：

```json
{
  "name": "plugin-name",           // 插件包名（必需）
  "pluginName": "插件显示名称",     // 显示名称（必需）
  "version": "1.0.0",              // 版本号（必需）
  "description": "插件描述",        // 描述
  "entry": "index.js",             // System 插件入口文件
  "main": "index.html",            // UI 插件主页面
  "logo": "logo.png",              // 插件图标
  "pluginType": "ui",              // 插件类型：ui/system/app
  "platform": ["darwin", "win32"], // 支持的平台（可选）
  "features": [                    // 功能列表
    {
      "code": "hello",             // 功能代码
      "explain": "说明文字",        // 功能说明
      "cmds": ["hello", "你好"]    // 触发命令
    }
  ]
}
```

---

## 📘 插件 API

### window.rubick

Ruck 在插件中注入了 `window.rubick` 全局对象。

#### 窗口操作

```javascript
// 隐藏主窗口
window.rubick.hideMainWindow();

// 显示主窗口
window.rubick.showMainWindow();

// 设置窗口高度
window.rubick.setExpendHeight(600);
```

#### 数据库操作

```javascript
// 存储数据
window.rubick.db.put({
  _id: 'my-data',
  data: { foo: 'bar' }
});

// 读取数据
const doc = window.rubick.db.get('my-data');
console.log(doc.data); // { foo: 'bar' }

// 删除数据
window.rubick.db.remove('my-data');
```

#### 剪贴板操作

```javascript
// 复制文本
window.rubick.copyText('Hello, World!');

// 复制图片
window.rubick.copyImage(dataURL);

// 复制文件
window.rubick.copyFile(['/path/to/file']);
```

#### 系统通知

```javascript
window.rubick.showNotification('Hello, Ruck!');
```

#### 子输入框

```javascript
// 设置子输入框
window.rubick.setSubInput({
  placeholder: '请输入...'
}, (data) => {
  console.log('子输入框内容:', data);
});

// 移除子输入框
window.rubick.removeSubInput();
```

---

## 🔄 生命周期钩子

### System 插件钩子

```javascript
module.exports = () => {
  return {
    /**
     * 插件准备就绪
     * @param ctx 包含 electron API 和主窗口
     */
    onReady(ctx) {
      const { electron, mainWindow, API } = ctx;
      // 初始化代码
    }
  };
};
```

### UI 插件钩子

```javascript
// 监听插件显示
window.rubick.onPluginEnter(() => {
  console.log('插件已显示');
});

// 监听插件隐藏
window.rubick.onPluginOut(() => {
  console.log('插件已隐藏');
});
```

---

## 🐛 调试技巧

### 打开开发者工具

在 Ruck 中输入插件命令，打开插件后：

1. 点击插件右上角的菜单
2. 选择"打开开发者工具"

或使用快捷键（取决于配置）。

### 日志输出

```javascript
console.log('调试信息');
```

日志会显示在开发者工具的 Console 面板中。

---

## 📦 发布插件

### 1. 准备工作

确保您的插件：
- ✅ 有完整的 `plugin.json`
- ✅ 有README说明
- ✅ 有适当的许可证
- ✅ 版本号符合语义化版本规范

### 2. 发布到 npm

```bash
npm publish
```

### 3. 提交到插件市场

在 [Ruck 插件数据库](https://github.com/iamxiaojianzheng/ruck-plugin-registry) 提交 PR，添加您的插件信息。

---

完整示例请参考 [Ruck 插件仓库](https://github.com/iamxiaojianzheng/ruck-plugins)。
