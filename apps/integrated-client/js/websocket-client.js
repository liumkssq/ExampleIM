/**
 * WebSocket客户端 - 处理与服务器的实时通信
 */

import api from './api.js';

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = 3000; // 重连等待时间（毫秒）
    this.listeners = {
      message: [],
      connect: [],
      disconnect: [],
      error: []
    };
    this.isConnecting = false;
    this.shouldReconnect = true;
  }

  // 连接到WebSocket服务器
  connect() {
    if (this.isConnecting || this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    
    // 检查用户是否已登录
    if (!api.isLoggedIn()) {
      console.error('WebSocket连接失败: 用户未登录');
      this._triggerEvent('error', { message: '用户未登录，无法建立WebSocket连接' });
      this.isConnecting = false;
      return;
    }
    
    try {
      const wsUrl = api.getWebSocketUrl();
      this.socket = new WebSocket(wsUrl);
      
      // 设置事件处理器
      this.socket.onopen = this._handleOpen.bind(this);
      this.socket.onmessage = this._handleMessage.bind(this);
      this.socket.onclose = this._handleClose.bind(this);
      this.socket.onerror = this._handleError.bind(this);
    } catch (error) {
      console.error('WebSocket初始化错误:', error);
      this._triggerEvent('error', error);
      this.isConnecting = false;
    }
  }

  // 断开WebSocket连接
  disconnect(suppressEvents = false) {
    this.shouldReconnect = false;
    
    if (this.socket) {
      if (!suppressEvents) {
        this._triggerEvent('disconnect', { message: '客户端主动断开连接' });
      }
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnecting = false;
  }

  // 发送消息
  send(messageData) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this._triggerEvent('error', { message: '未连接到服务器，无法发送消息' });
      return false;
    }

    try {
      const message = typeof messageData === 'string' ? messageData : JSON.stringify(messageData);
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('消息发送错误:', error);
      this._triggerEvent('error', error);
      return false;
    }
  }

  // 发送文本消息的便捷方法
  sendTextMessage(targetId, content, isGroup = false) {
    const messageData = {
      type: 'text',
      targetId: targetId,
      content: content,
      isGroup: isGroup
    };
    
    return this.send(messageData);
  }

  // 监听事件
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return this;
  }

  // 移除事件监听
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }

  // 处理连接打开事件
  _handleOpen(event) {
    console.log('WebSocket连接已建立');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this._triggerEvent('connect', event);
  }

  // 处理接收消息事件
  _handleMessage(event) {
    console.log('收到WebSocket消息:', event.data);
    let parsedData;
    
    try {
      parsedData = JSON.parse(event.data);
    } catch (error) {
      console.warn('解析WebSocket消息失败:', error);
      parsedData = { raw: event.data };
    }
    
    this._triggerEvent('message', parsedData);
  }

  // 处理连接关闭事件
  _handleClose(event) {
    console.log(`WebSocket连接已关闭: 代码=${event.code}, 原因=${event.reason}`);
    this.isConnecting = false;
    this.socket = null;
    
    this._triggerEvent('disconnect', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    // 尝试重新连接
    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重新连接: 第${this.reconnectAttempts}次尝试...`);
      
      setTimeout(() => {
        if (this.shouldReconnect) {
          this.connect();
        }
      }, this.reconnectTimeout);
    }
  }

  // 处理错误事件
  _handleError(event) {
    console.error('WebSocket错误:', event);
    this._triggerEvent('error', event);
    this.isConnecting = false;
  }

  // 触发事件
  _triggerEvent(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`执行${eventName}事件回调时出错:`, error);
        }
      });
    }
  }

  // 检查连接状态
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// 单例模式
const wsClient = new WebSocketClient();
export default wsClient;