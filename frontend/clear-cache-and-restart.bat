@echo off
echo ============================================
echo Clearing Next.js Cache and Restarting
echo ============================================
echo.

echo Step 1: Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Removing .next cache folder...
if exist .next (
    rmdir /s /q .next
    echo ✓ Cache cleared
) else (
    echo ✓ No cache to clear
)

echo.
echo Step 3: Starting dev server...
echo.
npm run dev

pause
