@echo off
cd /d "%~dp0"
where java >nul 2>nul
if errorlevel 1 (
  echo Voxel World ha bisogno di Java 17 o piu recente: https://adoptium.net
  pause
  exit /b 1
)
java -jar VoxelWorld-0.1.0-beta.jar
