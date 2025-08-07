@echo off
echo StoryGuard - Building Application
echo ================================
echo.

echo Running electron-builder to create StoryGuard.exe...
echo --------------------------------------
call npm run build

if not exist "dist\win-unpacked\StoryGuard.exe" (
    echo Build failed! StoryGuard.exe not found.
    pause
    exit /b 1
)

echo.
echo ===============================================
echo Build completed successfully!
echo ===============================================
echo.
echo You can now run create-package-only.bat to create the distribution package.
echo.

pause 