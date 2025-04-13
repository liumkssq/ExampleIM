/**
 * ExampleIM 高级客户端应用
 * 集成了IM API和WebSocket，提供完整的聊天功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM元素引用
    // 基础元素
    const tokenInput = document.getElementById('tokenInput');
    const loginBtn = document.getElementById('loginBtn');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userId = document.getElementById('userId');
    const connectionStatus = document.getElementById('connectionStatus');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const chatWindow = document.getElementById('chatWindow');
    const logArea = document.getElementById('logArea');
    const clearLogBtn = document.getElementById('clearLogBtn');
    
    // 会话相关
    const conversationList = document.getElementById('conversationList');
    const contactList = document.getElementById('contactList');
    const searchConversations = document.getElementById('searchConversations');
    const searchContacts = document.getElementById('searchContacts');
    
    // 聊天相关
    const chatTitle = document.getElementById('chatTitle');
    const chatStatus = document.getElementById('chatStatus');
    const messageList = document.getElementById('messageList');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // API设置
    const apiBaseUrl = document.getElementById('apiBaseUrl');
    const wsUrl = document.getElementById('wsUrl');
    
    // 标签页切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // 应用状态
    let apiClient = null;
    let wsClient = null;
    let currentUser = null;
    let conversations = [];
    let currentConversation = null;
    let contacts = [];
    
    // 初始化 - 尝试加载之前的会话
    init();
    
    // 函数定义
    
    /**
     * 初始化应用
     */
    function init() {
        // 检查存储的令牌
        const savedToken = localStorage.getItem('im_token');
        if (savedToken) {
            tokenInput.value = savedToken;
            log('从本地存储加载了令牌');
        }
        
        // 为您提供的特定令牌
        const providedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTMwMjY5NjQsImlhdCI6MTc0NDM4Njk2NCwiaW1vb2MuY29tIjoiMHgwMDAwMDAyMDAwMDAwMDAxIn0.3sUfN8txxjDIc3iq7Tv_6D7m6-LCVuZb6cB2FB0bGt4';
        if (!savedToken) {
            tokenInput.value = providedToken;
            log('已填入提供的JWT Token');
        }
        
        // 设置事件监听器
        setupEventListeners();
    }
    
    /**
     * 设置事件监听器
     */
    function setupEventListeners() {
        // 登录按钮
        loginBtn.addEventListener('click', handleLogin);
        
        // 选项卡切换
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                
                // 更新按钮状态
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // 更新面板显示
                tabPanes.forEach(pane => pane.classList.remove('active'));
                document.getElementById(tabName + 'Tab').classList.add('active');
            });
        });
        
        // 发送消息
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // 搜索会话
        searchConversations.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterConversations(searchTerm);
        });
        
        // 搜索联系人
        searchContacts.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterContacts(searchTerm);
        });
        
        // 清除日志
        clearLogBtn.addEventListener('click', function() {
            logArea.textContent = '';
        });
    }
    
    /**
     * 处理登录
     */
    async function handleLogin() {
        const token = tokenInput.value.trim();
        
        if (!token) {
            log('请输入有效的JWT Token', true);
            return;
        }
        
        try {
            // 创建统一API客户端
            apiClient = new UnifiedApiClient({
                API_BASE_URL: apiBaseUrl.value,
                WS_URL: wsUrl.value
            });
            
            // 使用Token登录
            const loginResult = await apiClient.loginWithToken(token);
            
            if (!loginResult.success) {
                log('登录失败: ' + (loginResult.message || '未知错误'), true);
                return;
            }
            
            // 创建WebSocket客户端
            wsClient = apiClient.createWebSocketClient();
            
            // 设置WebSocket事件处理
            setupWebSocketHandlers();
            
            // 连接WebSocket
            await wsClient.connect();
            
            // 更新用户信息
            currentUser = apiClient.getUserInfo();
            updateUserInfo();
            
            // 获取会话列表
            await fetchConversations();
            
            // 保存Token
            localStorage.setItem('im_token', token);
            
            // 显示聊天窗口
            welcomeScreen.classList.add('hidden');
            chatWindow.classList.remove('hidden');
            
            // 启用输入控件
            messageInput.disabled = false;
            sendBtn.disabled = false;
            
            log('登录成功，已连接到IM服务');
        } catch (error) {
            log(`登录失败: ${error.message}`, true);
        }
    }
    
    /**
     * 设置WebSocket事件处理
     */
    function setupWebSocketHandlers() {
        // 连接事件
        wsClient.on('connect', function(data) {
            connectionStatus.textContent = '已连接';
            connectionStatus.classList.add('connected');
            log(`WebSocket已连接，用户ID: ${data.userId}`);
        });
        
        // 断开连接事件
        wsClient.on('disconnect', function(data) {
            connectionStatus.textContent = '未连接';
            connectionStatus.classList.remove('connected');
            log(`WebSocket已断开，原因: ${data.reason}`, true);
        });
        
        // 错误事件
        wsClient.on('error', function(data) {
            log(`WebSocket错误: ${data.message}`, true);
        });
        
        // 聊天消息
        wsClient.on('conversation.chat', function(data) {
            log(`收到聊天消息: ${JSON.stringify(data)}`);
            handleIncomingMessage(data);
        });
        
        // 推送消息
        wsClient.on('push', function(data) {
            log(`收到推送消息: ${JSON.stringify(data)}`);
            handleIncomingMessage(data);
        });
    }
    
    /**
     * 更新用户信息显示
     */
    function updateUserInfo() {
        if (currentUser) {
            userName.textContent = currentUser.nickname || '用户';
            userId.textContent = currentUser.id || '';
            
            // 设置头像
            if (currentUser.avatar) {
                userAvatar.src = currentUser.avatar;
            }
        }
    }
    
    /**
     * 获取会话列表
     */
    async function fetchConversations() {
        try {
            const result = await apiClient.getConversations();
            
            if (result && result.conversationList && Array.isArray(result.conversationList)) {
                conversations = result.conversationList;
                log(`获取到 ${conversations.length} 个会话`);
                
                // 更新UI
                renderConversationList();
                
                // 如果有会话，默认选择第一个
                if (conversations.length > 0) {
                    switchConversation(conversations[0]);
                }
            } else {
                log('获取会话列表失败或会话列表为空');
            }
        } catch (error) {
            log(`获取会话列表出错: ${error.message}`, true);
        }
    }
    
    /**
     * 渲染会话列表
     */
    function renderConversationList() {
        conversationList.innerHTML = '';
        
        if (conversations.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'empty-item';
            emptyItem.textContent = '暂无会话';
            conversationList.appendChild(emptyItem);
            return;
        }
        
        conversations.forEach(conversation => {
            const item = document.createElement('li');
            item.className = 'conversation-item';
            if (currentConversation && currentConversation.id === conversation.id) {
                item.classList.add('active');
            }
            
            const avatar = document.createElement('img');
            avatar.src = `https://via.placeholder.com/40?text=${conversation.targetId.substring(0, 2)}`;
            avatar.alt = '头像';
            
            const info = document.createElement('div');
            info.className = 'conversation-info';
            
            const name = document.createElement('div');
            name.className = 'conversation-name';
            name.textContent = `${conversation.chatType === 1 ? '私聊' : '群聊'}: ${conversation.targetId}`;
            
            const preview = document.createElement('div');
            preview.className = 'conversation-preview';
            preview.textContent = conversation.lastMessage ? 
                conversation.lastMessage.content.substring(0, 30) : 
                '暂无消息';
            
            info.appendChild(name);
            info.appendChild(preview);
            
            const meta = document.createElement('div');
            meta.className = 'conversation-meta';
            
            const time = document.createElement('div');
            time.className = 'conversation-time';
            time.textContent = conversation.lastMessage ? 
                formatTime(conversation.lastMessage.time) : 
                '';
            
            meta.appendChild(time);
            
            if (conversation.unread > 0) {
                const unread = document.createElement('div');
                unread.className = 'unread-count';
                unread.textContent = conversation.unread;
                meta.appendChild(unread);
            }
            
            item.appendChild(avatar);
            item.appendChild(info);
            item.appendChild(meta);
            
            // 点击事件 - 切换到该会话
            item.addEventListener('click', function() {
                switchConversation(conversation);
            });
            
            conversationList.appendChild(item);
        });
    }
    
    /**
     * 切换会话
     * @param {Object} conversation - 会话对象
     */
    function switchConversation(conversation) {
        currentConversation = conversation;
        
        // 更新UI
        chatTitle.textContent = `${conversation.chatType === 1 ? '私聊' : '群聊'}: ${conversation.targetId}`;
        chatStatus.textContent = '在线';
        messageList.innerHTML = '';
        
        // 更新会话列表选中状态
        const items = conversationList.querySelectorAll('.conversation-item');
        items.forEach(item => item.classList.remove('active'));
        
        const activeItem = Array.from(items).find(item => {
            const nameEl = item.querySelector('.conversation-name');
            return nameEl.textContent === `${conversation.chatType === 1 ? '私聊' : '群聊'}: ${conversation.targetId}`;
        });
        
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // 获取聊天历史
        fetchChatHistory(conversation.id);
    }
    
    /**
     * 获取聊天历史
     * @param {string} conversationId - 会话ID
     */
    async function fetchChatHistory(conversationId) {
        try {
            const result = await apiClient.getChatLog(conversationId, {
                count: 20
            });
            
            log(`获取到聊天记录: ${JSON.stringify(result)}`);
            
            if (result && result.list) {
                // 渲染聊天记录
                result.list.forEach(msg => {
                    renderMessage({
                        id: msg.id,
                        content: msg.msgContent,
                        senderId: msg.sendId,
                        receiverId: msg.recvId,
                        time: msg.SendTime,
                        type: msg.msgType,
                        isSent: msg.sendId === wsClient.userId
                    });
                });
                
                // 滚动到底部
                scrollToBottom();
            }
        } catch (error) {
            log(`获取聊天记录失败: ${error.message}`, true);
        }
    }
    
    /**
     * 发送消息
     */
    function sendMessage() {
        if (!currentConversation) {
            log('请先选择一个会话', true);
            return;
        }
        
        const content = messageInput.value.trim();
        if (!content) {
            log('消息内容不能为空', true);
            return;
        }
        
        try {
            // 发送WebSocket消息
            wsClient.sendChatMessage(
                currentConversation.id,
                currentConversation.targetId,
                currentConversation.chatType,
                content
            );
            
            // 渲染本地消息
            renderMessage({
                id: `local_${Date.now()}`,
                content: content,
                senderId: wsClient.userId,
                receiverId: currentConversation.targetId,
                time: Date.now(),
                type: 1, // 文本消息
                isSent: true,
                isPending: true
            });
            
            // 清空输入框
            messageInput.value = '';
            
            // 滚动到底部
            scrollToBottom();
        } catch (error) {
            log(`发送消息失败: ${error.message}`, true);
        }
    }
    
    /**
     * 处理接收到的消息
     * @param {Object} message - 消息对象
     */
    function handleIncomingMessage(message) {
        // 提取消息数据
        const msgData = {
            id: message.id || `server_${Date.now()}`,
            content: message.msg ? message.msg.content : message.content,
            senderId: message.sendId,
            receiverId: message.recvId,
            time: message.sendTime,
            type: message.msg ? message.msg.mType : message.mType,
            isSent: message.sendId === wsClient.userId
        };
        
        // 检查是否是当前会话的消息
        const isCurrentConversation = currentConversation && 
            ((currentConversation.targetId === msgData.senderId && msgData.receiverId === wsClient.userId) ||
             (currentConversation.targetId === msgData.receiverId && msgData.senderId === wsClient.userId));
        
        if (isCurrentConversation) {
            // 渲染消息
            renderMessage(msgData);
            
            // 滚动到底部
            scrollToBottom();
        } else {
            // 更新会话列表中的预览和未读数
            updateConversationPreview(message);
        }
    }
    
    /**
     * 更新会话预览
     * @param {Object} message - 消息对象
     */
    function updateConversationPreview(message) {
        // 获取会话信息
        const conversationId = message.conversationId;
        const otherUserId = message.sendId === wsClient.userId ? message.recvId : message.sendId;
        const content = message.msg ? message.msg.content : message.content;
        const time = message.sendTime;
        
        // 查找会话
        const conversationIndex = conversations.findIndex(c => c.id === conversationId);
        
        if (conversationIndex >= 0) {
            // 更新现有会话
            conversations[conversationIndex].lastMessage = {
                content: content,
                time: time
            };
            
            if (message.sendId !== wsClient.userId) {
                conversations[conversationIndex].unread = (conversations[conversationIndex].unread || 0) + 1;
            }
        } else {
            // 创建新会话
            conversations.unshift({
                id: conversationId,
                targetId: otherUserId,
                chatType: message.chatType,
                lastMessage: {
                    content: content,
                    time: time
                },
                unread: message.sendId !== wsClient.userId ? 1 : 0
            });
        }
        
        // 重新排序会话列表
        conversations.sort((a, b) => {
            if (!a.lastMessage && !b.lastMessage) return 0;
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return b.lastMessage.time - a.lastMessage.time;
        });
        
        // 重新渲染会话列表
        renderConversationList();
    }
    
    /**
     * 渲染消息
     * @param {Object} message - 消息对象
     */
    function renderMessage(message) {
        const messageItem = document.createElement('div');
        messageItem.className = `message-item ${message.isSent ? 'sent' : 'received'}`;
        messageItem.dataset.id = message.id;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = message.content;
        
        const messageMeta = document.createElement('div');
        messageMeta.className = 'message-meta';
        
        const messageTime = document.createElement('span');
        messageTime.className = 'message-time';
        messageTime.textContent = formatTime(message.time);
        
        messageMeta.appendChild(messageTime);
        
        // 添加消息状态（仅发送的消息）
        if (message.isSent) {
            const messageStatus = document.createElement('span');
            messageStatus.className = 'message-status';
            messageStatus.textContent = message.isPending ? '发送中...' : '已发送';
            messageMeta.appendChild(messageStatus);
        }
        
        messageItem.appendChild(messageContent);
        messageItem.appendChild(messageMeta);
        
        messageList.appendChild(messageItem);
    }
    
    /**
     * 过滤会话列表
     * @param {string} searchTerm - 搜索词
     */
    function filterConversations(searchTerm) {
        const items = conversationList.querySelectorAll('.conversation-item');
        
        items.forEach(item => {
            const name = item.querySelector('.conversation-name').textContent.toLowerCase();
            
            if (name.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    /**
     * 过滤联系人列表
     * @param {string} searchTerm - 搜索词
     */
    function filterContacts(searchTerm) {
        const items = contactList.querySelectorAll('.contact-item');
        
        items.forEach(item => {
            const name = item.querySelector('.contact-name').textContent.toLowerCase();
            
            if (name.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    /**
     * 滚动到底部
     */
    function scrollToBottom() {
        messageList.scrollTop = messageList.scrollHeight;
    }
    
    /**
     * 格式化时间
     * @param {number} timestamp - 时间戳
     * @returns {string} 格式化后的时间
     */
    function formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && 
                      date.getMonth() === now.getMonth() && 
                      date.getFullYear() === now.getFullYear();
        
        if (isToday) {
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else {
            return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * 记录日志
     * @param {string} message - 日志消息
     * @param {boolean} isError - 是否是错误
     */
    function log(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = isError ? '❌ ' : '✅ ';
        logArea.textContent += `[${timestamp}] ${prefix}${message}\n`;
        logArea.scrollTop = logArea.scrollHeight;
    }
});