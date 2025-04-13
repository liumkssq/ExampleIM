/**
 * ExampleIM API客户端工具
 * 提供与IM API的集成
 */

// 默认配置
const DEFAULT_CONFIG = {
    // IM API基础URL
    API_BASE_URL: 'http://localhost:8888',
    // WebSocket服务URL
    WS_URL: 'ws://localhost:10090/ws',
    // 会话类型
    CHAT_TYPE: {
        SINGLE: 1,   // 单聊
        GROUP: 2    // 群聊
    },
    // 消息类型
    MSG_TYPE: {
        TEXT: 1,    // 文本
        IMAGE: 2,   // 图片
        VIDEO: 3,   // 视频
        FILE: 4     // 文件
    }
};

/**
 * IM API客户端类
 */
class ImApiClient {
    /**
     * 构造函数
     * @param {Object} config - 配置对象
     */
    constructor(config = {}) {
        this.config = Object.assign({}, DEFAULT_CONFIG, config);
        this.token = null;
        this.userId = null;
    }

    /**
     * 设置认证令牌
     * @param {string} token - JWT令牌
     * @param {string} userId - 用户ID
     */
    setAuth(token, userId) {
        this.token = token;
        this.userId = userId;
    }

    /**
     * 判断是否已认证
     * @returns {boolean} 是否已认证
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * 执行API请求
     * @param {string} endpoint - API端点
     * @param {string} method - HTTP方法
     * @param {Object} data - 请求数据
     * @returns {Promise<Object>} 请求结果
     */
    async request(endpoint, method = 'GET', data = null) {
        if (!this.isAuthenticated()) {
            throw new Error('未认证，请先设置Token');
        }

        const url = `${this.config.API_BASE_URL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            }
        };

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

        return this.request(`/v1/im/chatlog?${params.toString()}`);
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

        return this.request('/v1/im/setup/conversation', 'POST', data);
    }

    /**
     * 获取会话列表
     * @returns {Promise<Object>} 会话列表
     */
    async getConversations() {
        return this.request('/v1/im/conversation');
    }

    /**
     * 更新会话
     * @param {Object} conversationList - 会话列表
     * @returns {Promise<Object>} 更新结果
     */
    async updateConversations(conversationList) {
        return this.request('/v1/im/conversation', 'PUT', { conversationList });
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
}

// 导出
window.ImApiClient = ImApiClient;