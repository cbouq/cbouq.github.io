#!/bin/bash
# Voxel World - avvio su macOS (doppio clic; se non parte: chmod +x avvia.command)
cd "$(dirname "$0")"
if ! command -v java >/dev/null 2>&1; then
  osascript -e 'display dialog "Voxel World ha bisogno di Java 17 o più recente.\n\nInstallalo da https://adoptium.net e poi riapri questo file." buttons {"OK"} with icon caution'
  exit 1
fi
exec java -XstartOnFirstThread -jar VoxelWorld-0.1.0-beta.jar
