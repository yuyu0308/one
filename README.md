# 个人介绍网站

一个支持后台编辑的个人介绍网站，使用 Flask + HTML/CSS/JavaScript 构建。

## 功能特性

- ✨ 精美的个人主页展示
- 🔐 安全的后台管理系统
- ✏️ 在线编辑个人信息、技能、项目
- 📤 图片上传功能（头像、项目图片）
- 📊 访问统计功能
- 📱 响应式设计，支持移动端

## 技术栈

- **后端**: Python Flask
- **前端**: HTML5, CSS3, JavaScript (原生)
- **样式**: 自定义CSS (Bootstrap风格)
- **部署**: 支持Vercel、Render等云平台

## 快速开始

### 本地运行

1. 克隆项目或下载到本地

2. 安装依赖:
```bash
pip install -r requirements.txt
```

3. 运行应用:
```bash
python app.py
```

4. 访问网站:
- 主页: http://localhost:5000
- 管理后台: http://localhost:5000/admin

5. 默认登录密码: `admin123` (请在首次登录后立即修改)

## 目录结构

```
personal-website/
├── app.py                 # Flask应用主文件
├── data.json             # 数据存储文件
├── stats.json            # 访问统计文件
├── requirements.txt      # Python依赖
├── README.md            # 项目说明
├── static/              # 静态文件目录
│   ├── css/            # CSS样式文件
│   │   ├── style.css   # 主页样式
│   │   └── admin.css   # 后台样式
│   ├── js/             # JavaScript文件
│   │   ├── main.js     # 主页脚本
│   │   ├── login.js    # 登录脚本
│   │   └── admin.js    # 后台脚本
│   └── uploads/        # 上传文件目录
└── templates/          # HTML模板目录
    ├── index.html      # 主页模板
    ├── login.html      # 登录页面
    └── admin.html      # 后台管理页面
```

## 后台管理功能

### 1. 个人信息管理
- 编辑姓名、职位、简介
- 修改邮箱、GitHub链接
- 上传头像图片

### 2. 技能管理
- 添加/删除技能
- 设置技能熟练度（0-100%）

### 3. 项目管理
- 添加/编辑/删除项目
- 上传项目截图
- 设置项目标签

### 4. 访问统计
- 查看总访问量
- 查看最后访问时间

### 5. 设置
- 修改管理员密码

## 部署到云平台

### Vercel部署

1. 创建 `vercel.json` 文件:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ]
}
```

2. 创建 `.vercelignore` 文件:
```
__pycache__/
*.pyc
.env
venv/
```

3. 推送到GitHub，然后在Vercel中导入项目

### Render部署

1. 创建 `runtime.txt` 文件:
```
python-3.9.16
```

2. 在Render中创建新的Web Service
3. 连接GitHub仓库
4. 设置构建命令: `pip install -r requirements.txt`
5. 设置启动命令: `python app.py`

## 安全建议

1. **修改默认密码**: 首次登录后立即修改管理员密码
2. **使用HTTPS**: 生产环境建议使用HTTPS
3. **定期备份**: 定期备份 `data.json` 文件
4. **限制访问**: 可以考虑添加IP白名单或两步验证

## 自定义修改

### 修改主题颜色

编辑 `static/css/style.css`，修改以下变量:
```css
/* 主色调 */
--primary-color: #667eea;
--secondary-color: #764ba2;
```

### 添加新功能

在 `app.py` 中添加新的路由和API端点，然后在相应的HTML和JavaScript文件中添加UI和交互逻辑。

## 常见问题

**Q: 忘记密码怎么办？**
A: 直接编辑 `data.json` 文件，修改 `admin_password` 字段为新密码。

**Q: 图片上传失败？**
A: 检查 `static/uploads` 目录是否存在，并确保有写入权限。

**Q: 如何修改端口？**
A: 编辑 `app.py` 最后一行，修改 `port=5000` 为你想要的端口号。

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提Issue或Pull Request。