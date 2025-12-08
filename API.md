# Ruck API 文档

本文档列出了 Ruck 提供的所有 API 接口。

## 📋 目录

- [渲染进程 API (window.rubick)](#渲染进程-api)
- [主进程 API](#主进程-api)
- [IPC 通信接口](#ipc-通信接口)

---

## 🎨 渲染进程 API

`window.rubick` 对象在渲染进程（主窗口和插件）中可用。

### 窗口操作

#### `hide MainWindow()`
隐藏主窗口。

```javascript
window.rubick.hideMainWindow();
```

#### `showMainWindow()`
显示主窗口。

```javascript
window.rubick.showMainWindow();
```

#### `setExpendHeight(height: number)`
设置窗口高度。

**参数**：
- `height`: 窗口高度（像素）

```javascript
window.rubick.setExpendHeight(600);
```

---

### 插件操作

#### `openPlugin(plugin: PluginInfo)`
打开指定插件。

```javascript
window.rubick.openPlugin({
  name: 'plugin-name',
  pluginType: 'ui'
});
```

#### `removePlugin()`
关闭当前插件。

```javascript
window.rubick.removePlugin();
```

---

### 数据库操作

#### `db.put(doc: any)`
存储文档。

```javascript
window.rubick.db.put({
  _id: 'my-data',
  data: { key: 'value' }
});
```

#### `db.get(id: string)`
获取文档。

```javascript
const doc = window.rubick.db.get('my-data');
```

#### `db.remove(id: string)`
删除文档。

```javascript
window.rubick.db.remove('my-data');
```

---

### 剪贴板操作

#### `copyText(text: string)`
复制文本到剪贴板。

```javascript
window.rubick.copyText('Hello, World!');
```

#### `copyImage(dataURL: string)`
复制图片到剪贴板。

```javascript
window.rubick.copyImage('data:image/png;base64,...');
```

#### `copyFile(paths: string[])`
复制文件到剪贴板。

```javascript
window.rubick.copyFile(['/path/to/file.txt']);
```

---

### 系统操作

#### `showNotification(message: string)`
显示系统通知。

```javascript
window.rubick.showNotification('任务完成！');
```

#### `shellShowItemInFolder(path: string)`
在文件管理器中显示文件。

```javascript
window.rubick.shellShowItemInFolder('/path/to/file');
```

---

### 子输入框

#### `setSubInput(options, callback)`
设置子输入框。

```javascript
window.rubick.setSubInput({
  placeholder: '请输入...'
}, (text) => {
  console.log('输入:', text);
});
```

#### `removeSubInput()`
移除子输入框。

```javascript
window.rubick.removeSubInput  ();
```

---

## 🖥️ 主进程 API

主进程 API 通过 IPC 调用。

### 插件管理

- `plugin:install` - 安装插件
- `plugin:uninstall` - 卸载插件
- `plugin:update` - 更新插件
- `plugin:list` - 列出已安装插件

### 配置管理

- `config:get` - 获取配置
- `config:set` - 设置配置

---

完整的 API 列表请参考源代码中的 JSDoc 注释。
