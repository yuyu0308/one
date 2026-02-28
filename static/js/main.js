// 页面数据和配置
let pageData = {};

// 初始化页面
async function initPage() {
    const loading = document.getElementById('loading');
    
    try {
        // 从data.json文件加载数据，添加时间戳防止缓存
        const response = await fetch('/data.json?t=' + Date.now());
        if (!response.ok) {
            throw new Error(`无法加载数据: ${response.status} ${response.statusText}`);
        }
        pageData = await response.json();
        
        console.log('页面数据加载成功:', pageData);
        
        // 应用主题
        applyTheme();
        
        // 渲染模块
        await renderModules();
        
        // 移除加载指示器
        if (loading) {
            loading.remove();
        }
        
        // 初始化拖拽功能
        initDragAndDrop();
        
        // 添加页面加载动画
        initAnimations();
        
        // 初始化模块拖动编辑
        initModuleDragAndDrop();
    } catch (error) {
        console.error('初始化页面失败:', error);
        if (loading) {
            loading.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p style="color: red; margin-bottom: 1rem;">加载失败</p>
                    <p style="color: #6b7280; font-size: 0.9rem;">${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer;">刷新页面</button>
                </div>
            `;
        }
    }
}

// 应用主题
function applyTheme() {
    const theme = pageData.theme || {};
    const body = document.body;
    
    // 设置背景
    if (theme.background_type === 'image' && theme.background_image) {
        body.className = 'bg-image';
        body.style.backgroundImage = `url(${theme.background_image})`;
    } else if (theme.background_type === 'solid') {
        body.className = 'bg-solid';
        body.style.setProperty('--bg-color', theme.background_color || '#667eea');
    } else {
        body.className = 'bg-gradient';
        body.style.setProperty('--bg-start', theme.background_color || '#6366f1');
        body.style.setProperty('--bg-end', theme.background_color_end || '#ec4899');
    }
    
    // 设置鼠标样式
    const cursorStyle = theme.cursor_style || 'default';
    
    // 清除之前的鼠标样式类
    body.classList.remove('cursor-pointer', 'cursor-custom');
    body.style.cursor = '';
    
    if (cursorStyle === 'custom' && theme.custom_cursor_url) {
        // 使用自定义鼠标光标
        body.style.cursor = `url('${theme.custom_cursor_url}'), auto`;
    } else {
        // 使用预设鼠标样式
        body.style.cursor = cursorStyle;
    }
}

// 渲染模块
async function renderModules() {
    const container = document.getElementById('modules-container');
    const layout = pageData.layout || {};
    const moduleOrder = layout.module_order || ['hero', 'files'];
    
    // 移除加载指示器
    const loading = document.getElementById('loading');
    if (loading) {
        container.innerHTML = '';
    }
    
    for (const moduleName of moduleOrder) {
        try {
            const moduleHtml = await createModule(moduleName);
            if (moduleHtml) {
                container.appendChild(moduleHtml);
            }
        } catch (error) {
            console.error(`加载模块 ${moduleName} 失败:`, error);
        }
    }
    
    // 如果没有加载任何模块，显示错误信息
    if (container.children.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 3rem; color: #6b7280;">内容加载失败，请刷新页面重试</p>';
    }
}

// 创建模块
async function createModule(moduleName) {
    const module = document.createElement('div');
    module.className = 'module';
    module.id = `module-${moduleName}`;
    module.dataset.module = moduleName;
    
    switch (moduleName) {
        case 'hero':
            module.innerHTML = createHeroModule();
            break;
        case 'skills':
            module.innerHTML = createSkillsModule();
            break;
        case 'projects':
            module.innerHTML = createProjectsModule();
            break;
        case 'files':
            module.innerHTML = await createFilesModule();
            break;
        default:
            return null;
    }
    
    return module;
}

// Hero模块
function createHeroModule() {
    const profile = pageData.profile || {};
    const avatarUrl = profile.avatar && profile.avatar.trim() ? profile.avatar : '/static/uploads/default-avatar.png';
    return `
        <div class="hero">
            <div class="container">
                <div class="hero-content">
                    <img src="${avatarUrl}"
                         alt="${profile.name || '用户头像'}"
                         class="avatar interactive-avatar"
                         data-full-size="${profile.avatar || 'https://placehold.co/160'}"
                         onerror="this.src='https://placehold.co/160'; console.warn('头像加载失败，使用默认头像')">
                    <h1 class="hero-title">${profile.name || '你的名字'}</h1>
                    <p class="hero-subtitle">${profile.title || '前端开发者 / 全栈工程师'}</p>
                    <p class="hero-bio">${profile.bio || '你好！我是一名热爱技术的开发者，专注于构建优秀的Web应用。'}</p>
                    ${createHeroButtons()}
                    ${createAnnouncement()}
                </div>
            </div>
        </div>
        
        <!-- 头像放大模态框 -->
        <div id="avatar-modal" class="avatar-modal">
            <div class="avatar-modal-content">
                <span class="avatar-modal-close">&times;</span>
                <img id="avatar-modal-image" src="" alt="头像" class="avatar-modal-image">
                <div class="avatar-modal-controls">
                    <button class="avatar-control-btn" data-action="rotate-left" title="向左旋转">↺</button>
                    <button class="avatar-control-btn" data-action="rotate-right" title="向右旋转">↻</button>
                    <button class="avatar-control-btn" data-action="zoom-in" title="放大">+</button>
                    <button class="avatar-control-btn" data-action="zoom-out" title="缩小">-</button>
                    <button class="avatar-control-btn" data-action="reset" title="重置">⟲</button>
                </div>
            </div>
        </div>
    `;
}

// 创建Hero按钮
function createHeroButtons() {
    const buttons = pageData.buttons || [];
    if (buttons.length === 0) return '';
    
    const primaryButtons = buttons.filter(b => b.style === 'primary');
    const navButtons = buttons.filter(b => b.style === 'nav');
    const secondaryButtons = buttons.filter(b => b.style === 'secondary');
    
    let html = '';

    // 主按钮组
    if (primaryButtons.length > 0 || secondaryButtons.length > 0) {
        html += '<div class="hero-links">';
        [...primaryButtons, ...secondaryButtons].forEach(btn => {
            if (!btn || !btn.url) return; // 跳过无效按钮
            const icon = btn.icon ? `<span>${btn.icon}</span> ` : '';
            const isExternal = btn.url && typeof btn.url === 'string' && btn.url.startsWith('http');
            html += `<a href="${btn.url}" class="btn ${btn.style === 'primary' ? 'btn-primary' : 'btn-secondary'}" ${isExternal ? 'target="_blank"' : ''}>${icon}${btn.text}</a>`;
        });
        html += '</div>';
    }
    
    // 导航按钮组
    if (navButtons.length > 0) {
        html += '<div class="hero-navigation">';
        navButtons.forEach(btn => {
            if (!btn || !btn.url) return; // 跳过无效按钮
            const icon = btn.icon ? `<span>${btn.icon}</span> ` : '';
            const target = btn.url && typeof btn.url === 'string' ? btn.url.replace('#', '') : '';
            html += `<button class="nav-btn" data-target="${target}">${icon}${btn.text}</button>`;
        });
        html += '</div>';
    }
    
    return html;
}

// 公告栏模块
function createAnnouncement() {
    const announcement = pageData.announcement;
    if (!announcement || !announcement.enabled || !announcement.text) {
        return '';
    }
    
    const type = announcement.type || 'info';
    const typeColors = {
        'info': 'rgba(99, 102, 241, 0.2)',
        'warning': 'rgba(245, 158, 11, 0.2)',
        'success': 'rgba(16, 185, 129, 0.2)',
        'error': 'rgba(239, 68, 68, 0.2)'
    };
    
    return `
        <div class="announcement-bar" style="background: ${typeColors[type] || typeColors.info}">
            <span class="announcement-icon">📢</span>
            <span class="announcement-text">${announcement.text}</span>
        </div>
    `;
}

// Skills模块
function createSkillsModule() {
    const skills = pageData.skills || [];
    let skillsHtml = skills.map(skill => `
        <div class="skill-item">
            <div class="skill-info">
                <span class="skill-name">${skill.name}</span>
                <span class="skill-level">${skill.level}%</span>
            </div>
            <div class="skill-bar">
                <div class="skill-progress" style="width: ${skill.level}%"></div>
            </div>
        </div>
    `).join('');
    
    return `
        <section class="section skills-section">
            <div class="container">
                <h2 class="section-title">技能专长</h2>
                <div class="skills-grid">
                    ${skillsHtml}
                </div>
            </div>
        </section>
    `;
}

// Projects模块
function createProjectsModule() {
    const projects = pageData.projects || [];
    let projectsHtml = projects.map(project => `
        <div class="project-card">
            <img src="${project.image}" 
                 alt="${project.title}" 
                 class="project-image"
                 onerror="this.src='https://placehold.co/320x220'">
            <div class="project-content">
                <h3 class="project-title">${project.title}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-tags">
                    ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <a href="${project.link}" class="project-link" target="_blank">查看项目 →</a>
            </div>
        </div>
    `).join('');
    
    return `
        <section class="section projects-section">
            <div class="container">
                <h2 class="section-title">项目作品</h2>
                <div class="projects-grid">
                    ${projectsHtml}
                </div>
            </div>
        </section>
    `;
}

// Files模块
async function createFilesModule() {
    try {
        // 从API获取文件列表
        const response = await fetch('/api/files');
        if (!response.ok) {
            throw new Error('无法加载文件列表');
        }
        const files = await response.json();
        
        if (!files || files.length === 0) {
            return `
                <section class="section files-section">
                    <div class="container">
                        <h2 class="section-title">文件资源</h2>
                        <p style="text-align: center; color: rgba(255,255,255,0.7);">暂无文件</p>
                    </div>
                </section>
            `;
        }
        
        let filesHtml = files.map(file => {
            const icon = getFileIcon(file.type);
            const size = formatFileSize(file.size);
            const downloadUrl = `/files/${file.filename}`;
            
            return `
                <div class="file-card">
                    <div class="file-icon">${icon}</div>
                    <div class="file-name">${file.original_name}</div>
                    <div class="file-description">${file.description || '暂无描述'}</div>
                    <div class="file-info">
                        <span>${size}</span>
                        <span>${file.downloads || 0} 次下载</span>
                    </div>
                    <a href="${downloadUrl}"
                       class="file-download-btn"
                       target="_blank"
                       rel="noopener noreferrer"
                       onclick="incrementDownload('${file.id}'); return true;">
                        下载文件
                    </a>
                </div>
            `;
        }).join('');
        
        return `
            <section class="section files-section">
                <div class="container">
                    <h2 class="section-title">文件资源</h2>
                    <div class="files-grid">
                        ${filesHtml}
                    </div>
                </div>
            </section>
        `;
    } catch (error) {
        console.error('加载文件模块失败:', error);
        return `
            <section class="section files-section">
                <div class="container">
                    <h2 class="section-title">文件资源</h2>
                    <p style="text-align: center; color: rgba(255,255,255,0.7);">文件加载失败</p>
                </div>
            </section>
        `;
    }
}

// 增加下载计数
async function incrementDownload(fileId) {
    try {
        await fetch(`/api/files/${fileId}/download`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('记录下载次数失败:', error);
    }
}

// 获取文件图标
function getFileIcon(type) {
    const icons = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'txt': '📃',
        'zip': '📦',
        'rar': '📦',
        'mp4': '🎬',
        'mp3': '🎵',
        'avi': '🎬',
        'mkv': '🎬',
        'xlsx': '📊',
        'xls': '📊',
        'ppt': '📽️',
        'pptx': '📽️'
    };
    return icons[type] || '📁';
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (!bytes) return '未知大小';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// 模块拖动编辑
function initModuleDragAndDrop() {
    const container = document.getElementById('modules-container');
    const modules = container.querySelectorAll('.module');
    
    modules.forEach(module => {
        module.classList.add('draggable');
        module.setAttribute('draggable', 'true');
        
        module.addEventListener('dragstart', handleModuleDragStart);
        module.addEventListener('dragend', handleModuleDragEnd);
        module.addEventListener('dragover', handleModuleDragOver);
        module.addEventListener('drop', handleModuleDrop);
        module.addEventListener('dragleave', handleModuleDragLeave);
    });
}

function handleModuleDragStart(e) {
    draggedModule = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleModuleDragEnd(e) {
    this.classList.remove('dragging');
    draggedModule = null;
    saveModuleOrder();
}

function handleModuleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedModule) {
        this.classList.add('drag-over');
    }
}

function handleModuleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleModuleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (this !== draggedModule) {
        const container = document.getElementById('modules-container');
        const allModules = [...container.querySelectorAll('.module')];
        const draggedIndex = allModules.indexOf(draggedModule);
        const droppedIndex = allModules.indexOf(this);
        
        if (draggedIndex < droppedIndex) {
            this.parentNode.insertBefore(draggedModule, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedModule, this);
        }
    }
}

// 保存模块顺序
async function saveModuleOrder() {
    const container = document.getElementById('modules-container');
    const modules = container.querySelectorAll('.module');
    const newOrder = [...modules].map(m => m.dataset.module);
    
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        if (data.layout) {
            data.layout.module_order = newOrder;
            
            await fetch('/api/data', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            
            console.log('模块顺序已保存:', newOrder);
        }
    } catch (error) {
        console.error('保存模块顺序失败:', error);
    }
}

// 初始化拖拽功能
function initDragAndDrop() {
    const container = document.getElementById('modules-container');
    const modules = container.querySelectorAll('.module');
    
    modules.forEach(module => {
        module.setAttribute('draggable', 'true');
        module.classList.add('draggable');
        
        module.addEventListener('dragstart', handleDragStart);
        module.addEventListener('dragend', handleDragEnd);
        module.addEventListener('dragover', handleDragOver);
        module.addEventListener('drop', handleDrop);
        module.addEventListener('dragleave', handleDragLeave);
    });
}

let draggedModule = null;

// 拖拽开始
function handleDragStart(e) {
    draggedModule = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

// 拖拽结束
function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.module').forEach(module => {
        module.classList.remove('drag-over');
    });
}

// 拖拽经过
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

// 拖拽进入
function handleDragEnter(e) {
    this.classList.add('drag-over');
}

// 拖拽离开
function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

// 放置
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedModule !== this) {
        // 交换模块位置
        const allModules = [...document.querySelectorAll('.module')];
        const draggedIndex = allModules.indexOf(draggedModule);
        const droppedIndex = allModules.indexOf(this);

        if (draggedIndex < droppedIndex) {
            this.parentNode.insertBefore(draggedModule, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedModule, this);
        }

        // 保存新的模块顺序
        saveModuleOrder();
    }

    return false;
}

// 保存模块顺序
async function saveModuleOrder() {
    try {
        const modules = document.querySelectorAll('.module');
        const moduleOrder = [];
        
        modules.forEach(module => {
            const id = module.id.replace('module-', '');
            moduleOrder.push(id);
        });

        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                module_order: moduleOrder
            })
        });

        if (!response.ok) {
            console.error('保存模块顺序失败');
        }
    } catch (error) {
        console.error('保存模块顺序出错:', error);
    }
}

// 平滑滚动到指定模块（带模糊动画）
function scrollToModule(moduleName) {
    const targetModule = document.getElementById(`module-${moduleName}`);
    if (!targetModule) return;
    
    // 添加模糊动画效果
    document.body.classList.add('blur-transition');
    
    // 滚动到目标模块
    targetModule.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    // 移除模糊效果
    setTimeout(() => {
        document.body.classList.remove('blur-transition');
    }, 500);
}

// 初始化动画
function initAnimations() {
    // 技能条动画
    setTimeout(() => {
        const skillBars = document.querySelectorAll('.skill-progress');
        skillBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => {
                bar.style.width = width;
            }, 500);
        });
    }, 100);
    
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Hero区域导航按钮点击事件 - 使用事件委托
    document.addEventListener('click', function(e) {
        const navBtn = e.target.closest('.nav-btn');
        if (navBtn) {
            const target = navBtn.getAttribute('data-target');
            scrollToModule(target);
        }
    });
    
    // 头像交互功能
    initAvatarInteraction();
    
    // 添加滚动动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.project-card, .file-card, .skill-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}

// 头像交互功能
function initAvatarInteraction() {
    const modal = document.getElementById('avatar-modal');
    const modalImage = document.getElementById('avatar-modal-image');
    const closeBtn = document.querySelector('.avatar-modal-close');
    const controlBtns = document.querySelectorAll('.avatar-control-btn');

    // 检查必要元素是否存在
    if (!modal || !modalImage) {
        console.warn('头像模态框元素不存在，跳过初始化');
        return;
    }

    let currentRotation = 0;
    let currentZoom = 1;

    // 点击头像打开模态框
    document.querySelectorAll('.interactive-avatar').forEach(avatar => {
        avatar.addEventListener('click', function() {
            const fullSizeUrl = this.getAttribute('data-full-size');
            modalImage.src = fullSizeUrl;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    });

    // 关闭模态框
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            resetAvatarView();
        });
    }
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            resetAvatarView();
        }
    });
    
    // 控制按钮功能
    controlBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            
            switch (action) {
                case 'rotate-left':
                    currentRotation -= 90;
                    break;
                case 'rotate-right':
                    currentRotation += 90;
                    break;
                case 'zoom-in':
                    currentZoom = Math.min(currentZoom + 0.5, 3);
                    break;
                case 'zoom-out':
                    currentZoom = Math.max(currentZoom - 0.5, 0.5);
                    break;
                case 'reset':
                    resetAvatarView();
                    return;
            }
            
            updateAvatarTransform();
        });
    });
    
    // 更新头像变换
    function updateAvatarTransform() {
        modalImage.style.transform = `rotate(${currentRotation}deg) scale(${currentZoom})`;
    }
    
    // 重置头像视图
    function resetAvatarView() {
        currentRotation = 0;
        currentZoom = 1;
        updateAvatarTransform();
    }
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            resetAvatarView();
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);