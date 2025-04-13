# index.html 文件说明

## 文件概述

`index.html` 文件是ExampleIM高级客户端的主页面，提供了一个完整的即时通讯Web客户端界面。该文件使用HTML、CSS和JavaScript构建，实现了用户认证、会话管理、消息发送和接收等功能。

## 页面结构

### 头部信息

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ExampleIM 高级客户端</title>
    <link rel="stylesheet" href="style.css">
</head>
```

设置页面编码、视口和样式表。

### 主要布局

页面采用三栏布局：

1. **左侧边栏**：显示用户信息、会话和联系人列表
   ```html
   <div class="sidebar">
       <div class="user-info">
           <!-- 用户信息 -->
       </div>
       <div class="tabs">
           <!-- 选项卡切换 -->
       </div>
       <div class="tab-content">
           <!-- 会话和联系人列表 -->
       </div>
   </div>
   ```

2. **中间内容区**：聊天窗口和欢迎界面
   ```html
   <div class="chat-container">
       <div id="welcomeScreen" class="welcome-screen">
           <!-- 欢迎界面和登录表单 -->
       </div>
       <div id="chatWindow" class="chat-window hidden">
           <!-- 聊天界面 -->
       </div>
   </div>
   ```

3. **右侧边栏**：详细信息和API设置
   ```html
   <div class="details-panel">
       <!-- 当前会话详情 -->
       <div class="api-settings">
           <!-- API配置选项 -->
       </div>
   </div>
   ```

### 功能组件

#### 用户认证组件

```html
<div class="auth-form" id="authForm">
    <h3>用户认证</h3>
    <div class="form-group">
        <label for="tokenInput">JWT Token:</label>
        <textarea id="tokenInput"></textarea>
    </div>
    <button id="loginBtn">登录</button>
</div>
```

处理用户JWT Token输入和登录认证。

#### 聊天窗口

```html
<div class="chat-header">
    <div class="chat-title" id="chatTitle">对话标题</div>
    <div class="chat-info" id="chatInfo">
        <span id="chatStatus">在线</span>
    </div>
</div>
<div class="message-list" id="messageList">
    <!-- 消息列表 -->
</div>
<div class="chat-input">
    <!-- 输入工具栏和发送按钮 -->
</div>
```

提供消息展示、输入和发送功能。

#### API设置

```html
<div class="api-settings">
    <h3>API设置</h3>
    <div class="form-group">
        <label for="apiBaseUrl">API服务地址:</label>
        <input type="text" id="apiBaseUrl" value="http://localhost:8888">
    </div>
    <div class="form-group">
        <label for="wsUrl">WebSocket地址:</label>
        <input type="text" id="wsUrl" value="ws://localhost:10090/ws">
    </div>
</div>
```

允许配置API和WebSocket服务器地址。

#### 日志面板

```html
<div class="log-panel">
    <div class="log-header">
        <h3>日志</h3>
        <button id="clearLogBtn">清除</button>
    </div>
    <pre id="logArea"></pre>
</div>
```

显示操作和连接日志信息。

### 脚本引用

```html
<!-- 工具脚本 -->
<script src="../utils/api.js"></script>
<script src="../utils/websocket-client.js"></script>

<!-- 主脚本 -->
<script src="app.js"></script>
```

引用API工具、WebSocket客户端和主应用脚本。

## 交互流程

1. 用户首先看到欢迎界面和登录表单
2. 输入JWT Token后点击登录按钮进行认证
3. 认证成功后显示会话列表
4. 选择会话后进入聊天界面
5. 可以在聊天界面发送和接收消息

## 响应式设计

页面采用现代CSS设计，支持响应式布局，适配不同设备尺寸。布局主要通过flex实现弹性分配空间。