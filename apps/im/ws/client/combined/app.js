/**
 * ExampleIM 统一客户端主应用
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM元素引用
    // 登录表单
    const mobileInput = document.getElementById('mobileInput');
    const passwordInput = document.getElementById('passwordInput');
    const tokenInput = document.getElementById('tokenInput');
    const loginBtn = document.getElementById('loginBtn');
    const tokenLoginBtn = document.getElementById('tokenLoginBtn');
    
    // 用户信息
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userId = document.getElementById('userId');
    const connectionStatus = document.getElementById('connectionStatus');
    
    // 界面元素
    const welcomeScreen = document.getElementById('welcomeScreen');
    const chatWindow = document.getElementById('chatWindow');
    const conversationList = document.getElementById('conversationList');
    const contactList = document.getElementById('contactList');
    const messageList = document.getElementById('messageList');
    const chatTitle = document.getElementById('chatTitle');
    const chatStatus = document.getElementById('chatStatus');
    
    // 输入和发送
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // 搜索框
    const searchConversations = document.getElementById('searchConversations');
    const searchContacts = document.getElementById('searchContacts');
    
    // 服务器配置
    const apiBaseUrl = document.getElementById('apiBaseUrl');
    const wsUrl = document.getElementById('wsUrl');
    
    // 日志
    const logArea = document.getElementById('logArea');
    const clearLogBtn = document.getElementById('clearLogBtn');
    
    // 标签页
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // 应用状态
    let client = null;
    let currentConversation = null;
    let conversations = [];
    let contacts = [];
    
    // 初始化
    init();
    
    /**
     * 初始化应用
     */
    function init() {
        // 尝试加载保存的Token
        const savedToken = localStorage.getItem('im_token');
        if (savedToken) {
            tokenInput.value = savedToken;
            log('从本地存储加载了Token');
        }
        
        // 设置事件监听
        setupEventListeners();
        
        // 创建客户端实例
        updateClient();
    }
    
    /**
     * 设置事件监听
     */
    function setupEventListeners() {
        // 登录按钮
        loginBtn.addEventListener('click', handlePasswordLogin);
        tokenLoginBtn.addEventListener('click', handleTokenLogin);
        
        // 发送消息
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // 服务器配置变更
        apiBaseUrl.addEventListener('change', updateClient);
        wsUrl.addEventListener('change', updateClient);
        
        // 标签页切换
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
     * 更新客户端实例
     */
    function updateClient() {
        client = new UnifiedClient({
            API: {
                BASE_URL: apiBaseUrl.value
            },
            WS: {
                URL: wsUrl.value
            }
        });
        
        // 设置WebSocket事件处理
        setupWebSocketHandlers();
    }
    
    /**
     * 设置WebSocket事件处理
     */
    function setupWebSocketHandlers() {
        // 连接事件
        client.on('connect', function(data) {
            connectionStatus.textContent = '已连接';
            connectionStatus.classList.add('connected');
            log(`WebSocket已连接，用户ID: ${data.userId}`);
        });
        
        // 断开连接事件
        client.on('disconnect', function(data) {
            connectionStatus.textContent = '未连接';
            connectionStatus.classList.remove('connected');
            log(`WebSocket已断开连接: ${data.reason}`);
        });
        
        // 收到聊天消息
        client.on('conversation.chat', function(data) {
            log(`收到聊天消息: ${JSON.stringify(data)}`);
            handleIncomingMessage(data);
        });
        
        // 推送消息
        client.on('push', function(data) {
            log(`收到推送消息: ${JSON.stringify(data)}`);
            handleIncomingMessage(data);
        });
        
        // 错误消息
        client.on('error', function(data) {
            log(`错误: ${data.message}`, true);
        });
    }
    
    /**
     * 处理密码登录
     */
    async function handlePasswordLogin() {
        const mobile = mobileInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!mobile || !password) {
            log('请输入手机号和密码', true);
            return;
        }
        
        log('正在登录...');
        const result = await client.login(mobile, password);
        
        if (result.success) {
            log('登录成功');
            completeLogin();
        } else {
            log(`登录失败: ${result.error}`, true);
        }
    }
    
    /**
     * 处理Token登录
     */
    async function handleTokenLogin() {
        const token = tokenInput.value.trim();
        
        if (!token) {
            log('请输入JWT Token', true);
            return;
        }
        
        log('正在使用Token登录...');
        const result = await client.loginWithToken(token);
        
        if (result.success) {
            log('使用Token登录成功');
            completeLogin();
        } else {
            log(`登录失败: ${result.error}`, true);
        }
    }
    
    /**
     * 完成登录后的操作
     */
    async function completeLogin() {
        // 保存Token
        localStorage.setItem('im_token', client.token);
        
        // 更新用户信息
        updateUserInfo();
        
        // 连接WebSocket
        try {
            await client.connectWebSocket();
            log('WebSocket连接成功');
        } catch (error) {
            log(`WebSocket连接失败: ${error.message}`, true);
        }
        
        // 获取会话列表
        try {
            await fetchConversations();
        } catch (error) {
            log(`获取会话列表失败: ${error.message}`, true);
        }
        
        // 显示聊天窗口
        welcomeScreen.classList.add('hidden');
        chatWindow.classList.remove('hidden');
        
        // 启用输入控件
        messageInput.disabled = false;
        sendBtn.disabled = false;
    }
    
    /**
     * 更新用户信息显示
     */
    function updateUserInfo() {
        if (client.userInfo) {
            userName.textContent = client.userInfo.nickname || client.userId;
            userId.textContent = client.userId;
            
            if (client.userInfo.avatar) {
                userAvatar.src = client.userInfo.avatar;
            } else {
                userAvatar.src = `https://via.placeholder.com/40?text=${client.userId.substring(0, 2)}`;
            }
        } else {
            userName.textContent = client.userId || '用户';
            userId.textContent = client.userId || '';
            userAvatar.src = `https://via.placeholder.com/40?text=${client.userId ? client.userId.substring(0, 2) : 'U'}`;
        }
    }
    
    /**
     * 获取会话列表
     */
    async function fetchConversations() {
        const result = await client.getConversations();
        
        if (result && result.conversationList) {
            // 转换会话列表格式
            conversations = [];
            
            for (const key in result.conversationList) {
                const conv = result.conversationList[key];
                conversations.push({
                    id: conv.conversationId,
                    targetId: conv.targetId,
                    chatType: conv.chatType,
                    lastMessage: conv.msg ? {
                        content: conv.msg.msgContent,
                        time: conv.msg.SendTime
                    } : null,
                    unread: conv.unread || 0
                });
            }
            
            // 按时间排序
            conversations.sort((a, b) => {
                if (!a.lastMessage && !b.lastMessage) return 0;
                if (!a.lastMessage) return 1;
                if (!b.lastMessage) return -1;
                return b.lastMessage.time - a.lastMessage.time;
            });
            
            log(`获取到 ${conversations.length} 个会话`);
            renderConversationList();
            
            // 如果有会话，默认选择第一个
            if (conversations.length > 0) {
                switchConversation(conversations[0]);
            }
        } else {
            log('会话列表为空或格式错误');
        }
    }
    
    /**
     * 渲染会话列表
     */
    function renderConversationList() {
        conversationList.innerHTML = '';
        
        if (conversations.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'conversation-item';
            emptyItem.textContent = '暂无会话';
            conversationList.appendChild(emptyItem);
            return;
        }
        
        conversations.forEach(conv => {
            const item = document.createElement('li');
            item.className = 'conversation-item';
            if (currentConversation && currentConversation.id === conv.id) {
                item.classList.add('active');
            }
            
            const preview = document.createElement('div');
            preview.className = 'conversation-preview';
            
            const avatar = document.createElement('img');
            avatar.className = 'conversation-avatar';
            avatar.src = `https://via.placeholder.com/40?text=${conv.targetId.substring(0, 2)}`;
            avatar.alt = '头像';
            
            const details = document.createElement('div');
            details.className = 'conversation-details';
            
            const header = document.createElement('div');
            header.className = 'conversation-header';
            
            const title = document.createElement('div');
            title.className = 'conversation-title';
            title.textContent = `用户 ${conv.targetId.substring(0, 8)}...`;
            
            const time = document.createElement('div');
            time.className = 'conversation-time';
            time.textContent = conv.lastMessage ? formatTime(conv.lastMessage.time) : '';
            
            header.appendChild(title);
            header.appendChild(time);
            
            const message = document.createElement('div');
            message.className = 'conversation-message';
            message.textContent = conv.lastMessage ? conv.lastMessage.content : '暂无消息';
            
            if (conv.unread > 0) {
                const badge = document.createElement('span');
                badge.className = 'unread-badge';
                badge.textContent = conv.unread > 99 ? '99+' : conv.unread;
                message.appendChild(badge);
            }
            
            details.appendChild(header);
            details.appendChild(message);
            
            preview.appendChild(avatar);
            preview.appendChild(details);
            
            item.appendChild(preview);
            
            item.addEventListener('click', () => switchConversation(conv));
            
            conversationList.appendChild(item);
        });
    }
    
    /**
     * 切换会话
     */
    async function switchConversation(conversation) {
        currentConversation = conversation;
        
        // 更新UI标记当前会话
        const items = conversationList.querySelectorAll('.conversation-item');
        items.forEach(item => item.classList.remove('active'));
        
        const activeItems = conversationList.querySelectorAll(`.conversation-item[data-id="${conversation.id}"]`);
        activeItems.forEach(item => item.classList.add('active'));
        
        // 更新聊天窗口标题
        chatTitle.textContent = `与 ${conversation.targetId.substring(0, 8)}... 的会话`;
        chatStatus.textContent = '在线';
        
        // 清空消息列表
        messageList.innerHTML = '';
        
        // 获取聊天历史
        try {
            const result = await client.getChatLog(conversation.id);
            
            if (result && result.list && Array.isArray(result.list)) {
                // 渲染历史消息
                result.list.forEach(msg => {
                    renderMessage({
                        sendId: msg.sendId,
                        content: msg.msgContent,
                        time: msg.sendTime,
                        isOutgoing: msg.sendId === client.userId
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
    async function sendMessage() {
        const content = messageInput.value.trim();
        
        if (!content || !currentConversation) {
            return;
        }
        
        try {
            // 发送消息
            const messageId = client.sendChatMessage(
                currentConversation.id,
                currentConversation.targetId,
                currentConversation.chatType,
                content
            );
            
            log(`发送消息 ID: ${messageId}`);
            
            // 渲染发送的消息
            renderMessage({
                sendId: client.userId,
                content: content,
                time: Date.now(),
                isOutgoing: true
            });
            
            // 清空输入框
            messageInput.value = '';
            
            // 滚动到底部
            scrollToBottom();
            
            // 更新会话预览
            updateConversationPreview({
                conversationId: currentConversation.id,
                content: content,
                time: Date.now()
            });
        } catch (error) {
            log(`发送消息失败: ${error.message}`, true);
        }
    }
    
    /**
     * 处理收到的消息
     */
    function handleIncomingMessage(message) {
        // 检查是否与当前会话相关
        const isCurrentConversation = currentConversation && 
            message.conversationId === currentConversation.id;
        
        // 如果是当前会话，渲染消息
        if (isCurrentConversation) {
            renderMessage({
                sendId: message.sendId,
                content: message.msg.content,
                time: message.sendTime || Date.now(),
                isOutgoing: message.sendId === client.userId
            });
            
            // 滚动到底部
            scrollToBottom();
        }
        
        // 更新会话预览
        updateConversationPreview({
            conversationId: message.conversationId,
            content: message.msg.content,
            time: message.sendTime || Date.now()
        });
    }
    
    /**
     * 更新会话预览
     */
    function updateConversationPreview(message) {
        const conversation = conversations.find(c => c.id === message.conversationId);
        
        if (conversation) {
            // 更新最后一条消息
            conversation.lastMessage = {
                content: message.content,
                time: message.time
            };
            
            // 如果不是当前会话，增加未读数
            if (!currentConversation || currentConversation.id !== conversation.id) {
                conversation.unread = (conversation.unread || 0) + 1;
            }
            
            // 将此会话移到顶部
            conversations = [
                conversation,
                ...conversations.filter(c => c.id !== conversation.id)
            ];
            
            // 重新渲染会话列表
            renderConversationList();
        }
    }
    
    /**
     * 渲染单条消息
     */
    function renderMessage(message) {
        const msgElement = document.createElement('div');
        msgElement.className = `message ${message.isOutgoing ? 'outgoing' : 'incoming'}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = message.content;
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = formatTime(message.time);
        
        msgElement.appendChild(bubble);
        msgElement.appendChild(timeElement);
        
        messageList.appendChild(msgElement);
    }
    
    /**
     * 过滤会话列表
     */
    function filterConversations(searchTerm) {
        const items = conversationList.querySelectorAll('.conversation-item');
        
        items.forEach(item => {
            const title = item.querySelector('.conversation-title').textContent.toLowerCase();
            const message = item.querySelector('.conversation-message').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || message.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    /**
     * 过滤联系人列表
     */
    function filterContacts(searchTerm) {
        const items = contactList.querySelectorAll('.contact-item');
        
        items.forEach(item => {
            const name = item.textContent.toLowerCase();
            
            if (name.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    /**
     * 滚动消息列表到底部
     */
    function scrollToBottom() {
        messageList.scrollTop = messageList.scrollHeight;
    }
    
    /**
     * 格式化时间
     */
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        
        // 今天的消息只显示时间
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // 昨天的消息显示"昨天"
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `昨天 ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // 一周内的消息显示星期几
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
            return `星期${weekDays[date.getDay()]} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // 其他消息显示完整日期
        return date.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    
    /**
     * 记录日志
     */
    function log(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        
        const logEntry = document.createElement('div');
        logEntry.textContent = logMessage;
        
        if (isError) {
            logEntry.classList.add('error-log');
        }
        
        logArea.appendChild(logEntry);
        logArea.scrollTop = logArea.scrollHeight;
        
        console.log(logMessage);
    }
});