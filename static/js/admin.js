let currentData = {};

// Load data
async function loadData() {
    try {
        const response = await fetch('/api/data');
        currentData = await response.json();
        initializeForms();
    } catch (error) {
        console.error('加载数据失败', error);
    }
}

// Initialize forms
function initializeForms() {
    if (currentData.profile) {
        const name = document.getElementById('name');
        const title = document.getElementById('title');
        const bio = document.getElementById('bio');
        const email = document.getElementById('email');
        const github = document.getElementById('github');
        const location = document.getElementById('location');
        const avatar = document.getElementById('avatar');
        
        if (name) name.value = currentData.profile.name || '';
        if (title) title.value = currentData.profile.title || '';
        if (bio) bio.value = currentData.profile.bio || '';
        if (email) email.value = currentData.profile.email || '';
        if (github) github.value = currentData.profile.github || '';
        if (location) location.value = currentData.profile.location || '';
        if (avatar) avatar.value = currentData.profile.avatar || '';
    }
    
    if (currentData.announcement) {
        const enabled = document.getElementById('announcementEnabled');
        const text = document.getElementById('announcementText');
        const type = document.getElementById('announcementType');
        
        if (enabled) enabled.checked = currentData.announcement.enabled || false;
        if (text) text.value = currentData.announcement.text || '';
        if (type) type.value = currentData.announcement.type || 'info';
    }
}

// Toast notification
function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

// Load files list
async function loadFilesList() {
    try {
        const response = await fetch('/api/files');
        const files = await response.json();
        
        const filesList = document.getElementById('filesList');
        if (!filesList) return;
        
        if (!files || files.length === 0) {
            filesList.innerHTML = '<p>暂无文件</p>';
            return;
        }
        
        let html = '<table class="files-table"><thead><tr><th>文件名</th><th>描述</th><th>文件夹</th><th>操作</th></tr></thead><tbody>';
        
        files.forEach(file => {
            html += `
                <tr>
                    <td>${file.name || file.filename || '未知'}</td>
                    <td>${file.description || '-'}</td>
                    <td>${file.folder || '-'}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-danger" onclick="deleteFile('${file.id || file.filename}')">删除</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        filesList.innerHTML = html;
    } catch (error) {
        console.error('加载文件列表失败', error);
    }
}

// Delete file
async function deleteFile(fileId) {
    if (!confirm('确定要删除这个文件吗？')) return;
    
    try {
        const response = await fetch(`/api/files/${fileId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('文件删除成功', 'success');
            loadFilesList();
        } else {
            showToast(data.message || '删除失败', 'error');
        }
    } catch (error) {
        showToast('删除失败', 'error');
    }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Profile form submit
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name');
            const title = document.getElementById('title');
            const bio = document.getElementById('bio');
            const email = document.getElementById('email');
            const github = document.getElementById('github');
            const location = document.getElementById('location');
            const avatar = document.getElementById('avatar');
            const announcementEnabled = document.getElementById('announcementEnabled');
            const announcementText = document.getElementById('announcementText');
            const announcementType = document.getElementById('announcementType');
            
            const profileData = {
                name: name ? name.value : '',
                title: title ? title.value : '',
                bio: bio ? bio.value : '',
                email: email ? email.value : '',
                github: github ? github.value : '',
                location: location ? location.value : '',
                avatar: avatar ? avatar.value : '',
                announcementEnabled: announcementEnabled ? announcementEnabled.checked : false,
                announcementText: announcementText ? announcementText.value : '',
                announcementType: announcementType ? announcementType.value : 'info'
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
                    showToast('保存成功', 'success');
                } else {
                    showToast(data.message || '保存失败', 'error');
                }
            } catch (error) {
                showToast('保存失败', 'error');
            }
        });
    }
    
    // Avatar upload
    const avatarFile = document.getElementById('avatarFile');
    if (avatarFile) {
        avatarFile.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('avatar', file);
            
            try {
                const response = await fetch('/api/upload-avatar', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (data.success) {
                    showToast('头像上传成功', 'success');
                    const avatarInput = document.getElementById('avatar');
                    if (avatarInput) avatarInput.value = data.avatar_url;
                } else {
                    showToast(data.message || '上传失败', 'error');
                }
            } catch (error) {
                showToast('上传失败', 'error');
            }
        });
    }
    
    // Background image upload
    const backgroundImageFile = document.getElementById('backgroundImageFile');
    if (backgroundImageFile) {
        backgroundImageFile.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await fetch('/api/upload-background', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (data.success) {
                    showToast('背景图上传成功', 'success');
                    const backgroundImageInput = document.getElementById('backgroundImage');
                    if (backgroundImageInput) backgroundImageInput.value = data.url;
                } else {
                    showToast(data.message || '上传失败', 'error');
                }
            } catch (error) {
                showToast('上传失败', 'error');
            }
        });
    }
    
    // Background type change
    const backgroundType = document.getElementById('backgroundType');
    if (backgroundType) {
        backgroundType.addEventListener('change', function() {
            const gradientOptions = document.getElementById('gradientOptions');
            const imageOptions = document.getElementById('imageOptions');
            const solidOptions = document.getElementById('solidOptions');
            
            // Hide all options
            if (gradientOptions) gradientOptions.style.display = 'none';
            if (imageOptions) imageOptions.style.display = 'none';
            if (solidOptions) solidOptions.style.display = 'none';
            
            // Show selected option
            switch(this.value) {
                case 'gradient':
                    if (gradientOptions) gradientOptions.style.display = 'block';
                    break;
                case 'image':
                    if (imageOptions) imageOptions.style.display = 'block';
                    break;
                case 'solid':
                    if (solidOptions) solidOptions.style.display = 'block';
                    break;
            }
        });
    }
    
    // Theme form submit
    const themeForm = document.getElementById('themeForm');
    if (themeForm) {
        themeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const backgroundType = document.getElementById('backgroundType');
            const backgroundColor = document.getElementById('backgroundColor');
            const backgroundColorEnd = document.getElementById('backgroundColorEnd');
            const backgroundImage = document.getElementById('backgroundImage');
            const solidBackgroundColor = document.getElementById('solidBackgroundColor');
            const cursorStyle = document.getElementById('cursorStyle');
            
            const themeData = {
                background_type: backgroundType ? backgroundType.value : 'gradient',
                background_color: backgroundColor ? backgroundColor.value : '#667eea',
                background_color_end: backgroundColorEnd ? backgroundColorEnd.value : '#764ba2',
                background_image: backgroundImage ? backgroundImage.value : '',
                solid_background_color: solidBackgroundColor ? solidBackgroundColor.value : '#667eea',
                cursor_style: cursorStyle ? cursorStyle.value : 'default'
            };
            
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
                    showToast('主题保存成功', 'success');
                } else {
                    showToast(data.message || '保存失败', 'error');
                }
            } catch (error) {
                showToast('保存失败', 'error');
            }
        });
    }
    
    // File upload form submit
    const fileUploadForm = document.getElementById('fileUploadForm');
    if (fileUploadForm) {
        fileUploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('fileInput');
            const fileFolder = document.getElementById('fileFolder');
            const fileDescription = document.getElementById('fileDescription');
            
            const files = fileInput.files;
            if (!files || files.length === 0) {
                showToast('请选择文件', 'error');
                return;
            }
            
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            if (fileFolder && fileFolder.value) {
                formData.append('folder', fileFolder.value);
            }
            if (fileDescription && fileDescription.value) {
                formData.append('description', fileDescription.value);
            }
            
            try {
                const response = await fetch('/api/files', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (data.success) {
                    showToast('文件上传成功', 'success');
                    fileInput.value = '';
                    if (fileFolder) fileFolder.value = '';
                    if (fileDescription) fileDescription.value = '';
                    loadFilesList();
                } else {
                    showToast(data.message || '上传失败', 'error');
                }
            } catch (error) {
                showToast('上传失败', 'error');
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出登录吗？')) {
                window.location.href = '/logout';
            }
        });
    }
    
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems) {
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all nav items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Remove active class from all sections
                const sections = document.querySelectorAll('.content-section');
                sections.forEach(section => section.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Show corresponding section
                const sectionName = this.getAttribute('data-section');
                const targetSection = document.getElementById(`${sectionName}-section`);
                if (targetSection) {
                    targetSection.classList.add('active');
                    
                    // Load files list when switching to files section
                    if (sectionName === 'files') {
                        loadFilesList();
                    }
                }
            });
        });
    }
});

// Initialize
loadData();