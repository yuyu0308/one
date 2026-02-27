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
    
    // Skills list
    renderSkills();
    
    // Projects list
    renderProjects();
    
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
        'files': '文件资源'
    };
    
    modules.forEach((moduleName, index) => {
        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'layout-module';
        moduleDiv.draggable = true;
        moduleDiv.dataset.module = moduleName;
        moduleDiv.innerHTML = `
            <h3>${moduleNames[moduleName] || moduleName}</h3>
            <span class="drag-handle">☰</span>
        `;
        
        moduleDiv.addEventListener('dragstart', handleLayoutDragStart);
        moduleDiv.addEventListener('dragend', handleLayoutDragEnd);
        moduleDiv.addEventListener('dragover', handleLayoutDragOver);
        moduleDiv.addEventListener('drop', handleLayoutDrop);
        moduleDiv.addEventListener('dragleave', handleLayoutDragLeave);
        
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
        avatar: document.getElementById('avatar').value
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
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                document.getElementById('avatar').value = data.url;
                showToast('头像上传成功', 'success');
            } else {
                showToast('上传失败', 'error');
            }
        } catch (error) {
            showToast('上传失败', 'error');
        }
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
    
    if (fileInput.files.length === 0) {
        showToast('请选择文件', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('description', description);
    
    try {
        const response = await fetch('/api/files', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('文件上传成功', 'success');
            document.getElementById('fileUploadForm').reset();
            loadFiles();
        } else {
            showToast('上传失败', 'error');
        }
    } catch (error) {
        showToast('上传失败', 'error');
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
    
    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'admin-file-item';
        fileItem.innerHTML = `
            <h4>${file.original_name}</h4>
            <p>${file.description || '暂无描述'}</p>
            <div class="file-meta">
                <span>${formatFileSize(file.size)}</span>
                <span>${file.downloads} 次下载</span>
            </div>
            <div class="file-actions">
                <a href="/files/${file.filename}" class="btn-edit" download>下载</a>
                <button class="btn-remove" onclick="deleteFile('${file.id}')">删除</button>
            </div>
        `;
        filesList.appendChild(fileItem);
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

// Theme form
document.getElementById('backgroundType').addEventListener('change', updateThemeOptions);

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
            showToast('主题已保存', 'success');
        } else {
            showToast('保存失败', 'error');
        }
    } catch (error) {
        showToast('保存失败', 'error');
    }
});

// Background image upload
document.getElementById('backgroundImageFile').addEventListener('change', async function(e) {
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
                document.getElementById('backgroundImage').value = data.url;
                showToast('背景图上传成功', 'success');
            } else {
                showToast('上传失败', 'error');
            }
        } catch (error) {
            showToast('上传失败', 'error');
        }
    }
});

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        
        this.classList.add('active');
        const sectionId = this.getAttribute('data-section') + '-section';
        document.getElementById(sectionId).classList.add('active');
        
        // Load specific section data
        const sectionName = this.getAttribute('data-section');
        if (sectionName === 'files') {
            loadFiles();
        } else if (sectionName === 'theme') {
            loadTheme();
        } else if (sectionName === 'layout') {
            loadLayout();
        }
    });
});

// Stats
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        document.getElementById('totalVisits').textContent = stats.visits || 0;
        document.getElementById('lastVisit').textContent = stats.last_visit || '-';
    } catch (error) {
        console.error('加载统计数据失败', error);
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