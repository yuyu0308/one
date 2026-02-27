# 🚀 Railway 部署完整指南

## 📋 部署前准备

### 1. 确保代码已推送到GitHub

你的代码已经准备好，包含：
- ✅ `app.py` - Flask应用
- ✅ `Procfile` - 启动配置
- ✅ `requirements.txt` - Python依赖
- ✅ `data.json` - 数据文件
- ✅ `templates/` - HTML模板
- ✅ `static/` - 静态资源

### 2. 确认GitHub仓库地址

仓库：https://github.com/yuyu0308/one

---

## 🎯 部署步骤

### 步骤1：注册Railway账号

1. 访问：https://railway.app
2. 点击 **Start for free**
3. 选择 **Continue with GitHub**
4. 授权Railway访问你的GitHub
5. **不需要填写任何银行卡信息！**

### 步骤2：创建新项目

1. 登录后，点击左侧的 **New Project**
2. 选择 **Deploy from GitHub repo**

### 步骤3：选择GitHub仓库

1. 在搜索框中输入：`one`
2. 选择仓库：`yuyu0308/one`
3. 点击 **Deploy now**

### 步骤4：配置服务

#### 基础设置

- **Name**: `personal-website`（或你喜欢的名字）
- **Region**: 选择 **Singapore**（新加坡，离中国近速度快）

#### 环境变量

点击 **Variables** → **New Variable**，添加以下变量：

| Key | Value |
|-----|-------|
| `FLASK_APP` | `app.py` |
| `PORT` | `8000` |
| `PYTHONUNBUFFERED` | `1` |

### 步骤5：部署

1. 点击页面底部的 **Deploy** 按钮
2. 等待部署完成（约1-3分钟）
3. 部署成功后会显示你的网站地址

### 步骤6：获取网站地址

部署成功后，你会看到：
- **Public URL**: 类似 `https://personal-website-production.up.railway.app`
- 点击该链接即可访问你的网站

---

## 🌐 网站功能

部署成功后，你的网站拥有所有动态功能：

### ✅ 前台功能
- 访问主页查看个人信息、技能、项目
- 下载文件
- 拖拽调整模块顺序

### ✅ 后台管理
- **登录**: 访问 `/admin`
- **默认密码**: `admin123`（请在后台修改）
- **个人信息**: 编辑姓名、职位、简介等
- **技能管理**: 添加/删除技能，设置熟练度
- **项目管理**: 添加/编辑/删除项目
- **文件管理**: 上传文件、查看下载统计
- **主题设置**: 自定义背景颜色、图片、鼠标样式
- **访问统计**: 查看网站访问量

---

## 🔄 更新网站

### 方法1：自动更新（推荐）

修改内容后：
```bash
cd C:\Users\lenovo\personal-website
git add .
git commit -m "更新内容"
git push
```

Railway会自动检测并重新部署（约1-2分钟）

### 方法2：手动触发

1. 登录Railway Dashboard
2. 进入你的项目
3. 点击 **Redeploy**

---

## 📊 免费额度

Railway的免费额度：

| 资源 | 免费额度 |
|------|---------|
| 运行时间 | 750小时/月（≈每天24小时） |
| 内存 | 512MB |
| CPU | 0.5 vCPU |
| 存储 | 1GB |
| 带宽 | 100GB/月 |
| 数据库 | 可选添加PostgreSQL（免费） |

**完全够用！**

---

## 🛠️ 故障排除

### 问题1：部署失败

**解决方案**：
1. 检查 **Deploy Log** 查看错误信息
2. 确认 `requirements.txt` 中的依赖正确
3. 检查 `Procfile` 格式是否正确

### 问题2：网站无法访问

**解决方案**：
1. 检查服务状态是否为 **Available**
2. 查看 **Metrics** 确认服务正在运行
3. 检查防火墙设置

### 问题3：文件上传失败

**解决方案**：
1. 检查文件大小是否超过50MB
2. 检查文件格式是否被允许
3. 查看Railway日志获取详细错误

### 问题4：响应慢

**解决方案**：
1. Railway免费服务响应速度正常
2. 首次访问可能需要等待30秒启动
3. 可以考虑升级到付费版本获得更好性能

---

## 💡 高级配置

### 添加数据库

如果需要持久化存储：

1. 在Railway项目中点击 **New Service**
2. 选择 **Database** → **PostgreSQL**
3. 点击 **Create Database**
4. 修改 `app.py` 连接数据库

### 自定义域名

1. 进入项目设置
2. 点击 **Domains**
3. 添加你的域名
4. 配置DNS

---

## 📞 获取帮助

- Railway文档：https://docs.railway.app
- GitHub仓库：https://github.com/yuyu0308/one
- 查看部署日志获取详细错误信息

---

**祝部署成功！** 🎉