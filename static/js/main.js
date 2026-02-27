// 页面数据和配置
let pageData = {};
let currentLayout = {};

// 初始化页面
async function initPage() {
    const loading = document.getElementById('loading');
    
    try {
        // 从全局变量获取数据
        if (typeof window.pageData !== 'undefined') {
            pageData = window.pageData;
        } else {
            const response = await fetch('/api/data');
            pageData = await response.json();
        }
        
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
    } catch (error) {
        console.error('初始化页面失败:', error);
        if (loading) {
            loading.innerHTML = '<p style="color: red;">加载失败，请刷新页面重试</p>';
        }
    }
}

// 应用主题
function applyTheme() {
    const theme = pageData.theme || {};
    const body = document.body;
    const dynamicStyles = document.getElementById('dynamicStyles');
    
    // 设置背景
    if (theme.background_type === 'image' && theme.background_image) {
        body.className = 'bg-image';
        body.style.backgroundImage = `url(${theme.background_image})`;
    } else if (theme.background_type === 'solid') {
        body.className = 'bg-solid';
        body.style.setProperty('--bg-color', theme.background_color || '#667eea');
    } else {
        body.className = 'bg-gradient';
        body.style.setProperty('--bg-start', theme.background_color || '#667eea');
        body.style.setProperty('--bg-end', theme.background_color_end || '#764ba2');
    }
    
    // 设置鼠标样式
    if (theme.cursor_style === 'pointer') {
        body.classList.add('cursor-pointer');
    } else if (theme.cursor_style === 'custom') {
        body.classList.add('cursor-custom');
    }
}

// 渲染模块
async function renderModules() {
    const container = document.getElementById('modules-container');
    const layout = pageData.layout || {};
    const moduleOrder = layout.module_order || ['hero', 'skills', 'projects', 'files'];
    
    // 移除加载指示器，保留模块容器
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
        container.innerHTML = '<p style="text-align: center; padding: 3rem; color: var(--text-secondary);">内容加载失败，请刷新页面重试</p>';
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
    return `
        <div class="hero">
            <div class="container">
                <div class="hero-content">
                    <img src="${profile.avatar || '/static/uploads/default-avatar.png'}" 
                         alt="${profile.name}" 
                         class="avatar"
                         onerror="this.src='/static/uploads/default-avatar.png'">
                    <h1 class="hero-title">${profile.name || '你的名字'}</h1>
                    <p class="hero-subtitle">${profile.title || '前端开发者 / 全栈工程师'}</p>
                    <p class="hero-bio">${profile.bio || '你好！我是一名热爱技术的开发者，专注于构建优秀的Web应用。'}</p>
                    <div class="hero-links">
                        <a href="mailto:${profile.email}" class="btn btn-primary">联系我</a>
                        <a href="${profile.github}" class="btn btn-secondary" target="_blank">GitHub</a>
                    </div>
                </div>
            </div>
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
                 onerror="this.src='/static/uploads/default-project.png'">
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
        const response = await fetch('/api/files');
        const files = await response.json();
        
        if (files.length === 0) {
            return '';
        }
        
        let filesHtml = files.map(file => {
            const icon = getFileIcon(file.type);
            const size = formatFileSize(file.size);
            
            return `
                <div class="file-card">
                    <div class="file-icon">${icon}</div>
                    <div class="file-name">${file.original_name}</div>
                    <div class="file-description">${file.description || '暂无描述'}</div>
                    <div class="file-info">
                        <span>${size}</span>
                        <span>${file.downloads} 次下载</span>
                    </div>
                    <a href="/files/${file.filename}" 
                       class="file-download-btn"
                       onclick="incrementDownload('${file.id}')"
                       download>
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
        console.error('加载文件列表失败:', error);
        return '';
    }
}

// 增加下载次数
function incrementDownload(fileId) {
    fetch(`/api/files/${fileId}/download`, { method: 'POST' })
        .catch(error => console.error('更新下载次数失败:', error));
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
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
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

function handleDragStart(e) {
    draggedModule = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedModule = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedModule) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
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
        
        // 更新模块顺序
        updateModuleOrder();
    }
}

// 更新模块顺序
function updateModuleOrder() {
    const container = document.getElementById('modules-container');
    const modules = container.querySelectorAll('.module');
    const newOrder = [...modules].map(m => m.dataset.module);
    
    // 发送到服务器
    fetch('/api/layout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            modules: newOrder,
            module_order: newOrder
        })
    }).catch(error => console.error('更新布局失败:', error));
}

// 初始化动画
function initAnimations() {
    // 技能条动画
    const skillBars = document.querySelectorAll('.skill-progress');
    skillBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => {
            bar.style.width = width;
        }, 500);
    });
    
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);