// WebSocket客户端，处理消息通信
class WebSocketClient {
  constructor(wsUrl) {
    // 配置
    this.wsUrl = wsUrl;
    this.connection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.pingInterval = 30000;
    this.pingTimer = null;
    this.reconnectTimer = null;
    this.messageHandlers = {};
    this.connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'reconnecting', 'failed'
    
    // 绑定方法
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.send = this.send.bind(this);
    this.sendPing = this.sendPing.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }
  
  // 连接WebSocket
  connect() {
    if (this.connection && (this.connection.readyState === WebSocket.CONNECTING || 
                            this.connection.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }
    
    this.connectionState = 'connecting';
    this.triggerStateChange();
    
    return new Promise((resolve, reject) => {
      try {
        this.connection = new WebSocket(this.wsUrl);
        
        // 注册一次性解析处理程序
        const onOpenOnce = () => {
          resolve();
          this.connection.removeEventListener('open', onOpenOnce);
          this.connection.removeEventListener('error', onErrorOnce);
        };
        
        const onErrorOnce = (error) => {
          reject(error);
          this.connection.removeEventListener('open', onOpenOnce);
          this.connection.removeEventListener('error', onErrorOnce);
        };
        
        this.connection.addEventListener('open', onOpenOnce);
        this.connection.addEventListener('error', onErrorOnce);
        
        // 注册常规事件处理程序
        this.connection.addEventListener('open', this.handleOpen);
        this.connection.addEventListener('message', this.handleMessage);
        this.connection.addEventListener('error', this.handleError);
        this.connection.addEventListener('close', this.handleClose);
      } catch (error) {
        this.connectionState = 'failed';
        this.triggerStateChange();
        reject(error);
      }
    });
  }
  
  // 断开连接
  disconnect() {
    this.clearTimers();
    
    if (this.connection) {
      // 移除所有事件监听器
      this.connection.removeEventListener('open', this.handleOpen);
      this.connection.removeEventListener('message', this.handleMessage);
      this.connection.removeEventListener('error', this.handleError);
      this.connection.removeEventListener('close', this.handleClose);
      
      if (this.connection.readyState === WebSocket.OPEN || 
          this.connection.readyState === WebSocket.CONNECTING) {
        this.connection.close(1000, "用户主动断开连接");
      }
      
      this.connection = null;
      this.connectionState = 'disconnected';
      this.triggerStateChange();
    }
    
    this.reconnectAttempts = 0;
  }
  
  // 重新连接
  reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.connectionState = 'failed';
      this.triggerStateChange();
      console.error('WebSocket: 达到最大重连次数, 连接失败');
      return Promise.reject(new Error('达到最大重连次数'));
    }
    
    this.reconnectAttempts++;
    this.connectionState = 'reconnecting';
    this.triggerStateChange();
    
    console.log(`WebSocket: 尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    return this.connect().catch(error => {
      // 如果连接失败，安排下一次尝试
      return new Promise((resolve, reject) => {
        this.reconnectTimer = setTimeout(() => {
          this.reconnect().then(resolve).catch(reject);
        }, this.reconnectInterval);
      });
    });
  }
  
  // 发送消息
  send(message) {
    return new Promise((resolve, reject) => {
      if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket未连接'));
        return;
      }
      
      try {
        // 如果message不是字符串，转换为JSON
        const messageString = typeof message === 'string' 
          ? message 
          : JSON.stringify(message);
        
        this.connection.send(messageString);
        resolve();
      } catch (error) {
        console.error('发送消息失败:', error);
        reject(error);
      }
    });
  }
  
  // 发送ping消息保持连接
  sendPing() {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      this.send({ type: 'ping' }).catch(error => {
        console.warn('发送ping失败:', error);
      });
    }
  }
  
  // 注册消息处理程序
  onMessage(type, handler) {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    this.messageHandlers[type].push(handler);
    
    // 返回取消订阅函数
    return () => {
      if (this.messageHandlers[type]) {
        const index = this.messageHandlers[type].indexOf(handler);
        if (index !== -1) {
          this.messageHandlers[type].splice(index, 1);
        }
      }
    };
  }
  
  // 注册状态变化处理程序
  onStateChange(handler) {
    if (!this.stateChangeHandlers) {
      this.stateChangeHandlers = [];
    }
    this.stateChangeHandlers.push(handler);
    
    // 立即调用一次当前状态
    handler(this.connectionState);
    
    // 返回取消订阅函数
    return () => {
      if (this.stateChangeHandlers) {
        const index = this.stateChangeHandlers.indexOf(handler);
        if (index !== -1) {
          this.stateChangeHandlers.splice(index, 1);
        }
      }
    };
  }
  
  // 触发状态变化事件
  triggerStateChange() {
    if (this.stateChangeHandlers) {
      this.stateChangeHandlers.forEach(handler => {
        try {
          handler(this.connectionState);
        } catch (error) {
          console.error('状态变化处理错误:', error);
        }
      });
    }
  }
  
  // 清除所有定时器
  clearTimers() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  // WebSocket事件处理程序
  handleOpen(event) {
    console.log('WebSocket连接已建立');
    this.reconnectAttempts = 0;
    this.connectionState = 'connected';
    this.triggerStateChange();
    
    // 设置ping间隔
    this.clearTimers();
    this.pingTimer = setInterval(this.sendPing, this.pingInterval);
  }
  
  handleMessage(event) {
    let message;
    
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.error('解析WebSocket消息失败:', error);
      return;
    }
    
    // 处理消息
    const messageType = message.type || 'unknown';
    
    // 自动响应pong
    if (messageType === 'ping') {
      this.send({ type: 'pong' }).catch(console.error);
      return;
    }
    
    // 调用注册的消息处理程序
    if (this.messageHandlers[messageType]) {
      this.messageHandlers[messageType].forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`处理消息类型 ${messageType} 时出错:`, error);
        }
      });
    }
    
    // 调用全局消息处理程序
    if (this.messageHandlers['*']) {
      this.messageHandlers['*'].forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('处理全局消息时出错:', error);
        }
      });
    }
  }
  
  handleError(event) {
    console.error('WebSocket错误:', event);
  }
  
  handleClose(event) {
    this.clearTimers();
    console.log(`WebSocket连接关闭: 代码=${event.code}, 原因=${event.reason}`);
    
    // 非正常关闭，尝试重新连接
    if (event.code !== 1000) {
      this.reconnect().catch(error => {
        console.error('WebSocket重连失败:', error);
      });
    } else {
      this.connectionState = 'disconnected';
      this.triggerStateChange();
    }
  }
}

export default WebSocketClient;