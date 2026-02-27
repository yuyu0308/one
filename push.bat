@echo off
cd /d C:\Users\lenovo\personal-website
echo 正在推送到GitHub...
echo.
echo 请输入你的GitHub Personal Access Token（不是密码）
echo 如果还没有Token，请访问: https://github.com/settings/tokens
echo.
git push -u origin main
echo.
echo 推送完成！
pause