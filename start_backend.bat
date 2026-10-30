@echo off
cd /d e:\MyProject\SchemeSathi\backend
call venv\Scripts\activate.bat
set FLASK_APP=run.py
python -m flask run --port=5000
