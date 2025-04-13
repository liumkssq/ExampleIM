/**
 * ExampleIM统一API客户端
 * 集成了用户认证和IM消息功能
 */

// 默认配置
const DEFAULT_CONFIG = {
    // API基础URL
    API_BASE_URL: 'http://localhost:8888',
    // WebSocket服务URL
    WS_URL: 'ws://localhost:10090/ws',
    // 会话类型
    CHAT_TYPE: {
        SINGLE: 1,   // 单聊
        GROUP: 2     // 群聊
    },
    // 消息类型
    MSG_TYPE: {
        TEXT: 1,     // 文本
        IMAGE: 2,    // 图片
        VIDEO: 3,    // 视频
        FILE: 4      // 文件
    },
    // API端点
    ENDPOINTS: {
        LOGIN: '/v1/user/login',
        REGISTER: '/v1/user/register',
        USER_INFO: '/v1/user/user',
        CHATLOG: '/v1/im/chatlog',
        SETUP_CONVERSATION: '/v1/im/setup/conversation',
        CONVERSATION: '/v1/im/conversation'
    }
};

/**
 * 统一API客户端类
 */
class UnifiedApiClient {
    /**
     * 构造函数
     * @param {Object} config - 配置对象
     */
    constructor(config = {}) {
        this.config = Object.assign({}, DEFAULT_CONFIG, config);
        this.token = null;
        this.userId = null;
        this.userInfo = null;
        this.wsClient = null;
    }

    /**
     * 获取Token
     * @returns {string} JWT令牌
     */
    getToken() {
        return this.token;
    }

    /**
     * 获取用户ID
     * @returns {string} 用户ID
     */
    getUserId() {
        return this.userId;
    }

    /**
     * 获取用户信息
     * @returns {Object} 用户信息
     */
    getUserInfo() {
        return this.userInfo;
    }

    /**
     * 从JWT令牌中解析用户ID
     * @param {string} token - JWT令牌
     * @returns {string} 用户ID
     */
    static parseUserId(token) {
        try {
            // 从JWT中获取payload部分
            const payload = token.split('.')[1];
            // Base64解码
            const decodedPayload = JSON.parse(atob(payload));
            // 从payload中获取用户ID (imooc.com字段)
            return decodedPayload['imooc.com'] || null;
        } catch (error) {
            console.error('解析Token错误:', error);
            return null;
        }
    }

    /**
     * 执行API请求
     * @param {string} endpoint - API端点
     * @param {string} method - HTTP方法
     * @param {Object} data - 请求数据
     * @param {boolean} needAuth - 是否需要认证
     * @returns {Promise<Object>} 请求结果
     */
    async request(endpoint, method = 'GET', data = null, needAuth = true) {
        const url = `${this.config.API_BASE_URL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (needAuth) {
            if (!this.token) {
                throw new Error('未认证，请先登录');
            }
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    /**
     * 用户登录
     * @param {string} mobile - 手机号
     * @param {string} password - 密码
     * @returns {Promise<Object>} 登录结果
     */
    async login(mobile, password) {
        const data = {
            mobile,
            password
        };

        const result = await this.request(this.config.ENDPOINTS.LOGIN, 'POST', data, false);
        
        if (result && result.token) {
            this.token = result.token;
            this.userId = UnifiedApiClient.parseUserId(result.token);
            
            // 获取用户信息
            await this.fetchUserInfo();
            
            return {
                success: true,
                token: this.token,
                userId: this.userId,
                userInfo: this.userInfo
            };
        } else {
            throw new Error('登录失败: 未获取到有效令牌');
        }
    }

    /**
     * 使用已有Token登录
     * @param {string} token - JWT令牌
     * @returns {Promise<Object>} 登录结果
     */
    async loginWithToken(token) {
        if (!token) {
            throw new Error('请提供有效的JWT Token');
        }

        this.token = token;
        this.userId = UnifiedApiClient.parseUserId(token);
        
        if (!this.userId) {
            throw new Error('无法从Token中解析用户ID');
        }

        // 获取用户信息
        await this.fetchUserInfo();
        
        return {
            success: true,
            token: this.token,
            userId: this.userId,
            userInfo: this.userInfo
        };
    }

    /**
     * 用户注册
     * @param {string} mobile - 手机号
     * @param {string} password - 密码
     * @param {string} nickname - 昵称
     * @param {number} sex - 性别 (0=女，1=男)
     * @param {string} avatar - 头像URL
     * @returns {Promise<Object>} 注册结果
     */
    async register(mobile, password, nickname, sex = 1, avatar = '') {
        const data = {
            mobile,
            password,
            nickname,
            sex,
            avatar
        };

        return this.request(this.config.ENDPOINTS.REGISTER, 'POST', data, false);
    }

    /**
     * 获取用户信息
     * @returns {Promise<Object>} 用户信息
     */
    async fetchUserInfo() {
        const result = await this.request(this.config.ENDPOINTS.USER_INFO, 'GET', null, true);
        
        if (result && result.info) {
            this.userInfo = result.info;
            return this.userInfo;
        } else {
            throw new Error('获取用户信息失败');
        }
    }

    /**
     * 获取聊天记录
     * @param {string} conversationId - 会话ID
     * @param {Object} options - 其他选项，如startSendTime、endSendTime、count
     * @returns {Promise<Object>} 聊天记录列表
     */
    async getChatLog(conversationId, options = {}) {
        const params = new URLSearchParams({
            conversationId
        });

        // 添加可选参数
        if (options.startSendTime) params.append('startSendTime', options.startSendTime);
        if (options.endSendTime) params.append('endSendTime', options.endSendTime);
        if (options.count) params.append('count', options.count);

        return this.request(`${this.config.ENDPOINTS.CHATLOG}?${params.toString()}`);
    }

    /**
     * 建立会话
     * @param {string} recvId - 接收方ID
     * @param {number} chatType - 聊天类型，1=单聊，2=群聊
     * @returns {Promise<Object>} 会话结果
     */
    async setupConversation(recvId, chatType = 1) {
        const data = {
            sendId: this.userId,
            recvId,
            chatType
        };

        return this.request(this.config.ENDPOINTS.SETUP_CONVERSATION, 'POST', data);
    }

    /**
     * 获取会话列表
     * @returns {Promise<Object>} 会话列表
     */
    async getConversations() {
        return this.request(this.config.ENDPOINTS.CONVERSATION);
    }

    /**
     * 更新会话
     * @param {Object} conversationList - 会话列表
     * @returns {Promise<Object>} 更新结果
     */
    async updateConversations(conversationList) {
        return this.request(this.config.ENDPOINTS.CONVERSATION, 'PUT', { conversationList });
    }

    /**
     * 创建WebSocket客户端
     * @returns {ImWebSocketClient} WebSocket客户端实例
     */
    createWebSocketClient() {
        if (!this.token || !this.userId) {
            throw new Error('请先登录');
        }
        
        this.wsClient = new ImWebSocketClient(this.config.WS_URL, this.token, this.userId);
        return this.wsClient;
    }

    /**
     * 获取当前WebSocket客户端
     * @returns {ImWebSocketClient} WebSocket客户端实例
     */
    getWebSocketClient() {
        return this.wsClient;
    }

    /**
     * 销毁客户端
     */
    destroy() {
        if (this.wsClient) {
            this.wsClient.disconnect();
            this.wsClient = null;
        }
        
        this.token = null;
        this.userId = null;
        this.userInfo = null;
    }
}

// 导出
window.UnifiedApiClient = UnifiedApiClient;