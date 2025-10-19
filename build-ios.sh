#!/bin/bash

# iOS Build Script for Cash Drawer App

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Cash Drawer - iOS Build Script${NC}"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "config.xml" ]; then
    echo -e "${RED}Error: config.xml not found. Please run this script from project root.${NC}"
    exit 1
fi

# Check if on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: iOS build requires macOS${NC}"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}Error: Xcode not found. Please install Xcode from App Store.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Xcode version: $(xcodebuild -version | head -1)${NC}"

# Check if iOS platform is installed
if [ ! -d "platforms/ios" ]; then
    echo -e "${YELLOW}iOS platform not found. Installing...${NC}"
    cordova platform add ios
fi

# Build
echo -e "${GREEN}Building iOS app...${NC}"

# Note: This builds for a generic iOS device. To test in simulator or device:
# - Open Xcode: open platforms/ios/CashDrawerApp.xcworkspace
# - Select your target device from Xcode
# - Click Run in Xcode
echo -e "${YELLOW}Building for device (not simulator due to Xcode 26 compatibility)...${NC}"

cordova build ios --device

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful!${NC}"
    echo ""
    echo "Build artifacts:"
    echo "  platforms/ios/build/device/"
    echo ""
    echo -e "${YELLOW}Note: Xcode 26 has simulator targeting issues with Cordova CLI.${NC}"
    echo ""
    echo "To run/test the app:"
    echo ""
    echo "1. Open in Xcode:"
    echo "   open platforms/ios/CashDrawerApp.xcworkspace"
    echo ""
    echo "2. In Xcode:"
    echo "   - Select your target (simulator or physical device)"
    echo "   - Click the Run button (▶)"
    echo ""
    echo "3. Or run on connected device via CLI:"
    echo "   cordova run ios --device"
else
    echo -e "${RED}✗ Build failed!${NC}"
    echo ""
    echo "Try opening in Xcode instead:"
    echo "  open platforms/ios/CashDrawerApp.xcworkspace"
    exit 1
fi
