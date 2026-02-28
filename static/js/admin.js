let currentData = {};
let currentTheme = {};
let currentLayout = {};

// Load data
async function loadData() {
    try {
        const response = await fetch('/api/data');
        currentData = await response.json();
        initializeForms();
    } catch (error) {
        showToast('加载数据失败', 'error');
    }
}

// Load theme
async function loadTheme() {
    try {
        const response = await fetch('/api/theme');
        currentTheme = await response.json();
        initializeThemeForm();
    } catch (error) {
        console.error('加载主题失败', error);
    }
}

// Load layout
async function loadLayout() {
    try {
        const response = await fetch('/api/layout');
        currentLayout = await response.json();
        initializeLayoutEditor();
    } catch (error) {
        console.error('加载布局失败', error);
    }
}

// Load files
async function loadFiles() {
    try {
        // 先检查文件状态
        const statusResponse = await fetch('/api/files/status');
        const statusData = await statusResponse.json();
        
        const warningElement = document.getElementById('filesStatusWarning');
        const missingCountElement = document.getElementById('missingFilesCount');
        
        if (statusData.missing > 0) {
            warningElement.style.display = 'block';
            missingCountElement.textContent = statusData.missing;
        } else {
            warningElement.style.display = 'none';
        }
        
        // 加载文件列表
        const response = await fetch('/api/files');
        const files = await response.json();
        renderFilesList(files);
    } catch (error) {
        console.error('加载文件列表失败', error);
    }
}

// Initialize forms
function initializeForms() {
    // Profile form
    if (currentData.profile) {
        document.getElementById('name').value = currentData.profile.name || '';
        document.getElementById('title').value = currentData.profile.title || '';
        document.getElementById('bio').value = currentData.profile.bio || '';
        document.getElementById('email').value = currentData.profile.email || '';
        document.getElementById('github').value = currentData.profile.github || '';
        document.getElementById('location').value = currentData.profile.location || '';
        document.getElementById('avatar').value = currentData.profile.avatar || '';
    }
    
    // Announcement settings
    if (currentData.announcement) {
        document.getElementById('announcementEnabled').checked = currentData.announcement.enabled || false;
        document.getElementById('announcementText').value = currentData.announcement.text || '';
        document.getElementById('announcementType').value = currentData.announcement.type || 'info';
    }
    
    // Skills list
    renderSkills();
    
    // Projects list
    renderProjects();
    
    // Buttons list
    loadButtons();
    
    // Stats
    loadStats();
}

// Initialize theme form
function initializeThemeForm() {
    const theme = currentTheme || {};
    
    document.getElementById('backgroundType').value = theme.background_type || 'gradient';
    document.getElementById('backgroundColor').value = theme.background_color || '#667eea';
    document.getElementById('backgroundColorEnd').value = theme.background_color_end || '#764ba2';
    document.getElementById('backgroundImage').value = theme.background_image || '';
    document.getElementById('solidBackgroundColor').value = theme.background_color || '#667eea';
    document.getElementById('cursorStyle').value = theme.cursor_style || 'default';
    
    updateThemeOptions();
}

// Update theme options visibility
function updateThemeOptions() {
    const bgType = document.getElementById('backgroundType').value;
    
    document.getElementById('gradientOptions').style.display = bgType === 'gradient' ? 'block' : 'none';
    document.getElementById('imageOptions').style.display = bgType === 'image' ? 'block' : 'none';
    document.getElementById('solidOptions').style.display = bgType === 'solid' ? 'block' : 'none';
}

// Initialize layout editor
function initializeLayoutEditor() {
    const layout = currentLayout || {};
    const modules = layout.module_order || ['hero', 'skills', 'projects', 'files'];
    
    const container = document.getElementById('layoutModules');
    container.innerHTML = '';
    
    const moduleNames = {
        'hero': 'Hero区域',
        'skills': '技能展示',
        'projects': '项目作品',
        'files': '文件资源',
        'about': '关于我',
        'contact': '联系方式',
        'custom': '自定义模块'
    };
    
    modules.forEach((moduleName, index) => {
        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'layout-module';
        moduleDiv.draggable = true;
        moduleDiv.dataset.module = moduleName;
        moduleDiv.innerHTML = `
            <h3>${moduleNames[moduleName] || moduleName}</h3>
            <span class="drag-handle">☰</span>
            <button class="btn-delete-module" data-module="${moduleName}">删除</button>
        `;
        
        moduleDiv.addEventListener('dragstart', handleLayoutDragStart);
        moduleDiv.addEventListener('dragend', handleLayoutDragEnd);
        moduleDiv.addEventListener('dragover', handleLayoutDragOver);
        moduleDiv.addEventListener('drop', handleLayoutDrop);
        moduleDiv.addEventListener('dragleave', handleLayoutDragLeave);
        
        // 删除按钮事件
        const deleteBtn = moduleDiv.querySelector('.btn-delete-module');
        deleteBtn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const moduleToDelete = this.getAttribute('data-module');
            if (confirm(`确定要删除模块"${moduleNames[moduleToDelete] || moduleToDelete}"吗？`)) {
                await deleteModule(moduleToDelete);
                // 删除成功后重新加载模块列表
                initializeLayoutEditor();
            }
        });
        
        container.appendChild(moduleDiv);
    });
}

// Layout drag and drop
let draggedLayoutModule = null;

function handleLayoutDragStart(e) {
    draggedLayoutModule = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleLayoutDragEnd(e) {
    this.classList.remove('dragging');
    draggedLayoutModule = null;
}

function handleLayoutDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleLayoutDragLeave(e) {
}

function handleLayoutDrop(e) {
    e.preventDefault();
    
    if (this !== draggedLayoutModule) {
        const container = document.getElementById('layoutModules');
        const allModules = [...container.querySelectorAll('.layout-module')];
        const draggedIndex = allModules.indexOf(draggedLayoutModule);
        const droppedIndex = allModules.indexOf(this);
        
        if (draggedIndex < droppedIndex) {
            this.parentNode.insertBefore(draggedLayoutModule, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedLayoutModule, this);
        }
    }
}

// Delete module
async function deleteModule(moduleId) {
    try {
        const response = await fetch(`/api/modules/${moduleId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            showToast('模块已删除', 'success');
        } else {
            showToast(data.message || '删除失败', 'error');
        }
    } catch (error) {
        showToast('删除失败', 'error');
    }
}

// Add module
document.getElementById('addModuleBtn').addEventListener('click', async function() {
    const moduleName = prompt('请输入新模块名称:');
    if (!moduleName) return;
    
    try {
        const response = await fetch('/api/modules', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: moduleName,
                content: '',
                type: 'custom',
                visible: true
            })
        });
        const data = await response.json();
        if (data.success) {
            showToast('模块已添加', 'success');
            initializeLayoutEditor();
        } else {
            showToast(data.message || '添加失败', 'error');
        }
    } catch (error) {
        showToast('添加失败', 'error');
    }
});

// Save layout
document.getElementById('saveLayoutBtn').addEventListener('click', async function() {
    const container = document.getElementById('layoutModules');
    const modules = container.querySelectorAll('.layout-module');
    const newOrder = [...modules].map(m => m.dataset.module);
    
    try {
        const response = await fetch('/api/layout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                modules: newOrder,
                module_order: newOrder
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('布局已保存', 'success');
        } else {
            showToast('保存失败', 'error');
        }
    } catch (error) {
        showToast('保存失败', 'error');
    }
});

// Profile form submit
document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const profileData = {
        name: document.getElementById('name').value,
        title: document.getElementById('title').value,
        bio: document.getElementById('bio').value,
        email: document.getElementById('email').value,
        github: document.getElementById('github').value,
        location: document.getElementById('location').value,
        avatar: document.getElementById('avatar').value,
        announcementEnabled: document.getElementById('announcementEnabled').checked,
        announcementText: document.getElementById('announcementText').value,
        announcementType: document.getElementById('announcementType').value
    };
    
    try {
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('个人信息已更新', 'success');
        } else {
            showToast('更新失败', 'error');
        }
    } catch (error) {
        showToast('更新失败', 'error');
    }
});

// Avatar upload
document.getElementById('avatarFile').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('/api/upload-avatar', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                document.getElementById('avatar').value = data.avatar_url;
                showToast('头像上传成功', 'success');
                // 实时预览
                const avatarPreview = document.querySelector('.avatar-preview');
                if (avatarPreview) {
                    avatarPreview.src = data.avatar_url;
                }
            } else {
                showToast(data.message || '上传失败', 'error');
            }
        } catch (error) {
            showToast('上传失败', 'error');
        }
    }
});

// Cursor style change listener
document.getElementById('cursorStyle').addEventListener('change', function() {
    const cursorUploadGroup = document.getElementById('cursorUploadGroup');
    if (this.value === 'custom') {
        cursorUploadGroup.style.display = 'block';
    } else {
        cursorUploadGroup.style.display = 'none';
    }
});

// Cursor upload
document.getElementById('uploadCursorBtn').addEventListener('click', async function() {
    const fileInput = document.getElementById('cursorFile');
    const file = fileInput.files[0];

    if (!file) {
        showToast('请选择文件', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('cursor', file);

    try {
        const response = await fetch('/api/upload-cursor', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            showToast('鼠标文件上传成功', 'success');
            // 应用新鼠标样式
            document.body.style.cursor = `url('${data.cursor_url}'), auto`;
        } else {
            showToast(data.message || '上传失败', 'error');
        }
    } catch (error) {
        showToast('上传失败', 'error');
    }
});

// Skills management
function renderSkills() {
    const skillsList = document.getElementById('skillsList');
    skillsList.innerHTML = '';
    
    if (currentData.skills) {
        currentData.skills.forEach((skill, index) => {
            const skillItem = document.createElement('div');
            skillItem.className = 'skill-item';
            skillItem.innerHTML = `
                <div class="skill-item-header">
                    <h3>技能 #${index + 1}</h3>
                    <button class="btn-remove" onclick="removeSkill(${index})">删除</button>
                </div>
                <div class="skill-item-input">
                    <input type="text" value="${skill.name}" placeholder="技能名称" onchange="updateSkill(${index}, 'name', this.value)">
                    <input type="number" value="${skill.level}" min="0" max="100" placeholder="熟练度(0-100)" onchange="updateSkill(${index}, 'level', this.value)">
                </div>
            `;
            skillsList.appendChild(skillItem);
        });
    }
}

document.getElementById('addSkillBtn').addEventListener('click', function() {
    if (!currentData.skills) {
        currentData.skills = [];
    }
    currentData.skills.push({ name: '', level: 50 });
    renderSkills();
});

function updateSkill(index, field, value) {
    currentData.skills[index][field] = value;
}

function removeSkill(index) {
    currentData.skills.splice(index, 1);
    renderSkills();
}

document.getElementById('saveSkillsBtn').addEventListener('click', async function() {
    try {
        const response = await fetch('/api/skills', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ skills: currentData.skills })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('技能已保存', 'success');
        } else {
            showToast('保存失败', 'error');
        }
    } catch (error) {
        showToast('保存失败', 'error');
    }
});

// Projects management
function renderProjects() {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '';
    
    if (currentData.projects) {
        currentData.projects.forEach(project => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item';
            projectItem.innerHTML = `
                <div class="project-item-info">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <p>标签: ${project.tags.join(', ')}</p>
                </div>
                <div class="project-item-actions">
                    <button class="btn-edit" onclick="editProject('${project.id}')">编辑</button>
                    <button class="btn-remove" onclick="deleteProject('${project.id}')">删除</button>
                </div>
            `;
            projectsList.appendChild(projectItem);
        });
    }
}

document.getElementById('addProjectBtn').addEventListener('click', function() {
    document.getElementById('modalTitle').textContent = '添加项目';
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    document.getElementById('projectModal').style.display = 'block';
});

function editProject(projectId) {
    const project = currentData.projects.find(p => p.id === projectId);
    if (project) {
        document.getElementById('modalTitle').textContent = '编辑项目';
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectTitle').value = project.title;
        document.getElementById('projectDescription').value = project.description;
        document.getElementById('projectImage').value = project.image;
        document.getElementById('projectLink').value = project.link;
        document.getElementById('projectTags').value = project.tags.join(', ');
        document.getElementById('projectModal').style.display = 'block';
    }
}

function deleteProject(projectId) {
    if (confirm('确定要删除这个项目吗？')) {
        fetch(`/api/projects/${projectId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('项目已删除', 'success');
                loadData();
            } else {
                showToast('删除失败', 'error');
            }
        })
        .catch(() => showToast('删除失败', 'error'));
    }
}

// Project form submit
document.getElementById('projectForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const projectId = document.getElementById('projectId').value;
    const projectData = {
        title: document.getElementById('projectTitle').value,
        description: document.getElementById('projectDescription').value,
        image: document.getElementById('projectImage').value,
        link: document.getElementById('projectLink').value,
        tags: document.getElementById('projectTags').value.split(',').map(t => t.trim()).filter(t => t)
    };
    
    try {
        let response;
        if (projectId) {
            response = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            });
        } else {
            response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            });
        }
        
        const data = await response.json();
        if (data.success) {
            showToast('项目已保存', 'success');
            document.getElementById('projectModal').style.display = 'none';
            loadData();
        } else {
            showToast('保存失败', 'error');
        }
    } catch (error) {
        showToast('保存失败', 'error');
    }
});

// Project image upload
document.getElementById('projectImageFile').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                document.getElementById('projectImage').value = data.url;
                showToast('图片上传成功', 'success');
            } else {
                showToast('上传失败', 'error');
            }
        } catch (error) {
            showToast('上传失败', 'error');
        }
    }
});

// Close modal
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('projectModal').style.display = 'none';
});

window.onclick = function(event) {
    const modal = document.getElementById('projectModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// File upload
document.getElementById('fileUploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const description = document.getElementById('fileDescription').value;
    const folder = document.getElementById('fileFolder').value.trim();

    if (fileInput.files.length === 0) {
        showToast('请选择文件', 'error');
        return;
    }

    const formData = new FormData();
    // 批量上传所有选中的文件
    for (let i = 0; i < fileInput.files.length; i++) {
        formData.append('files', fileInput.files[i]);
    }
    formData.append('description', description);
    if (folder) {
        formData.append('folder', folder);
    }

    try {
        showToast(`正在上传 ${fileInput.files.length} 个文件...`, 'info');
        const response = await fetch('/api/files', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            showToast(data.message, 'success');
            document.getElementById('fileUploadForm').reset();
            loadFiles();

            if (data.errors && data.errors.length > 0) {
                console.warn('部分文件上传失败:', data.errors);
                setTimeout(() => {
                    showToast(`${data.errors.length} 个文件上传失败，请查看控制台详情`, 'warning');
                }, 2000);
            }
        } else {
            showToast(data.message || '上传失败', 'error');
        }
    } catch (error) {
        console.error('上传错误:', error);
        showToast('上传失败', 'error');
    }
});
    }
});

// Render files list
function renderFilesList(files) {
    const filesList = document.getElementById('filesList');
    filesList.innerHTML = '';

    if (files.length === 0) {
        filesList.innerHTML = '<p>暂无文件</p>';
        return;
    }

    // 按文件夹分组
    const groupedFiles = {};
    files.forEach(file => {
        const folder = file.folder || 'root';
        if (!groupedFiles[folder]) {
            groupedFiles[folder] = [];
        }
        groupedFiles[folder].push(file);
    });

    // 渲染文件夹和文件
    Object.keys(groupedFiles).forEach(folder => {
        if (folder !== 'root') {
            const folderDiv = document.createElement('div');
            folderDiv.className = 'file-folder';
            folderDiv.innerHTML = `<h3>📁 ${folder}</h3>`;
            filesList.appendChild(folderDiv);
        }

        groupedFiles[folder].forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'admin-file-item';
            fileItem.innerHTML = `
                <h4>${file.original_name}</h4>
                ${file.folder ? `<span class="file-folder-badge">${file.folder}</span>` : ''}
                <p>${file.description || '暂无描述'}</p>
                <div class="file-meta">
                    <span>${formatFileSize(file.size)}</span>
                    <span>${file.downloads} 次下载</span>
                    <span>${file.upload_date}</span>
                </div>
                <div class="file-actions">
                    <a href="/files/${file.relative_path || file.filename}" class="btn-edit" download>下载</a>
                    <button class="btn-remove" onclick="deleteFile('${file.id}')">删除</button>
                </div>
            `;
            filesList.appendChild(fileItem);
        });
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function deleteFile(fileId) {
    if (confirm('确定要删除这个文件吗？')) {
        fetch(`/api/files/${fileId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('文件已删除', 'success');
                loadFiles();
            } else {
                showToast('删除失败', 'error');
            }
        })
        .catch(() => showToast('删除失败', 'error'));
    }
}

// Buttons management
async function loadButtons() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        const buttons = data.buttons || [];
        const buttonsList = document.getElementById('buttonsList');
        
        if (buttons.length === 0) {
            buttonsList.innerHTML = '<p class="empty-state">暂无按钮</p>';
            return;
        }
        
        buttonsList.innerHTML = buttons.map(btn => `
            <div class="admin-button-item" data-button-id="${btn.id}">
                <div class="button-info">
                    <span class="button-text">${btn.icon}${btn.text}</span>
                    <span class="button-meta">样式: ${btn.style} • 顺序: ${btn.order}</span>
                </div>
                <div class="button-actions">
                    <button class="btn btn-sm btn-edit" onclick="editButton('${btn.id}')">编辑</button>
                    <button class="btn btn-sm btn-delete" onclick="deleteButton('${btn.id}')">删除</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载按钮失败:', error);
    }
}

// 保存按钮配置
document.getElementById('saveButtonsBtn')?.addEventListener('click', async function() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        // 从DOM中获取所有按钮数据
        const buttonItems = document.querySelectorAll('.admin-button-item');
        const buttons = [];
        
        buttonItems.forEach(item => {
            const buttonId = item.getAttribute('data-button-id');
            const text = item.querySelector('.button-text')?.textContent || '';
            const metaText = item.querySelector('.button-meta')?.textContent || '';
            
            // 解析元数据
            const styleMatch = metaText.match(/样式:\s*(\w+)/);
            const orderMatch = metaText.match(/顺序:\s*(\d+)/);
            
            buttons.push({
                id: buttonId,
                text: text.replace(/^[^\w\u4e00-\u9fa5]+/, ''), // 移除图标
                icon: text.match(/^[^\w\u4e00-\u9fa5]+/)?.[0] || '',
                style: styleMatch ? styleMatch[1] : 'primary',
                order: orderMatch ? parseInt(orderMatch[1]) : buttons.length + 1
            });
        });
        
        data.buttons = buttons;
        
        await fetch('/api/data', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        showToast('按钮配置已保存', 'success');
        loadButtons();
    } catch (error) {
        console.error('保存按钮配置失败:', error);
        showToast('保存失败', 'error');
    }
});

// 添加按钮
document.getElementById('addButtonBtn')?.addEventListener('click', function() {
    const buttonsList = document.getElementById('buttonsList');
    const newId = 'btn_' + Date.now();
    
    const btnHtml = `
        <div class="admin-button-item" data-button-id="${newId}">
            <div class="button-edit-form">
                <div class="form-group">
                    <label>按钮文字</label>
                    <input type="text" class="button-text-input" value="新按钮">
                </div>
                <div class="form-group">
                    <label>图标</label>
                    <input type="text" class="button-icon-input" placeholder="如: 🎯">
                </div>
                <div class="form-group">
                    <label>链接</label>
                    <input type="text" class="button-url-input" value="#">
                </div>
                <div class="form-group">
                    <label>样式</label>
                    <select class="button-style-input">
                        <option value="primary">主按钮</option>
                        <option value="secondary">次按钮</option>
                        <option value="nav">导航按钮</option>
                    </select>
                </div>
                <div class="button-edit-actions">
                    <button class="btn btn-primary" onclick="saveButton('${newId}')">保存</button>
                    <button class="btn btn-secondary" onclick="cancelEditButton('${newId}')">取消</button>
                </div>
            </div>
        </div>
    `;
    
    buttonsList.insertAdjacentHTML('afterbegin', btnHtml);
});

// 保存按钮
async function saveButton(buttonId) {
    const btnItem = document.querySelector(`[data-button-id="${buttonId}"]`);
    const text = btnItem.querySelector('.button-text-input').value;
    const icon = btnItem.querySelector('.button-icon-input').value;
    const url = btnItem.querySelector('.button-url-input').value;
    const style = btnItem.querySelector('.button-style-input').value;
    
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        if (!data.buttons) data.buttons = [];
        
        const existingIndex = data.buttons.findIndex(b => b.id === buttonId);
        const buttonData = {
            id: buttonId,
            text: text,
            icon: icon,
            url: url,
            style: style,
            order: existingIndex >= 0 ? data.buttons[existingIndex].order : data.buttons.length + 1
        };
        
        if (existingIndex >= 0) {
            data.buttons[existingIndex] = buttonData;
        } else {
            data.buttons.push(buttonData);
        }
        
        await fetch('/api/data', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        showToast('按钮已保存', 'success');
        loadButtons();
    } catch (error) {
        showToast('保存失败', 'error');
    }
}

// 编辑按钮
function editButton(buttonId) {
    const btnItem = document.querySelector(`[data-button-id="${buttonId}"]`);
    const text = btnItem.querySelector('.button-text').textContent;
    
    // 简单实现：用prompt
    const newText = prompt('编辑按钮文字:', text);
    if (newText) {
        btnItem.querySelector('.button-text').textContent = newText;
        showToast('请点击保存按钮配置', 'success');
    }
}

// 取消编辑
function cancelEditButton(buttonId) {
    const btnItem = document.querySelector(`[data-button-id="${buttonId}"]`);
    if (btnItem && confirm('取消编辑?')) {
        btnItem.remove();
        loadButtons();
    }
}

// 删除按钮
async function deleteButton(buttonId) {
    if (!confirm('确定要删除这个按钮吗?')) return;
    
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        data.buttons = data.buttons.filter(b => b.id !== buttonId);
        
        await fetch('/api/data', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        showToast('按钮已删除', 'success');
        loadButtons();
    } catch (error) {
        showToast('删除失败', 'error');
    }
}

// Theme form
document.getElementById('backgroundType').addEventListener('change', updateThemeOptions);

// 前端主题背景图上传
document.getElementById('backgroundImageFile')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        showToast('正在上传图片...', 'info');
        const response = await fetch('/api/upload-background', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('backgroundImage').value = data.url;
            showToast('图片上传成功', 'success');
        } else {
            showToast(data.message || '上传失败', 'error');
        }
    } catch (error) {
        console.error('上传背景图失败:', error);
        showToast('上传失败', 'error');
    }
});

document.getElementById('themeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const bgType = document.getElementById('backgroundType').value;
    let themeData = {
        background_type: bgType,
        cursor_style: document.getElementById('cursorStyle').value
    };
    
    if (bgType === 'gradient') {
        themeData.background_color = document.getElementById('backgroundColor').value;
        themeData.background_color_end = document.getElementById('backgroundColorEnd').value;
    } else if (bgType === 'image') {
        themeData.background_image = document.getElementById('backgroundImage').value;
    } else if (bgType === 'solid') {
        themeData.background_color = document.getElementById('solidBackgroundColor').value;
    }
    
    // 保存前台主题
    try {
        const response = await fetch('/api/theme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(themeData)
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('前台主题已保存', 'success');
        } else {
            showToast(data.message || '保存失败', 'error');
        }
    } catch (error) {
        showToast('保存失败', 'error');
    }
    
    // 保存后台主题
    const adminThemeData = {
        primary_color: document.getElementById('adminPrimaryColor').value,
        sidebar_bg: document.getElementById('adminSidebarBg').value,
        sidebar_text: document.getElementById('adminSidebarText').value,
        content_bg: document.getElementById('adminContentBg').value,
        card_bg: document.getElementById('adminCardBg').value
    };
    
    try {
        const response = await fetch('/api/admin-theme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adminThemeData)
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('后台主题已保存', 'success');
            applyAdminTheme(adminThemeData);
        } else {
            console.error('后台主题保存失败:', data);
            showToast(data.message || '后台主题保存失败', 'error');
        }
    } catch (error) {
        console.error('后台主题保存错误:', error);
        showToast('后台主题保存失败: ' + error.message, 'error');
    }
});

// Admin theme form
document.getElementById('adminBackgroundType')?.addEventListener('change', function() {
    const bgType = this.value;
    document.getElementById('adminGradientOptions').style.display = bgType === 'gradient' ? 'block' : 'none';
    document.getElementById('adminImageOptions').style.display = bgType === 'image' ? 'block' : 'none';
    document.getElementById('adminSolidOptions').style.display = bgType === 'solid' ? 'block' : 'none';
});

document.getElementById('adminThemeForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const bgType = document.getElementById('adminBackgroundType').value;
    let adminThemeData = {
        background_type: bgType
    };
    
    if (bgType === 'gradient') {
        adminThemeData.background_color = document.getElementById('adminBackgroundColor').value;
        adminThemeData.background_color_end = document.getElementById('adminBackgroundColorEnd').value;
    } else if (bgType === 'image') {
        adminThemeData.background_image = document.getElementById('adminBackgroundImage').value;
    } else if (bgType === 'solid') {
        adminThemeData.background_color = document.getElementById('adminSolidBackgroundColor').value;
    }
    
    try {
        const response = await fetch('/api/admin-theme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adminThemeData)
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('后台主题已保存', 'success');
            applyAdminTheme(adminThemeData);
        } else {
            showToast(data.message || '保存失败', 'error');
        }
    } catch (error) {
        showToast('保存失败', 'error');
    }
});

// Stats
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        document.getElementById('totalVisits').textContent = stats.visits || 0;
        document.getElementById('lastVisit').textContent = stats.last_visit || '-';

        // 加载访问者记录
        const visitorLogs = document.getElementById('visitorLogs');
        if (stats.visitor_logs && stats.visitor_logs.length > 0) {
            visitorLogs.innerHTML = stats.visitor_logs.map(log => `
                <tr>
                    <td class="ip-address">${log.ip}</td>
                    <td class="visit-time">${log.timestamp}</td>
                    <td class="user-agent">${log.user_agent}</td>
                </tr>
            `).join('');
        } else {
            visitorLogs.innerHTML = '<tr><td colspan="3" class="no-data">暂无访问记录</td></tr>';
        }
    } catch (error) {
        console.error('加载统计数据失败', error);
    }
}

// Apply admin theme to UI
function applyAdminTheme(themeData) {
    if (!themeData) return;

    // Apply CSS variables
    const root = document.documentElement;

    if (themeData.primary_color) {
        root.style.setProperty('--admin-primary', themeData.primary_color);
    }
    if (themeData.sidebar_bg) {
        root.style.setProperty('--admin-sidebar-bg', themeData.sidebar_bg);
    }
    if (themeData.sidebar_text) {
        root.style.setProperty('--admin-sidebar-text', themeData.sidebar_text);
    }
    if (themeData.content_bg) {
        root.style.setProperty('--admin-content-bg', themeData.content_bg);
    }
    if (themeData.card_bg) {
        root.style.setProperty('--admin-card-bg', themeData.card_bg);
    }

    // Apply sidebar background
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && themeData.background_type) {
        if (themeData.background_type === 'gradient' && themeData.background_color && themeData.background_color_end) {
            sidebar.style.background = `linear-gradient(180deg, ${themeData.background_color}, ${themeData.background_color_end})`;
        } else if (themeData.background_type === 'image' && themeData.background_image) {
            sidebar.style.background = `url(${themeData.background_image}) no-repeat center center`;
            sidebar.style.backgroundSize = 'cover';
        } else if (themeData.background_type === 'solid' && themeData.background_color) {
            sidebar.style.background = themeData.background_color;
        }
    }
}

// Password change
document.getElementById('passwordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('密码已修改', 'success');
            document.getElementById('passwordForm').reset();
        } else {
            showToast(data.message || '修改失败', 'error');
        }
    } catch (error) {
        showToast('修改失败', 'error');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async function() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('登出失败', error);
    }
});

// Toast notification
function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Initialize
loadData();

// Navigation - 侧边栏导航切换 (在DOM加载后执行)
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            // 移除所有active类
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
                        });
                
                        // 添加active类到当前点击的导航项
                        this.classList.add('active');
                
                        // 显示对应的内容区域
                        const sectionName = this.getAttribute('data-section');
                        console.log('切换到:', sectionName);
                        const targetSection = document.getElementById(`${sectionName}-section`);
                        if (targetSection) {
                            targetSection.classList.add('active');
                            console.log('显示区域:', sectionName);
                
                            // 根据不同section加载相应数据
                            if (sectionName === 'layout') {
                                loadLayout();
                            } else if (sectionName === 'profile') {
                                loadButtons();
                            } else if (sectionName === 'stats') {
                                loadStats();
                            }
                        } else {
                            console.error('未找到区域:', sectionName);
                        }
                    });
                });
// 退出登录
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出登录吗？')) {
                window.location.href = '/logout';
            }
        });
    }
});