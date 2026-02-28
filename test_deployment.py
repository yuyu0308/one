#!/usr/bin/env python3
"""
测试页面加载 - 检查API端点是否正常工作
"""
import requests
import json

base_url = "https://one-production-5a76.up.railway.app"

# 测试主页
print("测试主页...")
try:
    response = requests.get(base_url, timeout=10)
    print(f"主页状态码: {response.status_code}")
    print(f"响应长度: {len(response.text)} 字符")
    print(f"响应前200字符: {response.text[:200]}")
except Exception as e:
    print(f"主页访问失败: {e}")

print("\n" + "="*50 + "\n")

# 测试data.json
print("测试data.json API...")
try:
    response = requests.get(f"{base_url}/data.json", timeout=10)
    print(f"data.json状态码: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"data.json加载成功！")
        print(f"包含键: {list(data.keys())}")
    else:
        print(f"data.json响应: {response.text[:200]}")
except Exception as e:
    print(f"data.json访问失败: {e}")

print("\n" + "="*50 + "\n")

# 测试静态资源
print("测试静态资源...")
try:
    css_response = requests.get(f"{base_url}/static/css/style.css", timeout=10)
    print(f"CSS状态码: {css_response.status_code}")
    
    js_response = requests.get(f"{base_url}/static/js/main.js", timeout=10)
    print(f"JS状态码: {js_response.status_code}")
except Exception as e:
    print(f"静态资源访问失败: {e}")