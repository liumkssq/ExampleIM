/**
 * API.js - 封装与后端API的通信
 */

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'http://localhost:8082'; // 默认API服务器地址
    this.token = localStorage.getItem('token') || null;
  }

  // 设置认证令牌
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // 清除认证令牌
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // 获取认证令牌
  getToken() {
    return this.token;
  }

  // 判断是否已登录
  isLoggedIn() {
    return !!this.token;
  }

  // 创建请求头
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // 发送HTTP请求
  async request(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: responseData.message || '请求失败',
          data: responseData
        };
      }

      return responseData;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }

  // HTTP方法封装
  async get(endpoint) {
    return this.request('GET', endpoint);
  }

  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  // 用户API
  async login(username, password) {
    return this.post('/api/user/login', { username, password });
  }

  async register(username, password, nickname) {
    return this.post('/api/user/register', { username, password, nickname });
  }

  async getUserInfo() {
    return this.get('/api/user/info');
  }

  async updateUserInfo(userData) {
    return this.put('/api/user/info', userData);
  }

  // 社交API
  async getFriendsList() {
    return this.get('/api/social/friends');
  }

  async sendFriendRequest(username, message) {
    return this.post('/api/social/friend-requests', { username, message });
  }

  async getFriendRequests() {
    return this.get('/api/social/friend-requests');
  }

  async acceptFriendRequest(requestId) {
    return this.post(`/api/social/friend-requests/${requestId}/accept`);
  }

  async rejectFriendRequest(requestId) {
    return this.post(`/api/social/friend-requests/${requestId}/reject`);
  }

  async createGroup(name, description, members) {
    return this.post('/api/social/groups', { name, description, members });
  }

  async getGroups() {
    return this.get('/api/social/groups');
  }

  async getGroupInfo(groupId) {
    return this.get(`/api/social/groups/${groupId}`);
  }

  async addGroupMember(groupId, userId) {
    return this.post(`/api/social/groups/${groupId}/members`, { userId });
  }

  async removeGroupMember(groupId, userId) {
    return this.delete(`/api/social/groups/${groupId}/members/${userId}`);
  }

  // 消息API
  async getSessions() {
    return this.get('/api/im/sessions');
  }

  async getSessionMessages(sessionId, limit = 50, before = null) {
    let url = `/api/im/sessions/${sessionId}/messages?limit=${limit}`;
    if (before) {
      url += `&before=${before}`;
    }
    return this.get(url);
  }

  // 获取WebSocket连接URL
  getWebSocketUrl() {
    let wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // 使用相对路径并通过路径传递token，而不是查询参数
    // 注意：端口号应与WebSocket服务端口一致
    return `${wsProtocol}//${window.location.hostname}:8084/api/im/ws/bearer/${this.token}`;
  }
}

// 单例模式
const api = new ApiClient();
export default api;