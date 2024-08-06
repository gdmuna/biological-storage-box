const apiUrl = import.meta.env.VITE_API_URL;

// 封装身份验证请求函数
const authentication = {
    // 封装 fetch 作为基础请求函数
    fetch: async (url, data) => {
        return await fetch(`${apiUrl}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then((res) => {
                if (!res.ok) {
                    console.error('Request error:', res.statusText);
                }
                return res.json();
            })
            .then((res) => res.data)
            .catch((error) => {
                console.error('Request error:', error);
            });
    },
    // 封装 login 请求
    login: async (data) => {
        // 获取 jwt
        const token = await authentication.fetch('/user/login', data);
        if (token) {
            // 将 jwt 保存到 localStorage
            localStorage.setItem('token', token);
            return true;
        } else {
            return false;
        }
    },
    // 封装 register 请求
    register: async (data) => {
        // 调用注册接口，不包括 token
        const response = await authentication.fetch('/user/register', data, false);
        return response;
    }
};

export default authentication;
