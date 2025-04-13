/**
 * API客户端配置文件
 * 基于ExampleIM/apps/user/api/etc/user.yaml和swagger.json
 */
const CONFIG = {
    // API服务配置
    API: {
        // 根据user.yaml配置
        BASE_URL: 'http://localhost:8888',
        ENDPOINTS: {
            // 根据swagger.json定义
            LOGIN: '/v1/user/login',
            REGISTER: '/v1/user/register',
            USER_INFO: '/v1/user/user'
        }
    },
    
    // JWT配置 (来自user.yaml)
    JWT: {
        ACCESS_SECRET: 'imooc.com',
        ACCESS_EXPIRE: 8640000  // 秒
    },
    
    // 默认用户头像
    DEFAULT_AVATAR: 'https://via.placeholder.com/100'
};