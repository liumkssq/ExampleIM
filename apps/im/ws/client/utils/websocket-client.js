/**
 * ExampleIM WebSocket客户端工具
 * 基于服务端的 websocket/message.go 和 server.go 实现
 */

// WebSocket消息类型
const FrameType = {
    DATA: 0,     // 数据帧
    PING: 1,     // 心跳Ping
    ACK: 2,      // 确认帧
    NO_ACK: 3,   // 无需确认帧
    ERROR: 9     // 错误帧
};

/**
 * WebSocket客户端类
 */
class ImWebSocketClient {
    /**
     * 构造函数
     * @param {string} serverUrl - WebSocket服务器URL
     * @param {string} token - JWT令牌
     * @param {string} userId - 用户ID
     */
    constructor(serverUrl, token, userId) {
        this.serverUrl = serverUrl;
        this.token = token;
        this.userId = userId;
        this.socket = null;
        this.messageId = 1;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000; // 3秒
        this.handlers = {
            'user.online': [],
            'conversation.chat': [],
            'push': [],
            'error': [],
            'connect': [],
            'disconnect': []
        };
        this.isConnected = false;
        this.autoReconnect = true;
    }

    /**
     * 连接到WebSocket服务器
     * @param {boolean} useHeader - 是否使用请求头传递Token（默认使用请求头）
     * @returns {Promise} 连接结果的Promise
     */
    connect(useHeader = true) {
        return new Promise((resolve, reject) => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                resolve({ message: '已经连接到服务器' });
                return;
            }

            let wsUrl = this.serverUrl;
            
            try {
                // 创建WebSocket连接
                if (useHeader) {
                    // 尝试使用fetch API创建一个服务器协商的WebSocket连接
                    this._connectWithBearer(wsUrl, resolve, reject);
                } else {
                    // 使用URL参数传递Token方式
                    wsUrl = `${this.serverUrl}?token=${encodeURIComponent(this.token)}&userId=${encodeURIComponent(this.userId)}`;
                    console.log(`尝试连接WebSocket: ${wsUrl}`);
                    this._createWebSocket(wsUrl, resolve, reject);
                }
            } catch (error) {
                this._triggerHandlers('error', { 
                    message: '创建WebSocket连接时出错',
                    error 
                });
                reject(error);
            }
        });
    }

    /**
     * 使用Bearer令牌方式连接WebSocket
     * @private
     */
    _connectWithBearer(wsUrl, resolve, reject) {
        // 创建一个HTTP请求，以Bearer方式发送认证请求
        fetch(wsUrl.replace('ws:', 'http:').replace('wss:', 'https:'), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
        .then(response => {
            if (response.status === 101) {
                // 协议升级成功，服务器支持直接的WebSocket连接
                console.log('服务器支持WebSocket协议升级');
            } else if (response.status === 200) {
                // 连接获取成功，但我们需要建立WebSocket
                console.log('HTTP连接成功，尝试WebSocket协议升级');
            } else {
                console.log(`HTTP认证状态: ${response.status}`);
            }
            
            // 无论状态如何，我们都尝试使用参数方式进行连接
            const fallbackUrl = `${this.serverUrl}?token=${encodeURIComponent(this.token)}&userId=${encodeURIComponent(this.userId)}`;
            console.log(`尝试连接WebSocket(回退模式): ${fallbackUrl}`);
            this._createWebSocket(fallbackUrl, resolve, reject);
        })
        .catch(error => {
            console.error('HTTP认证失败，尝试参数方式连接', error);
            // 认证请求失败，回退到参数方式
            const fallbackUrl = `${this.serverUrl}?token=${encodeURIComponent(this.token)}&userId=${encodeURIComponent(this.userId)}`;
            console.log(`尝试连接WebSocket(回退模式): ${fallbackUrl}`);
            this._createWebSocket(fallbackUrl, resolve, reject);
        });
    }

    /**
     * 创建WebSocket连接
     * @private
     */
    _createWebSocket(url, resolve, reject) {
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this._triggerHandlers('connect', { userId: this.userId });
            console.log('连接成功，发送用户上线消息');
            
            // 发送用户上线消息
            this.sendMessage('user.online', {
                userId: this.userId
            });
            
            resolve({ success: true, message: '连接成功' });
        };
        
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this._handleMessage(message);
            } catch (error) {
                console.error('解析消息错误', error);
            }
        };
        
        this.socket.onclose = (event) => {
            this.isConnected = false;
            this._triggerHandlers('disconnect', { 
                code: event.code, 
                reason: event.reason || '未知原因' 
            });
            
            if (this.autoReconnect) {
                this._handleReconnect();
            }
        };
        
        this.socket.onerror = (error) => {
            this._triggerHandlers('error', { 
                message: '连接错误',
                error 
            });
            reject(error);
        };
    }

    /**
     * 处理重连逻辑
     * @private
     */
    _handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect().catch(() => {
                    console.log('重连失败');
                });
            }, this.reconnectInterval);
        } else {
            console.error(`达到最大重连次数 (${this.maxReconnectAttempts})`);
        }
    }

    /**
     * 断开WebSocket连接
     */
    disconnect() {
        if (this.socket) {
            this.autoReconnect = false; // 禁用自动重连
            this.socket.close();
            this.socket = null;
        }
    }

    /**
     * 发送WebSocket消息
     * @param {string} method - 消息方法
     * @param {Object} data - 消息数据
     * @returns {string} 消息ID
     */
    sendMessage(method, data) {
        if (!this.isConnected) {
            throw new Error('WebSocket未连接');
        }
        
        const messageId = String(this.messageId++);
        const message = {
            frameType: FrameType.DATA,
            id: messageId,
            method: method,
            data: data
        };
        
        this.socket.send(JSON.stringify(message));
        return messageId;
    }

    /**
     * 发送聊天消息
     * @param {string} conversationId - 会话ID
     * @param {string} recvId - 接收者ID
     * @param {number} chatType - 聊天类型，1=单聊，2=群聊
     * @param {string} content - 消息内容
     * @param {string} msgType - 消息类型，text/image/video等
     * @returns {string} 消息ID
     */
    sendChatMessage(conversationId, recvId, chatType, content, msgType = 'text') {
        return this.sendMessage('conversation.chat', {
            conversationId: conversationId,
            chatType: chatType,
            recvId: recvId,
            msg: {
                mType: msgType,
                content: content
            },
            sendTime: Date.now()
        });
    }

    /**
     * 发送推送消息
     * @param {string} conversationId - 会话ID
     * @param {string} recvId - 接收者ID
     * @param {number} chatType - 聊天类型，1=单聊，2=群聊
     * @param {string} content - 消息内容
     * @param {string} msgType - 消息类型，text/image/video等
     * @returns {string} 消息ID
     */
    sendPushMessage(conversationId, recvId, chatType, content, msgType = 'text') {
        return this.sendMessage('push', {
            conversationId: conversationId,
            chatType: chatType,
            recvId: recvId,
            sendId: this.userId,
            mType: msgType,
            content: content,
            sendTime: Date.now()
        });
    }

    /**
     * 添加事件处理函数
     * @param {string} event - 事件名称
     * @param {Function} handler - 处理函数
     */
    on(event, handler) {
        if (this.handlers[event]) {
            this.handlers[event].push(handler);
        } else {
            this.handlers[event] = [handler];
        }
    }

    /**
     * 移除事件处理函数
     * @param {string} event - 事件名称
     * @param {Function} handler - 处理函数
     */
    off(event, handler) {
        if (this.handlers[event]) {
            if (handler) {
                this.handlers[event] = this.handlers[event].filter(h => h !== handler);
            } else {
                this.handlers[event] = [];
            }
        }
    }

    /**
     * 触发事件处理函数
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     * @private
     */
    _triggerHandlers(event, data) {
        if (this.handlers[event]) {
            this.handlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`处理 ${event} 事件时出错:`, error);
                }
            });
        }
    }

    /**
     * 处理收到的WebSocket消息
     * @param {Object} message - 消息对象
     * @private
     */
    _handleMessage(message) {
        // 根据frameType处理不同类型的消息
        switch (message.frameType) {
            case FrameType.DATA:
                // 处理业务消息
                if (message.method && this.handlers[message.method]) {
                    this._triggerHandlers(message.method, message.data);
                }
                break;
                
            case FrameType.PING:
                // 处理心跳消息
                this.socket.send(JSON.stringify({
                    frameType: FrameType.PING
                }));
                break;
                
            case FrameType.ERROR:
                // 处理错误消息
                this._triggerHandlers('error', {
                    message: '收到错误消息',
                    data: message.data
                });
                break;
                
            case FrameType.ACK:
                // 处理ACK消息
                console.log('收到ACK:', message);
                break;
        }
    }
}

// 导出
window.ImWebSocketClient = ImWebSocketClient;