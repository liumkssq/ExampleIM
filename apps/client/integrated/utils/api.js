/**
 * API客户端模块
 * 封装所有与服务器API交互的方法
 */
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL || 'http://localhost:8888/api';
    this.token = localStorage.getItem('token') || '';
    
    // 初始化各服务API
    this.user = new UserAPI(this);
    this.social = new SocialAPI(this);
    this.im = new IMAPI(this);
  }

  // 设置认证令牌
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // 清除认证信息
  clearToken() {
    this.token = '';
    localStorage.removeItem('token');
  }

  // 发送请求的核心方法
  async request(path, method = 'GET', data = null) {
    const url = `${this.baseURL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // 添加认证头
    if (this.token) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    // 添加请求体
    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '请求失败');
      }
      
      return result;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }
}

/**
 * 用户服务API
 * 处理用户注册、登录和用户信息相关操作
 */
class UserAPI {
  constructor(client) {
    this.client = client;
  }

  // 用户登录
  async login(username, password) {
    const result = await this.client.request('/user/login', 'POST', { username, password });
    if (result.token) {
      this.client.setToken(result.token);
    }
    return result;
  }

  // 用户注册
  async register(username, password, nickname) {
    return await this.client.request('/user/register', 'POST', { 
      username, 
      password, 
      nickname: nickname || username 
    });
  }

  // 获取当前用户信息
  async getCurrentUser() {
    return await this.client.request('/user/profile');
  }

  // 获取指定用户信息
  async getUserInfo(userId) {
    return await this.client.request(`/user/info/${userId}`);
  }

  // 更新用户资料
  async updateProfile(data) {
    return await this.client.request('/user/profile', 'PUT', data);
  }
}

/**
 * 社交服务API
 * 处理好友关系和群组相关操作
 */
class SocialAPI {
  constructor(client) {
    this.client = client;
  }

  // 获取好友列表
  async getFriends() {
    return await this.client.request('/social/friends');
  }

  // 搜索用户
  async searchUsers(keyword) {
    return await this.client.request(`/social/search?keyword=${encodeURIComponent(keyword)}`);
  }

  // 发送好友请求
  async sendFriendRequest(userId, message) {
    return await this.client.request('/social/friend/request', 'POST', { userId, message });
  }

  // 获取好友请求列表
  async getFriendRequests() {
    return await this.client.request('/social/friend/requests');
  }

  // 处理好友请求
  async handleFriendRequest(requestId, accept) {
    return await this.client.request('/social/friend/request/handle', 'POST', { requestId, accept });
  }

  // 获取群组列表
  async getGroups() {
    return await this.client.request('/social/groups');
  }

  // 创建群组
  async createGroup(name, description) {
    return await this.client.request('/social/group/create', 'POST', { name, description });
  }

  // 加入群组
  async joinGroup(groupId) {
    return await this.client.request('/social/group/join', 'POST', { groupId });
  }
}

/**
 * 即时通讯服务API
 * 处理消息和会话相关操作
 */
class IMAPI {
  constructor(client) {
    this.client = client;
  }

  // 获取会话列表
  async getConversations() {
    return await this.client.request('/im/conversations');
  }

  // 获取特定会话信息
  async getConversation(conversationId) {
    return await this.client.request(`/im/conversation/${conversationId}`);
  }

  // 创建新会话
  async createConversation(targetId, type) {
    return await this.client.request('/im/conversation/create', 'POST', { targetId, type });
  }

  // 获取会话历史消息
  async getMessages(conversationId, lastId = 0, limit = 20) {
    return await this.client.request(`/im/messages/${conversationId}?lastId=${lastId}&limit=${limit}`);
  }

  // 标记会话已读
  async markRead(conversationId) {
    return await this.client.request('/im/conversation/read', 'POST', { conversationId });
  }

  // 获取WebSocket连接信息
  async getWSInfo() {
    return await this.client.request('/im/ws/info');
  }
}

// 导出API客户端
export default APIClient;