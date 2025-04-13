/**
 * ExampleIM 统一客户端
 * 整合了用户认证、API调用和WebSocket连接
 */

// 常量定义
const CLIENT_CONFIG = {
    // API服务配置
    API: {
        BASE_URL: 'http://localhost:8888',
        ENDPOINTS: {
            LOGIN: '/v1/user/login',
            REGISTER: '/v1/user/register',
            USER_INFO: '/v1/user/user',
            CHATLOG: '/v1/im/chatlog',
            SETUP_CONVERSATION: '/v1/im/setup/conversation',
            CONVERSATION: '/v1/im/conversation'
        }
    },
    
    // WebSocket配置
    WS: {
        URL: 'ws://localhost:10090/ws'
    },
    
    // 消息类型
    MSG_TYPE: {
        TEXT: 1,    // 文本消息
        IMAGE: 2,   // 图片消息
        VIDEO: 3,   // 视频消息
        FILE: 4     // 文件消息
    },
    
    // 聊天类型
    CHAT_TYPE: {
        SINGLE: 1,  // 单聊
        GROUP: 2    // 群聊
    },
    
    // WebSocket消息类型
    FRAME_TYPE: {
        DATA: 0,    // 数据帧
        PING: 1,    // 心跳Ping
        ACK: 2,     // 确认帧
        NO_ACK: 3,  // 无需确认帧
        ERROR: 9    // 错误帧
    }
};

/**
 * 统一客户端类
 */
class UnifiedClient {
    /**
     * 构造函数
     * @param {Object} config - 配置对象
     */
    constructor(config = {}) {
        this.config = Object.assign({}, CLIENT_CONFIG, config);
        this.token = null;
        this.userId = null;
        this.userInfo = null;
        this.socket = null;
        this.messageId = 1;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.isConnected = false;
        this.autoReconnect = true;
        
        // 事件处理程序
        this.handlers = {
            'user.online': [],
            'conversation.chat': [],
            'push': [],
            'error': [],
            'connect': [],
            'disconnect': []
        };
    }
    
    /**
     * 使用账号密码登录
     * @param {string} mobile - 手机号
     * @param {string} password - 密码
     * @returns {Promise<Object>} - 登录结果
     */
    async login(mobile, password) {
        try {
            const url = `${this.config.API.BASE_URL}${this.config.API.ENDPOINTS.LOGIN}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mobile, password })
            });
            
            if (!response.ok) {
                throw new Error(`登录失败: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result && result.token) {
                this.token = result.token;
                this.userId = this._parseUserId(result.token);
                await this.fetchUserInfo();
                return { success: true, userInfo: this.userInfo };
            } else {
                throw new Error('登录失败: 未获取到Token');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 使用Token登录
     * @param {string} token - JWT Token
     * @returns {Promise<Object>} - 登录结果
     */
    async loginWithToken(token) {
        try {
            if (!token || token.trim() === '') {
                throw new Error('Token不能为空');
            }
            
            this.token = token;
            this.userId = this._parseUserId(token);
            
            if (!this.userId) {
                throw new Error('从Token解析用户ID失败');
            }
            
            await this.fetchUserInfo();
            return { success: true, userInfo: this.userInfo };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 从JWT Token解析用户ID
     * @param {string} token - JWT Token
     * @returns {string} - 用户ID
     * @private
     */
    _parseUserId(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('无效的JWT Token格式');
            }
            
            const payload = JSON.parse(atob(parts[1]));
            return payload['imooc.com'] || null;
        } catch (error) {
            console.error('解析Token错误:', error);
            return null;
        }
    }
    
    /**
     * 获取用户信息
     * @returns {Promise<Object>} - 用户信息
     */
    async fetchUserInfo() {
        try {
            if (!this.token) {
                throw new Error('未登录，请先登录');
            }
            
            const url = `${this.config.API.BASE_URL}${this.config.API.ENDPOINTS.USER_INFO}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取用户信息失败: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result && result.info) {
                this.userInfo = result.info;
                return this.userInfo;
            } else {
                throw new Error('获取用户信息失败: 返回数据格式错误');
            }
        } catch (error) {
            console.error('获取用户信息错误:', error);
            throw error;
        }
    }
    
    /**
     * 执行API请求
     * @param {string} endpoint - API端点
     * @param {string} method - HTTP方法
     * @param {Object} data - 请求数据
     * @returns {Promise<Object>} - 响应结果
     */
    async request(endpoint, method = 'GET', data = null) {
        try {
            if (!this.token && endpoint !== this.config.API.ENDPOINTS.LOGIN && endpoint !== this.config.API.ENDPOINTS.REGISTER) {
                throw new Error('未登录，请先登录');
            }
            
            const url = `${this.config.API.BASE_URL}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (this.token) {
                options.headers['Authorization'] = `Bearer ${this.token}`;
            }
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }
    
    /**
     * 建立WebSocket连接
     * @returns {Promise<Object>} - 连接结果
     */
    connectWebSocket() {
        return new Promise((resolve, reject) => {
            if (!this.token || !this.userId) {
                reject(new Error('未登录，请先登录'));
                return;
            }
            
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                resolve({ success: true, message: '已连接' });
                return;
            }
            
            try {
                // 使用URL参数传递Token和userId
                const wsUrl = `${this.config.WS.URL}?token=${encodeURIComponent(this.token)}&userId=${encodeURIComponent(this.userId)}`;
                console.log(`正在连接WebSocket: ${wsUrl}`);
                
                this.socket = new WebSocket(wsUrl);
                
                this.socket.onopen = () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this._triggerHandlers('connect', { userId: this.userId });
                    
                    // 发送用户上线消息
                    this.sendWebSocketMessage('user.online', { userId: this.userId });
                    
                    resolve({ success: true, message: '连接成功' });
                };
                
                this.socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this._handleWebSocketMessage(message);
                    } catch (error) {
                        console.error('解析WebSocket消息错误:', error);
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
                        message: 'WebSocket连接错误',
                        error
                    });
                    reject(error);
                };
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
     * 处理WebSocket重连
     * @private
     */
    _handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connectWebSocket().catch(() => {
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
    disconnectWebSocket() {
        if (this.socket) {
            this.autoReconnect = false;
            this.socket.close();
            this.socket = null;
            this.isConnected = false;
        }
    }
    
    /**
     * 发送WebSocket消息
     * @param {string} method - 消息方法
     * @param {Object} data - 消息数据
     * @returns {string} - 消息ID
     */
    sendWebSocketMessage(method, data) {
        if (!this.isConnected || !this.socket) {
            throw new Error('WebSocket未连接');
        }
        
        const messageId = String(this.messageId++);
        const message = {
            frameType: this.config.FRAME_TYPE.DATA,
            id: messageId,
            method: method,
            data: data
        };
        
        this.socket.send(JSON.stringify(message));
        return messageId;
    }
    
    /**
     * 处理收到的WebSocket消息
     * @param {Object} message - 消息对象
     * @private
     */
    _handleWebSocketMessage(message) {
        switch (message.frameType) {
            case this.config.FRAME_TYPE.DATA:
                if (message.method && this.handlers[message.method]) {
                    this._triggerHandlers(message.method, message.data);
                }
                break;
                
            case this.config.FRAME_TYPE.PING:
                // 响应心跳
                this.socket.send(JSON.stringify({
                    frameType: this.config.FRAME_TYPE.PING
                }));
                break;
                
            case this.config.FRAME_TYPE.ERROR:
                this._triggerHandlers('error', {
                    message: '收到错误消息',
                    data: message.data
                });
                break;
        }
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
     * 发送聊天消息
     * @param {string} conversationId - 会话ID
     * @param {string} recvId - 接收者ID
     * @param {number} chatType - 聊天类型
     * @param {string} content - 消息内容
     * @param {number} msgType - 消息类型
     * @returns {string} - 消息ID
     */
    sendChatMessage(conversationId, recvId, chatType, content, msgType = 1) {
        return this.sendWebSocketMessage('conversation.chat', {
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
     * 获取聊天记录
     * @param {string} conversationId - 会话ID
     * @param {Object} options - 选项
     * @returns {Promise<Object>} - 聊天记录
     */
    async getChatLog(conversationId, options = {}) {
        const queryParams = new URLSearchParams();
        queryParams.append('conversationId', conversationId);
        
        if (options.startSendTime) {
            queryParams.append('startSendTime', options.startSendTime);
        }
        
        if (options.endSendTime) {
            queryParams.append('endSendTime', options.endSendTime);
        }
        
        if (options.count) {
            queryParams.append('count', options.count);
        }
        
        return this.request(`${this.config.API.ENDPOINTS.CHATLOG}?${queryParams.toString()}`);
    }
    
    /**
     * 建立会话
     * @param {string} recvId - 接收者ID
     * @param {number} chatType - 聊天类型
     * @returns {Promise<Object>} - 会话结果
     */
    async setupConversation(recvId, chatType = 1) {
        return this.request(this.config.API.ENDPOINTS.SETUP_CONVERSATION, 'POST', {
            sendId: this.userId,
            recvId: recvId,
            chatType: chatType
        });
    }
    
    /**
     * 获取会话列表
     * @returns {Promise<Object>} - 会话列表
     */
    async getConversations() {
        return this.request(this.config.API.ENDPOINTS.CONVERSATION);
    }
    
    /**
     * 更新会话
     * @param {Object} conversationList - 会话列表
     * @returns {Promise<Object>} - 更新结果
     */
    async updateConversations(conversationList) {
        return this.request(this.config.API.ENDPOINTS.CONVERSATION, 'PUT', {
            conversationList: conversationList
        });
    }
    
    /**
     * 注销
     */
    logout() {
        this.disconnectWebSocket();
        this.token = null;
        this.userId = null;
        this.userInfo = null;
        this.isConnected = false;
    }
}

// 导出为全局变量
window.UnifiedClient = UnifiedClient;