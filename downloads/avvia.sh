#!/bin/bash
# Voxel World - avvio su Linux (se non parte: chmod +x avvia.sh)
cd "$(dirname "$0")"
if ! command -v java >/dev/null 2>&1; then
  echo "Voxel World ha bisogno di Java 17 o più recente: https://adoptium.net"
  exit 1
fi
exec java -jar VoxelWorld-0.1.0-beta.jar
