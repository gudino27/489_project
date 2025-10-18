#!/bin/bash

echo "🧹 Cleaning React Native environment..."

# Kill all processes
echo "Stopping all React Native processes..."
pkill -f "react-native" 2>/dev/null || true
pkill -f "Metro" 2>/dev/null || true
pkill -f "node.*8081" 2>/dev/null || true

# Clear caches
echo "Clearing Metro cache..."
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true

# Clean iOS build
echo "Cleaning iOS build..."
cd ios
rm -rf build 2>/dev/null || true
cd ..

echo "✅ Environment cleaned!"
echo ""
echo "Now run these commands in separate terminals:"
echo ""
echo "Terminal 1:"
echo "  cd /Users/jaime/Documents/489_project/GCWadmin"
echo "  npx react-native start --reset-cache"
echo ""
echo "Terminal 2 (wait for Metro to start first):"
echo "  cd /Users/jaime/Documents/489_project/GCWadmin"
echo "  npx react-native run-ios"
