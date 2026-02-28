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
                }
            });
        });
    }
});

// Initialize
loadData();