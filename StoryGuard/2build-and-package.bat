@echo off
echo StoryGuard - Building and Creating Distribution Package
echo =====================================================
echo.

echo Step 1: Building the latest version of the application...
echo --------------------------------------
call npm run build

:: Check if the build was successful
if not exist "dist\win-unpacked\StoryGuard.exe" (
    echo Build failed! StoryGuard.exe not found.
    pause
    exit /b 1
)

echo Build successful!
echo.

echo Step 2: Creating distribution folder...
echo --------------------------------------
if exist "StoryGuard-Distribution" rmdir /s /q "StoryGuard-Distribution"
mkdir "StoryGuard-Distribution"
mkdir "StoryGuard-Distribution\StoryGuard"

:: Copy the executable and resources
echo Step 3: Copying executable and resources...
echo -----------------------------------------
xcopy "dist\win-unpacked" "StoryGuard-Distribution\StoryGuard\" /E /I /Y >nul

:: Copy additional folders
echo Step 4: Copying additional folders...
echo -----------------------------------
mkdir "StoryGuard-Distribution\StoryGuard\readme"
mkdir "StoryGuard-Distribution\StoryGuard\documents"
mkdir "StoryGuard-Distribution\StoryGuard\database"
mkdir "StoryGuard-Distribution\StoryGuard\backup"
mkdir "StoryGuard-Distribution\StoryGuard\images"

xcopy "readme" "StoryGuard-Distribution\StoryGuard\readme\" /E /I /Y >nul
xcopy "documents" "StoryGuard-Distribution\StoryGuard\documents\" /E /I /Y >nul
xcopy "database" "StoryGuard-Distribution\StoryGuard\database\" /E /I /Y >nul
xcopy "backup" "StoryGuard-Distribution\StoryGuard\backup\" /E /I /Y >nul
xcopy "images" "StoryGuard-Distribution\StoryGuard\images\" /E /I /Y >nul

:: Clean up duplicate folders
echo Step 5: Cleaning up duplicate folders...
echo --------------------------------------

:: Remove duplicate folders from resources
if exist "StoryGuard-Distribution\StoryGuard\resources\readme" (
    echo - Removing duplicate readme folder
    rmdir /s /q "StoryGuard-Distribution\StoryGuard\resources\readme"
)

if exist "StoryGuard-Distribution\StoryGuard\resources\images" (
    echo - Removing duplicate images folder
    rmdir /s /q "StoryGuard-Distribution\StoryGuard\resources\images"
)

if exist "StoryGuard-Distribution\StoryGuard\resources\database" (
    echo - Removing duplicate database folder
    rmdir /s /q "StoryGuard-Distribution\StoryGuard\resources\database"
)

if exist "StoryGuard-Distribution\StoryGuard\resources\documents" (
    echo - Removing duplicate documents folder
    rmdir /s /q "StoryGuard-Distribution\StoryGuard\resources\documents"
)

if exist "StoryGuard-Distribution\StoryGuard\resources\backup" (
    echo - Removing duplicate backup folder
    rmdir /s /q "StoryGuard-Distribution\StoryGuard\resources\backup"
)

:: Create a README file
echo Step 6: Creating README file...
echo -----------------------------
echo StoryGuard > "StoryGuard-Distribution\README.txt"
echo ========== >> "StoryGuard-Distribution\README.txt"
echo. >> "StoryGuard-Distribution\README.txt"
echo Installation Instructions: >> "StoryGuard-Distribution\README.txt"
echo 1. Extract the StoryGuard folder to any location on your computer >> "StoryGuard-Distribution\README.txt"
echo 2. Run StoryGuard.exe to start the application >> "StoryGuard-Distribution\README.txt"
echo. >> "StoryGuard-Distribution\README.txt"
echo No installation required! This is a standalone application. >> "StoryGuard-Distribution\README.txt"

:: Create a zip file of just the StoryGuard folder
echo.
echo Step 7: Creating zip file...
echo --------------------------

:: Check if PowerShell is available
powershell -Command "exit" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    :: Use PowerShell to create the zip file
    echo Creating StoryGuard.zip using PowerShell...
    
    :: Delete existing zip file if it exists
    if exist "StoryGuard-Distribution\StoryGuard.zip" del "StoryGuard-Distribution\StoryGuard.zip"
    
    :: Create the zip file inside the StoryGuard-Distribution folder
    powershell -Command "Compress-Archive -Path 'StoryGuard-Distribution\StoryGuard' -DestinationPath 'StoryGuard-Distribution\StoryGuard.zip'" >nul 2>&1
    
    if exist "StoryGuard-Distribution\StoryGuard.zip" (
        echo Zip file created successfully!
    ) else (
        echo Failed to create zip file using PowerShell.
    )
) else (
    echo PowerShell is not available. Zip file could not be created.
    echo Please manually zip the StoryGuard folder.
)

echo.
echo ===============================================
echo Distribution package created successfully!
echo ===============================================
echo.
echo Your StoryGuard-Distribution folder now contains:
echo - The StoryGuard folder with the executable and all files
echo - README.txt with installation instructions
echo - StoryGuard.zip file for easy distribution
echo.
echo To distribute:
echo - Share the StoryGuard.zip file with your users
echo.
echo Users can simply extract the zip and run StoryGuard.exe
echo.

:: Open the folder in Explorer
echo Opening the StoryGuard-Distribution folder...
start explorer "StoryGuard-Distribution"

pause 