// API服务类，封装所有API请求
class ApiService {
  constructor(baseUrl = 'http://localhost') {
    // 配置
    this.config = {
      baseUrl,
      userPort: 8000,
      socialPort: 8010,
      imPort: 8020,
      wsPort: 8030,
      token: null
    };
    
    // API端点
    this.endpoints = {
      user: {
        login: '/api/user/login',
        register: '/api/user/register',
        info: '/api/user/info',
        update: '/api/user/update'
      },
      social: {
        friendList: '/api/social/friends',
        addFriend: '/api/social/friend/add',
        acceptFriend: '/api/social/friend/accept',
        rejectFriend: '/api/social/friend/reject',
        deleteFriend: '/api/social/friend/delete',
        groupList: '/api/social/groups',
        createGroup: '/api/social/group/create',
        joinGroup: '/api/social/group/join',
        leaveGroup: '/api/social/group/leave',
        groupMembers: '/api/social/group/members'
      },
      im: {
        sessions: '/api/im/sessions',
        messages: '/api/im/messages',
        send: '/api/im/message/send',
        wsConnect: '/ws/im'
      }
    };
  }
  
  // 更新配置
  updateConfig(config) {
    this.config = { ...this.config, ...config };
    return this;
  }
  
  // 设置Token
  setToken(token) {
    this.config.token = token;
    // 保存到本地存储
    localStorage.setItem('auth_token', token);
    return this;
  }
  
  // 清除Token
  clearToken() {
    this.config.token = null;
    localStorage.removeItem('auth_token');
    return this;
  }
  
  // 加载存储的Token
  loadToken() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.config.token = token;
    }
    return this;
  }
  
  // 检查是否已登录
  isLoggedIn() {
    return !!this.config.token;
  }
  
  // 构建完整URL
  _buildUrl(service, endpoint) {
    const portMap = {
      'user': this.config.userPort,
      'social': this.config.socialPort,
      'im': this.config.imPort,
      'ws': this.config.wsPort
    };
    
    const port = portMap[service];
    return `${this.config.baseUrl}:${port}${endpoint}`;
  }
  
  // 发送API请求
  async _request(method, service, endpoint, data = null, useToken = true) {
    const url = this._buildUrl(service, endpoint);
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (useToken && this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }
    
    const options = {
      method,
      headers,
      credentials: 'include'
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      }
      
      // 如果响应为204 No Content，返回null
      if (response.status === 204) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }
  
  // 用户API
  
  // 用户登录
  async login(username, password) {
    const data = await this._request('POST', 'user', this.endpoints.user.login, { username, password }, false);
    if (data && data.token) {
      this.setToken(data.token);
    }
    return data;
  }
  
  // 用户注册
  async register(username, password, nickname) {
    return await this._request('POST', 'user', this.endpoints.user.register, { 
      username, 
      password, 
      nickname 
    }, false);
  }
  
  // 获取用户信息
  async getUserInfo(userId = null) {
    const endpoint = userId 
      ? `${this.endpoints.user.info}/${userId}` 
      : this.endpoints.user.info;
    return await this._request('GET', 'user', endpoint);
  }
  
  // 更新用户信息
  async updateUserInfo(userInfo) {
    return await this._request('PUT', 'user', this.endpoints.user.update, userInfo);
  }
  
  // 社交API
  
  // 获取好友列表
  async getFriendList() {
    return await this._request('GET', 'social', this.endpoints.social.friendList);
  }
  
  // 添加好友
  async addFriend(userId) {
    return await this._request('POST', 'social', this.endpoints.social.addFriend, { userId });
  }
  
  // 接受好友请求
  async acceptFriendRequest(requestId) {
    return await this._request('POST', 'social', this.endpoints.social.acceptFriend, { requestId });
  }
  
  // 拒绝好友请求
  async rejectFriendRequest(requestId) {
    return await this._request('POST', 'social', this.endpoints.social.rejectFriend, { requestId });
  }
  
  // 删除好友
  async deleteFriend(userId) {
    return await this._request('DELETE', 'social', `${this.endpoints.social.deleteFriend}/${userId}`);
  }
  
  // 获取群组列表
  async getGroupList() {
    return await this._request('GET', 'social', this.endpoints.social.groupList);
  }
  
  // 创建群组
  async createGroup(name, description) {
    return await this._request('POST', 'social', this.endpoints.social.createGroup, { name, description });
  }
  
  // 加入群组
  async joinGroup(groupId) {
    return await this._request('POST', 'social', this.endpoints.social.joinGroup, { groupId });
  }
  
  // 离开群组
  async leaveGroup(groupId) {
    return await this._request('POST', 'social', this.endpoints.social.leaveGroup, { groupId });
  }
  
  // 获取群组成员
  async getGroupMembers(groupId) {
    return await this._request('GET', 'social', `${this.endpoints.social.groupMembers}/${groupId}`);
  }
  
  // IM消息API
  
  // 获取会话列表
  async getSessions() {
    return await this._request('GET', 'im', this.endpoints.im.sessions);
  }
  
  // 获取会话消息
  async getMessages(sessionId, lastMessageId = null, limit = 20) {
    let endpoint = `${this.endpoints.im.messages}/${sessionId}?limit=${limit}`;
    if (lastMessageId) {
      endpoint += `&lastId=${lastMessageId}`;
    }
    return await this._request('GET', 'im', endpoint);
  }
  
  // 发送消息
  async sendMessage(sessionId, content, type = 'text') {
    return await this._request('POST', 'im', this.endpoints.im.send, { 
      sessionId, 
      content,
      type
    });
  }
  
  // 获取WebSocket连接URL
  getWebSocketUrl() {
    // 使用wss或ws取决于当前页面的协议
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsEndpoint = this._buildUrl('ws', this.endpoints.im.wsConnect).replace(/^http:/, protocol);
    return this.config.token ? `${wsEndpoint}/bearer/${this.config.token}` : wsEndpoint;
  }
}

// 导出API服务实例
export default new ApiService();