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
ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'mp4', 'mp3', 'avi', 'mkv', 'xlsx', 'xls', 'ppt', 'pptx'}
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
            json.dump({'visits': 0, 'last_visit': None}, f, ensure_ascii=False, indent=2)
    
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
    save_stats(stats)
    
    data = load_data()
    return render_template('index.html', data=data)

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

@app.route('/api/profile', methods=['POST'])
@login_required
def update_profile():
    data = load_data()
    profile_data = request.json
    data['profile'].update(profile_data)
    save_data(data)
    return jsonify({'success': True, 'message': '个人信息已更新'})

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
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '没有文件'}), 400
    
    file = request.files['file']
    description = request.form.get('description', '')
    
    if file.filename == '':
        return jsonify({'success': False, 'message': '没有选择文件'}), 400
    
    if file and allowed_file_upload(file.filename):
        # 生成唯一文件名
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(app.config['FILES_FOLDER'], unique_filename)
        
        file.save(filepath)
        
        # 保存文件信息
        files = load_files()
        file_info = {
            'id': str(uuid.uuid4()),
            'original_name': file.filename,
            'filename': unique_filename,
            'description': description,
            'size': os.path.getsize(filepath),
            'upload_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'type': ext,
            'downloads': 0
        }
        files.append(file_info)
        save_files(files)
        
        return jsonify({
            'success': True,
            'message': '文件上传成功',
            'file': file_info
        })
    
    return jsonify({'success': False, 'message': '不支持的文件格式'}), 400

@app.route('/api/files/<file_id>', methods=['DELETE'])
@login_required
def delete_file(file_id):
    files = load_files()
    file_to_delete = None
    
    for file_info in files:
        if file_info['id'] == file_id:
            file_to_delete = file_info
            break
    
    if file_to_delete:
        # 删除物理文件
        filepath = os.path.join(app.config['FILES_FOLDER'], file_to_delete['filename'])
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # 从数据库中删除
        files = [f for f in files if f['id'] != file_id]
        save_files(files)
        
        return jsonify({'success': True, 'message': '文件已删除'})
    
    return jsonify({'success': False, 'message': '文件未找到'}), 404

@app.route('/files/<filename>')
def download_file(filename):
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
    data = load_data()
    theme_data = request.json
    data['theme'] = theme_data
    save_data(data)
    return jsonify({'success': True, 'message': '主题已更新'})

# 布局设置路由
@app.route('/api/layout', methods=['GET'])
def get_layout():
    data = load_data()
    return jsonify(data.get('layout', {}))

@app.route('/api/layout', methods=['POST'])
@login_required
def update_layout():
    data = load_data()
    layout_data = request.json
    data['layout'] = layout_data
    save_data(data)
    return jsonify({'success': True, 'message': '布局已更新'})

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
    
    if 'modules' not in data or module_id not in data['modules']:
        return jsonify({'success': False, 'message': '模块未找到'}), 404
    
    # 从模块列表中删除
    del data['modules'][module_id]
    
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

if __name__ == '__main__':
    # Railway使用环境变量PORT
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)