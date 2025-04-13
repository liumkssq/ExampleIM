document.addEventListener('DOMContentLoaded', function() {
    // DOM元素引用
    const serverUrlInput = document.getElementById('serverUrl');
    const userIdInput = document.getElementById('userId');
    const tokenInput = document.getElementById('token');
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const connectionStatus = document.getElementById('connectionStatus');
    const methodSelect = document.getElementById('method');
    const conversationForm = document.getElementById('conversationForm');
    const conversationIdInput = document.getElementById('conversationId');
    const chatTypeSelect = document.getElementById('chatType');
    const recvIdInput = document.getElementById('recvId');
    const messageTypeSelect = document.getElementById('messageType');
    const messageContentInput = document.getElementById('messageContent');
    const sendMsgBtn = document.getElementById('sendMsgBtn');
    const messageList = document.getElementById('messageList');
    const clearMsgBtn = document.getElementById('clearMsgBtn');
    const logArea = document.getElementById('logArea');
    const clearLogBtn = document.getElementById('clearLogBtn');

    // 全局变量
    let socket = null;
    let messageId = 1; // 消息ID从1开始自增

    // 初始化日志
    log('WebSocket客户端已初始化');

    // 连接WebSocket
    connectBtn.addEventListener('click', function() {
        const serverUrl = serverUrlInput.value.trim();
        const userId = userIdInput.value.trim();
        const token = tokenInput.value.trim();

        if (!serverUrl) {
            log('错误: 服务器地址不能为空');
            return;
        }

        if (!userId) {
            log('错误: 用户ID不能为空');
            return;
        }

        if (!token) {
            log('错误: JWT Token不能为空');
            return;
        }

        // 准备使用请求头传递token（仅在支持时使用）
        let wsUrl;
        let useHeader = false;
        
        // 创建一个单选按钮组，如果不存在
        if (!document.getElementById('tokenLocation')) {
            const tokenLocationDiv = document.createElement('div');
            tokenLocationDiv.className = 'form-group';
            tokenLocationDiv.innerHTML = `
                <label>Token传递方式：</label>
                <div class="radio-group">
                    <label><input type="radio" name="tokenLocation" id="tokenQueryParam" value="query" checked> URL参数</label>
                    <label><input type="radio" name="tokenLocation" id="tokenHeader" value="header"> 请求头</label>
                </div>
            `;
            const buttonGroup = document.querySelector('.button-group');
            buttonGroup.parentNode.insertBefore(tokenLocationDiv, buttonGroup);
        }
        
        // 确定使用哪种方式传递token
        const useHeaderRadio = document.getElementById('tokenHeader');
        useHeader = useHeaderRadio && useHeaderRadio.checked;
        
        if (useHeader) {
            // 使用请求头方式 - 只在初始握手时有效
            wsUrl = serverUrl;
            log('将使用请求头传递Token（Authorization: Bearer）');
        } else {
            // 使用URL查询参数方式 - 最常用于WebSocket
            wsUrl = `${serverUrl}?token=${encodeURIComponent(token)}`;
            log('将使用URL查询参数传递Token');
        }
        
        try {
            connectionStatus.textContent = '正在连接...';
            connectionStatus.className = 'status connecting';
            log(`正在连接到: ${wsUrl}`);
            
            // 创建WebSocket连接
            let ws;
            
            if (useHeader && 'WebSocket' in window) {
                // 使用自定义头的方式（这需要浏览器支持）
                const protocols = [];
                const wsOptions = {};
                
                try {
                    // 尝试使用headers选项（大多数浏览器不支持）
                    wsOptions.headers = {
                        'Authorization': `Bearer ${token}`
                    };
                    ws = new WebSocket(wsUrl, protocols, wsOptions);
                } catch (headerError) {
                    log('使用请求头方式失败，将尝试URL参数方式');
                    // 回退到URL参数方式
                    wsUrl = `${serverUrl}?token=${encodeURIComponent(token)}`;
                    ws = new WebSocket(wsUrl);
                }
            } else {
                ws = new WebSocket(wsUrl);
            }
            
            // 保存token供后续使用
            ws.userToken = token;
            ws.userId = userId;
            
            socket = ws;
            
            socket.onopen = function() {
                log('连接成功!');
                connectionStatus.textContent = '已连接';
                connectionStatus.className = 'status connected';
                
                // 更新UI状态
                connectBtn.disabled = true;
                disconnectBtn.disabled = false;
                sendMsgBtn.disabled = false;
                
                // 发送用户上线消息，可以在消息中加入token字段以便每条消息都验证
                sendMessage('user.online', {
                    userId: userId,
                    // 如果需要在每个消息中携带token (取决于服务端实现)
                    // token: token
                });
            };
            
            socket.onmessage = function(event) {
                const data = event.data;
                log(`收到消息: ${data}`);
                try {
                    const message = JSON.parse(data);
                    displayMessage(message, false);
                } catch (error) {
                    log(`解析消息错误: ${error.message}`);
                }
            };
            
            socket.onclose = function(event) {
                log(`连接关闭，代码: ${event.code}，原因: ${event.reason || "未知原因"}`);
                resetConnection();
            };
            
            socket.onerror = function(error) {
                log(`WebSocket错误: ${error.message || "未知错误"}`);
                resetConnection();
            };
        } catch (error) {
            log(`创建WebSocket连接时出错: ${error.message}`);
            resetConnection();
        }
    });

    // 断开连接
    disconnectBtn.addEventListener('click', function() {
        if (socket) {
            socket.close();
            log('主动断开连接');
        }
    });

    // 消息类型切换
    methodSelect.addEventListener('change', function() {
        const method = methodSelect.value;
        // 根据不同的消息类型可以动态调整表单
        if (method === 'user.online') {
            // 用户上线消息简单，不需要额外的表单字段
            conversationForm.style.display = 'none';
        } else {
            // 聊天和推送消息需要更多字段
            conversationForm.style.display = 'block';
        }
    });

    // 发送消息
    sendMsgBtn.addEventListener('click', function() {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            log('错误: WebSocket未连接');
            return;
        }
        
        const method = methodSelect.value;
        let messageData = {};
        
        switch (method) {
            case 'user.online':
                messageData = {
                    userId: userIdInput.value.trim()
                };
                break;
                
            case 'conversation.chat':
                const conversationId = conversationIdInput.value.trim();
                const recvId = recvIdInput.value.trim();
                const content = messageContentInput.value.trim();
                
                if (!conversationId || !recvId || !content) {
                    log('错误: 会话ID、接收者ID和消息内容不能为空');
                    return;
                }
                
                messageData = {
                    conversationId: conversationId,
                    chatType: parseInt(chatTypeSelect.value),
                    recvId: recvId,
                    msg: {
                        mType: messageTypeSelect.value,
                        content: content
                    },
                    sendTime: Date.now()
                };
                break;
                
            case 'push':
                const pushConversationId = conversationIdInput.value.trim();
                const pushRecvId = recvIdInput.value.trim();
                const pushContent = messageContentInput.value.trim();
                
                if (!pushConversationId || !pushRecvId || !pushContent) {
                    log('错误: 会话ID、接收者ID和消息内容不能为空');
                    return;
                }
                
                messageData = {
                    conversationId: pushConversationId,
                    chatType: parseInt(chatTypeSelect.value),
                    recvId: pushRecvId,
                    sendId: userIdInput.value.trim(),
                    mType: messageTypeSelect.value,
                    content: pushContent,
                    sendTime: Date.now()
                };
                break;
        }
        
        sendMessage(method, messageData);
        
        // 重置消息输入框
        if (method !== 'user.online') {
            messageContentInput.value = '';
        }
    });

    // 清除消息列表
    clearMsgBtn.addEventListener('click', function() {
        messageList.innerHTML = '';
    });

    // 清除日志
    clearLogBtn.addEventListener('click', function() {
        logArea.textContent = '';
    });

    // 发送WebSocket消息
    function sendMessage(method, data) {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            log('错误: WebSocket未连接');
            return;
        }
        
        // 添加token到data中，根据需要决定是否使用
        // if (socket.userToken && method !== 'user.online') {
        //    data.token = socket.userToken;
        // }
        
        const message = {
            frameType: "data", // 对应server.go中的FrameData
            method: method,
            id: String(messageId++),
            data: data
        };
        
        try {
            const messageStr = JSON.stringify(message);
            socket.send(messageStr);
            log(`发送消息: ${messageStr}`);
            
            // 在UI中显示已发送的消息
            displayMessage(message, true);
        } catch (error) {
            log(`发送消息出错: ${error.message}`);
        }
    }

    // 在消息列表中显示消息
    function displayMessage(message, isSent) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        
        const header = document.createElement('div');
        header.className = 'message-header';
        header.textContent = isSent 
            ? `已发送 (类型: ${message.method || "未知"})`
            : `已接收 (类型: ${message.method || message.frameType || "未知"})`;
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // 尝试解析和显示消息内容
        try {
            let contentText = "";
            if (typeof message.data === 'object') {
                contentText = JSON.stringify(message.data, null, 2);
            } else {
                contentText = message.data || JSON.stringify(message);
            }
            content.innerHTML = `<pre>${escapeHtml(contentText)}</pre>`;
        } catch (error) {
            content.textContent = `[无法显示消息内容: ${error.message}]`;
        }
        
        const footer = document.createElement('div');
        footer.className = 'message-footer';
        footer.textContent = `ID: ${message.id || "未知"} · ${getCurrentTime()}`;
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(content);
        messageDiv.appendChild(footer);
        
        messageList.appendChild(messageDiv);
        messageList.scrollTop = messageList.scrollHeight;
    }

    // 重置连接状态
    function resetConnection() {
        socket = null;
        connectionStatus.textContent = '未连接';
        connectionStatus.className = 'status disconnected';
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        sendMsgBtn.disabled = true;
    }

    // 记录日志
    function log(message) {
        const timestamp = getCurrentTime();
        logArea.textContent += `[${timestamp}] ${message}\n`;
        logArea.scrollTop = logArea.scrollHeight;
    }

    // 获取当前时间字符串
    function getCurrentTime() {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    }

    // HTML转义
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 初始项目设置
    methodSelect.dispatchEvent(new Event('change'));
});