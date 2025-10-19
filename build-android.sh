#!/bin/bash

# Android Build Script for Cash Drawer App

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Cash Drawer - Android Build Script${NC}"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "config.xml" ]; then
    echo -e "${RED}Error: config.xml not found. Please run this script from project root.${NC}"
    exit 1
fi

# Source SDKMAN and add Gradle to PATH
if [ -f "$HOME/.sdkman/bin/sdkman-init.sh" ]; then
    source "$HOME/.sdkman/bin/sdkman-init.sh"
fi

export PATH="$HOME/.sdkman/candidates/gradle/8.10.2/bin:$PATH"
export PATH="$HOME/.sdkman/candidates/gradle/current/bin:$PATH"

# Check if Gradle is available
if ! command -v gradle &> /dev/null; then
    echo -e "${YELLOW}Warning: Gradle not found.${NC}"
    echo "Install with: sdk install gradle 8.10.2"
    echo "Or ensure Gradle is in PATH"
    exit 1
fi

echo -e "${GREEN}✓ Gradle version: $(gradle --version | grep "Gradle" | head -1)${NC}"
echo -e "${GREEN}✓ Java version: $(java -version 2>&1 | head -1)${NC}"

# Check if Android platform is installed
if [ ! -d "platforms/android" ]; then
    echo -e "${YELLOW}Android platform not found. Installing...${NC}"
    cordova platform add android@12
fi

# Build
echo -e "${GREEN}Building Android app...${NC}"
cordova build android

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful!${NC}"
    echo "APK location: platforms/android/app/build/outputs/apk/debug/app-debug.apk"

    # Check if emulator is running
    ADB_DEVICES=$(~/Library/Android/sdk/platform-tools/adb devices | grep -v "List" | grep "device$" | wc -l)

    if [ $ADB_DEVICES -gt 0 ]; then
        echo -e "${GREEN}Found $ADB_DEVICES connected device(s)${NC}"
        read -p "Install APK to device? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cordova run android --device
        fi
    else
        echo -e "${YELLOW}No Android devices/emulators found.${NC}"
        echo "Start emulator with: ~/Library/Android/sdk/emulator/emulator -avd Pixel_9_Pro_XL"
    fi
else
    echo -e "${RED}✗ Build failed!${NC}"
    echo "Try running: npm run clean:cache"
    exit 1
fi
