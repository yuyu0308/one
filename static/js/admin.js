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
        console.error('加载数据失败', error);
    }
}

// Initialize forms
function initializeForms() {
    if (currentData.profile) {
        document.getElementById('name').value = currentData.profile.name || '';
        document.getElementById('title').value = currentData.profile.title || '';
        document.getElementById('bio').value = currentData.profile.bio || '';
        document.getElementById('email').value = currentData.profile.email || '';
        document.getElementById('github').value = currentData.profile.github || '';
        document.getElementById('location').value = currentData.profile.location || '';
        document.getElementById('avatar').value = currentData.profile.avatar || '';
    }
    
    if (currentData.announcement) {
        document.getElementById('announcementEnabled').checked = currentData.announcement.enabled || false;
        document.getElementById('announcementText').value = currentData.announcement.text || '';
        document.getElementById('announcementType').value = currentData.announcement.type || 'info';
    }
}

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
            showToast('保存成功', 'success');
        } else {
            showToast(data.message || '保存失败', 'error');
        }
    } catch (error) {
        showToast('保存失败', 'error');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', function() {
    if (confirm('确定要退出登录吗？')) {
        window.location.href = '/logout';
    }
});

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        this.classList.add('active');
        const sectionName = this.getAttribute('data-section');
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    });
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