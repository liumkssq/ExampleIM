document.addEventListener('DOMContentLoaded', function() {
    // 使用config.js中的配置
    const API_CONFIG = window.CONFIG || {
        API: {
            BASE_URL: 'http://localhost:8888',
            ENDPOINTS: {
                LOGIN: '/v1/user/login',
                REGISTER: '/v1/user/register',
                USER_INFO: '/v1/user/user'
            }
        },
        DEFAULT_AVATAR: 'https://via.placeholder.com/100'
    };
    // DOM元素引用
    // Tab切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // 登录表单
    const loginForm = document.getElementById('login-form');
    const loginPhone = document.getElementById('login-phone');
    const loginPassword = document.getElementById('login-password');
    
    // 注册表单
    const registerForm = document.getElementById('register-form');
    const registerPhone = document.getElementById('register-phone');
    const registerPassword = document.getElementById('register-password');
    const registerNickname = document.getElementById('register-nickname');
    const registerAvatar = document.getElementById('register-avatar');
    
    // 用户信息
    const userStatus = document.getElementById('user-status');
    const userInfoContent = document.getElementById('user-info-content');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const userId = document.getElementById('user-id');
    const userPhone = document.getElementById('user-phone');
    const userNickname = document.getElementById('user-nickname');
    const userSex = document.getElementById('user-sex');
    
    // Token相关
    const tokenValue = document.getElementById('token-value');
    const copyTokenBtn = document.getElementById('copy-token');
    const tokenExpire = document.getElementById('token-expire');
    
    // 按钮
    const refreshInfoBtn = document.getElementById('refresh-info');
    const logoutBtn = document.getElementById('logout');
    
    // API设置
    const apiBaseUrl = document.getElementById('api-base-url');
    
    // 响应区域
    const responseArea = document.getElementById('response-area');
    const clearResponseBtn = document.getElementById('clear-response');
    
    // 当前用户数据
    let currentUser = null;
    let currentToken = null;
    let tokenExpireTime = null;
    
    // 初始化时从localStorage加载用户数据和token
    function initUserData() {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const savedExpire = localStorage.getItem('tokenExpire');
        
        if (savedToken && savedUser && savedExpire) {
            currentToken = savedToken;
            currentUser = JSON.parse(savedUser);
            tokenExpireTime = parseInt(savedExpire);
            
            // 检查token是否过期
            if (Date.now() / 1000 > tokenExpireTime) {
                // token已过期，清除数据
                clearUserData();
                displayMessage('登录已过期，请重新登录', true);
            } else {
                // 更新UI显示
                updateUserInfo();
                displayMessage('已从本地存储恢复用户会话');
            }
        }
    }
    
    // 保存用户数据到localStorage
    function saveUserData() {
        if (currentToken && currentUser && tokenExpireTime) {
            localStorage.setItem('token', currentToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('tokenExpire', tokenExpireTime);
        }
    }
    
    // 清除用户数据
    function clearUserData() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpire');
        
        currentToken = null;
        currentUser = null;
        tokenExpireTime = null;
        
        // 更新UI
        userStatus.innerText = '未登录，请先登录或注册';
        userStatus.className = '';
        userInfoContent.classList.add('hidden');
        tokenValue.value = '';
        tokenExpire.innerText = '';
    }
    
    // 更新用户信息UI
    function updateUserInfo() {
        if (currentUser && currentToken) {
            userStatus.innerText = '已登录';
            userStatus.className = '';
            userInfoContent.classList.remove('hidden');
            
            // 设置用户信息
            userAvatarImg.src = currentUser.avatar || API_CONFIG.DEFAULT_AVATAR;
            userId.innerText = currentUser.id || '';
            userPhone.innerText = currentUser.mobile || '';
            userNickname.innerText = currentUser.nickname || '';
            userSex.innerText = currentUser.sex === 1 ? '男' : (currentUser.sex === 0 ? '女' : '未知');
            
            // 设置token信息
            tokenValue.value = currentToken;
            
            if (tokenExpireTime) {
                const expireDate = new Date(tokenExpireTime * 1000);
                tokenExpire.innerText = expireDate.toLocaleString();
            }
        }
    }
    
    // API请求函数
    async function apiRequest(endpoint, method, data, needAuth = false) {
        // 先检查是否在API_CONFIG中定义了该端点
        let apiEndpoint = endpoint;
        if (endpoint === '/login' && API_CONFIG.API.ENDPOINTS.LOGIN) {
            apiEndpoint = API_CONFIG.API.ENDPOINTS.LOGIN;
        } else if (endpoint === '/register' && API_CONFIG.API.ENDPOINTS.REGISTER) {
            apiEndpoint = API_CONFIG.API.ENDPOINTS.REGISTER;
        } else if (endpoint === '/user' && API_CONFIG.API.ENDPOINTS.USER_INFO) {
            apiEndpoint = API_CONFIG.API.ENDPOINTS.USER_INFO;
        }
        
        const url = `${apiBaseUrl.value}${apiEndpoint}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        if (needAuth && currentToken) {
            // 根据 swagger.json 中的 securityDefinitions 定义，使用 Authorization 头
            options.headers['Authorization'] = `Bearer ${currentToken}`;
        }
        
        try {
            displayMessage(`发送请求: ${method} ${url}`);
            if (data) {
                displayMessage(`请求数据: ${JSON.stringify(data, null, 2)}`);
            }
            
            const response = await fetch(url, options);
            const responseData = await response.json();
            
            displayMessage(`响应状态: ${response.status}`);
            displayMessage(`响应数据: ${JSON.stringify(responseData, null, 2)}`);
            
            return { success: response.ok, data: responseData };
        } catch (error) {
            displayMessage(`请求错误: ${error.message}`, true);
            return { success: false, error: error.message };
        }
    }
    
    // 获取用户信息
    async function fetchUserInfo() {
        if (!currentToken) {
            displayMessage('没有有效的token，无法获取用户信息', true);
            return;
        }
        
        const result = await apiRequest('/user', 'GET', null, true);
        
        if (result.success && result.data.info) {
            currentUser = result.data.info;
            saveUserData();
            updateUserInfo();
            displayMessage('成功获取用户信息');
        } else {
            displayMessage('获取用户信息失败', true);
        }
    }
    
    // 显示消息到响应区域
    function displayMessage(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = isError ? '❌ ' : '✅ ';
        responseArea.innerHTML += `[${timestamp}] ${prefix}${message}\n`;
        responseArea.scrollTop = responseArea.scrollHeight;
    }
    
    // 事件监听器
    
    // Tab切换
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // 更新按钮状态
            tabBtns.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 更新面板显示
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            if (tabId === 'login') {
                document.getElementById('login-panel').classList.add('active');
            } else if (tabId === 'register') {
                document.getElementById('register-panel').classList.add('active');
            } else if (tabId === 'user-info') {
                document.getElementById('user-info-panel').classList.add('active');
            }
        });
    });
    
    // 登录表单提交
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const phone = loginPhone.value.trim();
        const password = loginPassword.value.trim();
        
        if (!phone || !password) {
            displayMessage('请输入手机号和密码', true);
            return;
        }
        
        const result = await apiRequest('/login', 'POST', {
            phone: phone,
            password: password
        });
        
        if (result.success && result.data.token) {
            currentToken = result.data.token;
            tokenExpireTime = result.data.expire;
            
            displayMessage('登录成功，获取用户信息...');
            await fetchUserInfo();
            
            // 切换到用户信息页
            tabBtns.forEach(btn => {
                if (btn.dataset.tab === 'user-info') {
                    btn.click();
                }
            });
        } else {
            displayMessage('登录失败: ' + (result.data.message || '未知错误'), true);
        }
    });
    
    // 注册表单提交
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const phone = registerPhone.value.trim();
        const password = registerPassword.value.trim();
        const nickname = registerNickname.value.trim();
        const sex = document.querySelector('input[name="register-sex"]:checked').value;
        const avatar = registerAvatar.value.trim() || API_CONFIG.DEFAULT_AVATAR;
        
        if (!phone || !password || !nickname) {
            displayMessage('请填写必填字段', true);
            return;
        }
        
        // 根据 swagger.json，所有字段都是必填的
        
        const result = await apiRequest('/register', 'POST', {
            phone: phone,
            password: password,
            nickname: nickname,
            sex: parseInt(sex),
            avatar: avatar
        });
        
        if (result.success && result.data.token) {
            currentToken = result.data.token;
            tokenExpireTime = result.data.expire;
            
            displayMessage('注册成功，获取用户信息...');
            await fetchUserInfo();
            
            // 切换到用户信息页
            tabBtns.forEach(btn => {
                if (btn.dataset.tab === 'user-info') {
                    btn.click();
                }
            });
        } else {
            displayMessage('注册失败: ' + (result.data.message || '未知错误'), true);
        }
    });
    
    // 刷新用户信息
    refreshInfoBtn.addEventListener('click', async function() {
        await fetchUserInfo();
    });
    
    // 退出登录
    logoutBtn.addEventListener('click', function() {
        clearUserData();
        displayMessage('已退出登录');
    });
    
    // 复制Token
    copyTokenBtn.addEventListener('click', function() {
        if (!tokenValue.value) {
            displayMessage('没有可复制的Token', true);
            return;
        }
        
        tokenValue.select();
        document.execCommand('copy');
        displayMessage('Token已复制到剪贴板');
    });
    
    // 清除响应
    clearResponseBtn.addEventListener('click', function() {
        responseArea.innerHTML = '';
    });
    
    // 从配置设置初始值
    apiBaseUrl.value = API_CONFIG.API.BASE_URL;
    
    // 初始化
    initUserData();
    displayMessage('用户中心客户端已初始化');
    displayMessage(`API服务地址: ${API_CONFIG.API.BASE_URL}`);
    displayMessage(`当前使用的配置基于 user.yaml 和 swagger.json`);
});