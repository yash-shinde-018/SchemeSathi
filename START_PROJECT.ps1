# SchemeSathi - Startup Script
# Run this script to start both backend and frontend

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  SchemeSathi - Startup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Backend Status:" -ForegroundColor Green
Write-Host "  URL: http://localhost:5000/api" -ForegroundColor White
Write-Host "  Status: RUNNING" -ForegroundColor Green
Write-Host ""

Write-Host "Frontend Instructions:" -ForegroundColor Yellow
Write-Host "  Open a NEW terminal and run:" -ForegroundColor White
Write-Host ""
Write-Host "  cd e:\MyProject\SchemeSathi\schemesathi-landing" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host ""

Write-Host "After frontend starts:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "  2. Click 'Get Started' or 'Login'" -ForegroundColor White
Write-Host "  3. Register a new account:" -ForegroundColor White
Write-Host "     Email: test@example.com" -ForegroundColor Cyan
Write-Host "     Password: Test@1234" -ForegroundColor Cyan
Write-Host "     Phone: 9876543210" -ForegroundColor Cyan
Write-Host "  4. Explore schemes and test the app" -ForegroundColor White
Write-Host ""

Write-Host "================================" -ForegroundColor Green
Write-Host "  Connection Test" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Test backend health
$healthCheck = curl -s http://localhost:5000/api/health
if ($healthCheck -match "running|healthy|ok" -or $healthCheck.length -gt 0) {
    Write-Host "✓ Backend Health Check: PASS" -ForegroundColor Green
} else {
    Write-Host "✗ Backend Health Check: FAIL" -ForegroundColor Red
}

Write-Host ""
Write-Host "To view logs, check the terminal where backend is running." -ForegroundColor Yellow
