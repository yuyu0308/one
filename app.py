from flask import Flask, render_template, jsonify, request, send_from_directory, session
from flask_cors import CORS
from functools import wraps
import json
import os
from datetime import datetime
import uuid
import secrets

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(16))  # 用于session加密
CORS(app)

# 配置
UPLOAD_FOLDER = 'static/uploads'
FILES_FOLDER = 'static/files'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'mp4', 'mp3', 'avi', 'mkv', 'xlsx', 'xls', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['FILES_FOLDER'] = FILES_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB最大上传

# 数据存储文件
DATA_FILE = 'data.json'
STATS_FILE = 'stats.json'
FILES_DB_FILE = 'files.json'

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(FILES_FOLDER, exist_ok=True)

# 初始化数据文件
def init_data():
    default_data = {
        'profile': {
            'name': '你的名字',
            'title': '前端开发者 / 全栈工程师',
            'avatar': '/static/uploads/default-avatar.png',
            'bio': '你好！我是一名热爱技术的开发者，专注于构建优秀的Web应用。',
            'email': 'your.email@example.com',
            'github': 'https://github.com/yourusername',
            'location': '中国'
        },
        'skills': [
            {'name': 'HTML/CSS', 'level': 90},
            {'name': 'JavaScript', 'level': 85},
            {'name': 'Python', 'level': 80},
            {'name': 'React', 'level': 75}
        ],
        'projects': [
            {
                'id': str(uuid.uuid4()),
                'title': '示例项目1',
                'description': '这是一个示例项目描述',
                'image': '/static/uploads/default-project.png',
                'link': '#',
                'tags': ['Web', '前端']
            }
        ],
        'admin_password': 'admin123',  # 默认密码，请及时修改
        'theme': {
            'background_image': '',
            'background_type': 'gradient',  # gradient, image, solid
            'background_color': '#667eea',
            'background_color_end': '#764ba2',
            'cursor_style': 'default'  # default, pointer, custom
        },
        'layout': {
            'modules': ['hero', 'skills', 'projects', 'files'],
            'module_order': ['hero', 'skills', 'projects', 'files']
        }
    }
    
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_data, f, ensure_ascii=False, indent=2)
    
    if not os.path.exists(STATS_FILE):
        with open(STATS_FILE, 'w', encoding='utf-8') as f:
            json.dump({'visits': 0, 'last_visit': None, 'visitor_logs': []}, f, ensure_ascii=False, indent=2)
    
    if not os.path.exists(FILES_DB_FILE):
        with open(FILES_DB_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)

def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_stats():
    with open(STATS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_stats(stats):
    with open(STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_file_upload(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_FILE_EXTENSIONS

def load_files():
    with open(FILES_DB_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_files(files):
    with open(FILES_DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(files, f, ensure_ascii=False, indent=2)

# 登录验证装饰器
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return jsonify({'error': '未登录'}), 401
        return f(*args, **kwargs)
    return decorated_function

# 路由
@app.route('/')
def index():
    # 记录访问
    stats = load_stats()
    stats['visits'] += 1
    stats['last_visit'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # 记录访问者IP
    visitor_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    # 处理多个IP的情况（代理链）
    if ',' in visitor_ip:
        visitor_ip = visitor_ip.split(',')[0].strip()

    visitor_log = {
        'ip': visitor_ip,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'user_agent': request.headers.get('User-Agent', 'Unknown')
    }

    # 保留最近100条访问记录
    if 'visitor_logs' not in stats:
        stats['visitor_logs'] = []
    stats['visitor_logs'].append(visitor_log)
    if len(stats['visitor_logs']) > 100:
        stats['visitor_logs'] = stats['visitor_logs'][-100:]

    save_stats(stats)

    data = load_data()
    return render_template('index.html', data=data)

# 微信验证文件路由
@app.route('/3d773b4521c4a89f973f6b7d851a9edc.txt')
def wechat_verification():
    return 'de8093f9865c3ab5f01066d0711d1aa93ebc886e', 200, {'Content-Type': 'text/plain; charset=utf-8'}

@app.route('/admin')
def admin():
    if 'logged_in' not in session:
        return render_template('login.html')
    data = load_data()
    stats = load_stats()
    return render_template('admin.html', data=data, stats=stats)

@app.route('/api/login', methods=['POST'])
def login():
    data = load_data()
    password = request.json.get('password')
    
    if password == data['admin_password']:
        session['logged_in'] = True
        return jsonify({'success': True, 'message': '登录成功'})
    else:
        return jsonify({'success': False, 'message': '密码错误'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': '已登出'})

@app.route('/api/data', methods=['GET'])
def get_data():
    data = load_data()
    # 不返回密码
    if 'admin_password' in data:
        del data['admin_password']
    return jsonify(data)

@app.route('/api/data', methods=['POST'])
@login_required
def update_data():
    """更新整个data对象（用于按钮管理等）"""
    try:
        new_data = request.json
        
        if not new_data:
            return jsonify({'success': False, 'message': '没有数据'}), 400
        
        # 保留密码
        old_data = load_data()
        if 'admin_password' in old_data:
            new_data['admin_password'] = old_data['admin_password']
        
        save_data(new_data)
        return jsonify({'success': True, 'message': '数据已更新'})
    except Exception as e:
        print(f'更新data错误: {str(e)}')
        return jsonify({'success': False, 'message': f'更新失败: {str(e)}'}), 500

@app.route('/api/profile', methods=['POST'])
@login_required
def update_profile():
    try:
        data = load_data()
        profile_data = request.json
        
        if not profile_data:
            return jsonify({'success': False, 'message': '没有数据'}), 400
        
        # 确保profile字段存在
        if 'profile' not in data:
            data['profile'] = {}
        
        # 更新profile数据，保留不传的字段
        for key, value in profile_data.items():
            if value is not None and value != '':
                data['profile'][key] = value
        
        # 处理公告栏设置
        if 'announcementEnabled' in profile_data:
            if 'announcement' not in data:
                data['announcement'] = {}
            data['announcement']['enabled'] = profile_data['announcementEnabled']
            data['announcement']['text'] = profile_data.get('announcementText', '')
            data['announcement']['type'] = profile_data.get('announcementType', 'info')
        
        save_data(data)
        return jsonify({'success': True, 'message': '个人信息已更新'})
    except Exception as e:
        print(f'更新profile错误: {str(e)}')
        return jsonify({'success': False, 'message': f'更新失败: {str(e)}'}), 500

@app.route('/api/skills', methods=['POST'])
@login_required
def update_skills():
    data = load_data()
    skills = request.json.get('skills', [])
    data['skills'] = skills
    save_data(data)
    return jsonify({'success': True, 'message': '技能已更新'})

@app.route('/api/projects', methods=['GET'])
def get_projects():
    data = load_data()
    return jsonify(data.get('projects', []))

@app.route('/api/projects', methods=['POST'])
@login_required
def add_project():
    data = load_data()
    project = request.json
    project['id'] = str(uuid.uuid4())
    data['projects'].append(project)
    save_data(data)
    return jsonify({'success': True, 'message': '项目已添加', 'project': project})

@app.route('/api/projects/<project_id>', methods=['PUT'])
@login_required
def update_project(project_id):
    data = load_data()
    project_data = request.json
    
    for i, project in enumerate(data['projects']):
        if project['id'] == project_id:
            project_data['id'] = project_id
            data['projects'][i] = project_data
            save_data(data)
            return jsonify({'success': True, 'message': '项目已更新'})
    
    return jsonify({'success': False, 'message': '项目未找到'}), 404

@app.route('/api/projects/<project_id>', methods=['DELETE'])
@login_required
def delete_project(project_id):
    data = load_data()
    data['projects'] = [p for p in data['projects'] if p['id'] != project_id]
    save_data(data)
    return jsonify({'success': True, 'message': '项目已删除'})

@app.route('/api/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '没有文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': '没有选择文件'}), 400
    
    if file and allowed_file(file.filename):
        # 生成唯一文件名
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        file.save(filepath)
        file_url = f"/static/uploads/{filename}"
        
        return jsonify({
            'success': True,
            'message': '上传成功',
            'url': file_url
        })
    
    return jsonify({'success': False, 'message': '不支持的文件格式'}), 400

@app.route('/api/stats', methods=['GET'])
@login_required
def get_stats():
    stats = load_stats()
    return jsonify(stats)

@app.route('/api/password', methods=['POST'])
@login_required
def change_password():
    data = load_data()
    old_password = request.json.get('old_password')
    new_password = request.json.get('new_password')
    
    if old_password != data['admin_password']:
        return jsonify({'success': False, 'message': '旧密码错误'}), 400
    
    if len(new_password) < 6:
        return jsonify({'success': False, 'message': '新密码至少6位'}), 400
    
    data['admin_password'] = new_password
    save_data(data)
    
    return jsonify({'success': True, 'message': '密码已修改'})

# 文件管理路由
@app.route('/api/files', methods=['GET'])
def get_files():
    files = load_files()
    return jsonify(files)

@app.route('/api/files', methods=['POST'])
@login_required
def upload_file_resource():
    if 'files' not in request.files:
        return jsonify({'success': False, 'message': '没有文件'}), 400

    files = request.files.getlist('files')
    description = request.form.get('description', '')
    folder = request.form.get('folder', '').strip()

    if not files or all(f.filename == '' for f in files):
        return jsonify({'success': False, 'message': '没有选择文件'}), 400

    uploaded_files = []
    errors = []

    for file in files:
        if file.filename == '':
            continue

        if allowed_file_upload(file.filename):
            try:
                # 生成唯一文件名
                ext = file.filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4().hex}.{ext}"

                # 如果有文件夹，创建文件夹路径
                if folder:
                    folder_path = os.path.join(app.config['FILES_FOLDER'], folder)
                    os.makedirs(folder_path, exist_ok=True)
                    filepath = os.path.join(folder_path, unique_filename)
                    relative_path = f"{folder}/{unique_filename}"
                else:
                    filepath = os.path.join(app.config['FILES_FOLDER'], unique_filename)
                    relative_path = unique_filename

                file.save(filepath)

                # 保存文件信息
                files_db = load_files()
                file_info = {
                    'id': str(uuid.uuid4()),
                    'original_name': file.filename,
                    'filename': unique_filename,
                    'relative_path': relative_path,
                    'folder': folder if folder else None,
                    'description': description,
                    'size': os.path.getsize(filepath),
                    'upload_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'type': ext,
                    'downloads': 0
                }
                files_db.append(file_info)
                save_files(files_db)

                uploaded_files.append(file_info)
            except Exception as e:
                errors.append(f"{file.filename}: {str(e)}")
        else:
            errors.append(f"{file.filename}: 不支持的文件格式")

    if uploaded_files:
        message = f'成功上传 {len(uploaded_files)} 个文件'
        if errors:
            message += f'，{len(errors)} 个文件失败'
        return jsonify({
            'success': True,
            'message': message,
            'files': uploaded_files,
            'errors': errors
        })

    return jsonify({
        'success': False,
        'message': '文件上传失败',
        'errors': errors
    }), 400

@app.route('/api/files/<file_id>', methods=['DELETE'])
@login_required
def delete_file(file_id):
    try:
        files = load_files()
        file_to_delete = None
        
        for file_info in files:
            if file_info['id'] == file_id:
                file_to_delete = file_info
                break
        
        if not file_to_delete:
            return jsonify({'success': False, 'message': '文件未找到'}), 404
        
        # 删除物理文件
        filepath = os.path.join(app.config['FILES_FOLDER'], file_to_delete['filename'])
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # 从数据库中删除
        files = [f for f in files if f['id'] != file_id]
        save_files(files)
        
        return jsonify({'success': True, 'message': '文件已删除'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'删除失败: {str(e)}'}), 500

@app.route('/files/<path:filename>')
def download_file(filename):
    # 支持文件夹路径（例如：documents/file.pdf）
    return send_from_directory(app.config['FILES_FOLDER'], filename, as_attachment=True)

@app.route('/api/files/<file_id>/download', methods=['POST'])
def increment_download(file_id):
    files = load_files()
    for file_info in files:
        if file_info['id'] == file_id:
            file_info['downloads'] += 1
            save_files(files)
            return jsonify({'success': True})
    return jsonify({'success': False, 'message': '文件未找到'}), 404

# 主题设置路由
@app.route('/api/theme', methods=['GET'])
def get_theme():
    data = load_data()
    return jsonify(data.get('theme', {}))

@app.route('/api/theme', methods=['POST'])
@login_required
def update_theme():
    try:
        data = load_data()
        theme_data = request.json
        
        if not theme_data:
            return jsonify({'success': False, 'message': '没有数据'}), 400
        
        # 确保theme字段存在
        if 'theme' not in data:
            data['theme'] = {}
        
        # 合并主题数据
        data['theme'].update(theme_data)
        
        save_data(data)
        return jsonify({'success': True, 'message': '主题已更新'})
    except Exception as e:
        print(f'更新主题错误: {str(e)}')
        return jsonify({'success': False, 'message': f'更新失败: {str(e)}'}), 500

# 自定义鼠标上传路由
@app.route('/api/upload-cursor', methods=['POST'])
@login_required
def upload_cursor():
    """上传自定义鼠标光标文件"""
    if 'cursor' not in request.files:
        return jsonify({'success': False, 'message': '没有文件'}), 400
    
    file = request.files['cursor']
    if file.filename == '':
        return jsonify({'success': False, 'message': '没有选择文件'}), 400
    
    # 检查文件类型（支持 .cur, .png, .svg, .ico）
    allowed_cursor_types = {'cur', 'png', 'svg', 'ico'}
    ext = file.filename.rsplit('.', 1)[1].lower()
    
    if ext not in allowed_cursor_types:
        return jsonify({'success': False, 'message': '只支持 .cur, .png, .svg, .ico 格式的光标文件'}), 400
    
    # 生成唯一文件名
    filename = f"cursor_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    file.save(filepath)
    cursor_url = f"/static/uploads/{filename}"
    
    # 更新数据配置
    data = load_data()
    if 'theme' not in data:
        data['theme'] = {}
    data['theme']['cursor_style'] = 'custom'
    data['theme']['custom_cursor_url'] = cursor_url
    save_data(data)
    
    return jsonify({
        'success': True,
        'message': '自定义光标上传成功',
        'cursor_url': cursor_url
    })

# 头像上传路由
@app.route('/api/upload-avatar', methods=['POST'])
@login_required
def upload_avatar():
    """上传或更换头像"""
    if 'avatar' not in request.files:
        return jsonify({'success': False, 'message': '没有文件'}), 400
    
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'success': False, 'message': '没有选择文件'}), 400
    
    # 检查文件类型（支持图片格式）
    allowed_avatar_types = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ext = file.filename.rsplit('.', 1)[1].lower()
    
    if ext not in allowed_avatar_types:
        return jsonify({'success': False, 'message': '只支持图片格式（PNG, JPG, GIF, WebP）'}), 400
    
    try:
        # 生成唯一文件名，使用固定前缀确保每次更新替换旧头像
        filename = f"avatar.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # 保存文件
        file.save(filepath)
        avatar_url = f"/static/uploads/{filename}"
        
        # 更新数据配置
        data = load_data()
        if 'profile' not in data:
            data['profile'] = {}
        data['profile']['avatar'] = avatar_url
        save_data(data)
        
        return jsonify({
            'success': True,
            'message': '头像上传成功',
            'avatar_url': avatar_url
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'上传失败: {str(e)}'}), 500

@app.route('/api/upload-background', methods=['POST'])
@login_required
def upload_background():
    """上传背景图片"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '没有文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': '没有选择文件'}), 400

    # 检查文件类型
    allowed_types = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ext = file.filename.rsplit('.', 1)[1].lower()

    if ext not in allowed_types:
        return jsonify({'success': False, 'message': '只支持图片格式（PNG, JPG, GIF, WebP）'}), 400

    try:
        # 生成唯一文件名
        filename = f"background_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # 保存文件
        file.save(filepath)
        background_url = f"/static/uploads/{filename}"

        return jsonify({
            'success': True,
            'message': '背景图片上传成功',
            'url': background_url
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'上传失败: {str(e)}'}), 500

# 布局设置路由
@app.route('/api/layout', methods=['GET'])
def get_layout():
    data = load_data()
    return jsonify(data.get('layout', {}))

@app.route('/api/layout', methods=['POST'])
@login_required
def update_layout():
    try:
        data = load_data()
        layout_data = request.json
        
        if not layout_data:
            return jsonify({'success': False, 'message': '没有数据'}), 400
        
        # 确保layout字段存在
        if 'layout' not in data:
            data['layout'] = {}
        
        # 更新布局数据
        data['layout'].update(layout_data)
        
        save_data(data)
        return jsonify({'success': True, 'message': '布局已更新'})
    except Exception as e:
        print(f'更新布局错误: {str(e)}')
        return jsonify({'success': False, 'message': f'更新失败: {str(e)}'}), 500

# 后台界面主题设置路由
@app.route('/api/admin-theme', methods=['GET'])
def get_admin_theme():
    """获取后台界面主题配置"""
    data = load_data()
    admin_theme = data.get('admin_theme', {
        'primary_color': '#6366f1',
        'sidebar_bg': '#1f2937',
        'sidebar_text': '#ffffff',
        'content_bg': '#f9fafb',
        'card_bg': '#ffffff',
        'background_type': 'gradient',
        'background_color': '#1f2937',
        'background_color_end': '#374151'
    })
    return jsonify(admin_theme)

@app.route('/api/admin-theme', methods=['POST'])
@login_required
def update_admin_theme():
    """更新后台界面主题配置"""
    try:
        data = load_data()
        theme_data = request.json
        
        if not theme_data:
            return jsonify({'success': False, 'message': '没有数据'}), 400
        
        # 确保admin_theme字段存在
        if 'admin_theme' not in data:
            data['admin_theme'] = {}
        
        # 更新主题数据
        data['admin_theme'].update(theme_data)
        
        save_data(data)
        return jsonify({'success': True, 'message': '后台主题已更新'})
    except Exception as e:
        print(f'更新后台主题错误: {str(e)}')
        return jsonify({'success': False, 'message': f'更新失败: {str(e)}'}), 500

# 模块管理路由
@app.route('/api/modules', methods=['GET'])
def get_modules():
    """获取所有模块配置"""
    data = load_data()
    modules = data.get('modules', {})
    return jsonify(modules)

@app.route('/api/modules', methods=['POST'])
@login_required
def add_module():
    """添加自定义模块"""
    data = load_data()
    module_data = request.json
    
    # 确保modules字段存在
    if 'modules' not in data:
        data['modules'] = {}
    
    # 生成模块ID
    module_id = module_data.get('id') or f"custom_{uuid.uuid4().hex[:8]}"
    
    # 保存模块配置
    data['modules'][module_id] = {
        'id': module_id,
        'title': module_data.get('title', '新模块'),
        'content': module_data.get('content', ''),
        'type': module_data.get('type', 'custom'),
        'link': module_data.get('link', ''),
        'visible': module_data.get('visible', True),
        'order': module_data.get('order', 0),
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # 更新模块顺序
    if 'layout' not in data:
        data['layout'] = {}
    if 'module_order' not in data['layout']:
        data['layout']['module_order'] = []
    
    if module_id not in data['layout']['module_order']:
        data['layout']['module_order'].append(module_id)
    
    save_data(data)
    return jsonify({'success': True, 'message': '模块已添加', 'module': data['modules'][module_id]})

@app.route('/api/modules/<module_id>', methods=['PUT'])
@login_required
def update_module(module_id):
    """更新模块配置"""
    data = load_data()
    
    if 'modules' not in data or module_id not in data['modules']:
        return jsonify({'success': False, 'message': '模块未找到'}), 404
    
    module_data = request.json
    data['modules'][module_id].update(module_data)
    data['modules'][module_id]['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    save_data(data)
    return jsonify({'success': True, 'message': '模块已更新', 'module': data['modules'][module_id]})

@app.route('/api/modules/<module_id>', methods=['DELETE'])
@login_required
def delete_module(module_id):
    """删除模块"""
    data = load_data()

    # 检查是否是自定义模块
    is_custom_module = 'modules' in data and module_id in data['modules']

    if is_custom_module:
        # 从模块列表中删除自定义模块
        del data['modules'][module_id]
    elif module_id in ['hero', 'skills', 'projects', 'files']:
        # 内置模块，只从显示顺序中移除
        pass
    else:
        return jsonify({'success': False, 'message': '模块未找到'}), 404

    # 从模块顺序中删除
    if 'layout' in data and 'module_order' in data['layout']:
        data['layout']['module_order'] = [mid for mid in data['layout']['module_order'] if mid != module_id]

    save_data(data)
    return jsonify({'success': True, 'message': '模块已删除'})

@app.route('/api/modules/order', methods=['POST'])
@login_required
def update_module_order():
    """更新模块显示顺序"""
    data = load_data()
    order_data = request.json.get('order', [])
    
    if 'layout' not in data:
        data['layout'] = {}
    
    data['layout']['module_order'] = order_data
    
    save_data(data)
    return jsonify({'success': True, 'message': '模块顺序已更新'})

# 静态文件路由 - 提供data.json访问
@app.route('/data.json')
def serve_data_json():
    data = load_data()
    # 不返回密码
    if 'admin_password' in data:
        del data['admin_password']
    return jsonify(data)

# 启动时初始化
init_data()

@app.route('/api/files/status', methods=['GET'])
def check_files_status():
    """检查文件状态，返回哪些文件丢失"""
    files = load_files()
    missing_files = []
    
    for file_info in files:
        filepath = os.path.join(app.config['FILES_FOLDER'], file_info['filename'])
        if not os.path.exists(filepath):
            missing_files.append({
                'id': file_info['id'],
                'name': file_info['original_name'],
                'filename': file_info['filename']
            })
    
    return jsonify({
        'total': len(files),
        'missing': len(missing_files),
        'missing_files': missing_files
    })

if __name__ == '__main__':
    # Railway使用环境变量PORT
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)