@echo off
echo ================================
echo  Starting SchemeSathi Dashboard
echo ================================
echo.
echo Opening dashboard in browser...
echo.
cd /d "e:\MyProject\SchemeSathi\User Dashboard"
start http://localhost:8000
python -m http.server 8000
