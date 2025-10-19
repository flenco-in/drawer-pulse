# iOS Build Notes

## Current Status

The iOS platform requires reinstallation and has known compatibility issues with Xcode 26 (beta).

## Issue Summary

When building for iOS, you may encounter:

1. **Simulator Target Error**:
   ```
   xcodebuild: error: Unable to find a device matching the provided destination specifier:
   { platform:iOS Simulator, OS:latest, name:iPhone 16 Plus }
   ```
   - **Cause**: Cordova iOS 7.1.1 has issues with Xcode 26's simulator targeting
   - **Impact**: Cannot build directly for simulator via Cordova CLI

2. **CordovaLib Not Found Error**:
   ```
   error: 'Cordova/CDVAppDelegate.h' file not found
   ```
   - **Cause**: iOS platform needs to be properly initialized
   - **Impact**: Build fails during compilation

## Solutions

### Option 1: Reinstall iOS Platform (Recommended)

```bash
# From project root
cordova platform add ios@7.1.1

# Build for device
cordova build ios --device
```

### Option 2: Use Xcode Directly (Best for Development)

```bash
# Add iOS platform if not present
cordova platform add ios@7.1.1

# Open project in Xcode
open platforms/ios/CashDrawerApp.xcworkspace

# In Xcode:
# 1. Select your target device (simulator or physical iPhone)
# 2. Click the Run button (▶)
# 3. Xcode will build and deploy automatically
```

### Option 3: Build for Physical Device Only

```bash
# Use the build script (builds for device, not simulator)
npm run build:ios

# Or directly with Cordova
cordova build ios --device
```

## Xcode 26 Compatibility

Xcode 26 is currently in beta and has known issues with Cordova:

- Simulator targeting is unreliable via CLI
- Deployment target warnings (CordovaLib uses iOS 11.0, but Xcode 26 requires 12.0+)
- Empty Podfile warnings (this is normal for Cordova projects without native dependencies)

**Recommendation**: Use Xcode GUI for builds and testing until Xcode 26 is stable and Cordova iOS is updated.

## Workaround for Development

The most reliable workflow for iOS development is:

```bash
# 1. Ensure iOS platform is installed
cordova platform add ios@7.1.1

# 2. Make changes to www/ files
# Edit www/index.html, www/js/*, etc.

# 3. Prepare the iOS platform (copies www/ to platforms/ios/)
cordova prepare ios

# 4. Open in Xcode
open platforms/ios/CashDrawerApp.xcworkspace

# 5. Run from Xcode
# Select simulator/device and click Run
```

## Production Build

For App Store distribution:

```bash
# 1. Build for device
cordova build ios --device --release

# 2. Open in Xcode for signing and archiving
open platforms/ios/CashDrawerApp.xcworkspace

# 3. In Xcode:
#    - Product > Archive
#    - Follow Xcode's distribution wizard
#    - Upload to App Store Connect
```

## Quick Reference

| Command | Purpose | Works with Xcode 26? |
|---------|---------|---------------------|
| `cordova build ios` | Build for simulator | ❌ No (targeting issues) |
| `cordova build ios --device` | Build for device | ✅ Yes |
| `cordova prepare ios` | Copy www/ to iOS platform | ✅ Yes |
| Xcode GUI build | Build and run | ✅ Yes (recommended) |

## Next Steps

1. Reinstall iOS platform: `cordova platform add ios@7.1.1`
2. Use Xcode for builds until Xcode 26 stable release
3. Monitor Cordova iOS updates for Xcode 26 compatibility

## Related Files

- [build-ios.sh](build-ios.sh) - Build script (updated to build for device only)
- [README.md](README.md) - Main project documentation
- [config.xml](config.xml) - Cordova configuration
