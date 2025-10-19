<div align="center">
  <img src="https://flenco.in/wp-content/uploads/2023/09/cropped-flenco-2023.png" alt="Flenco" width="200"/>

  # DrawerPulse

  [![npm version](https://img.shields.io/npm/v/drawer-pulse.svg)](https://www.npmjs.com/package/drawer-pulse)
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
  [![Downloads](https://img.shields.io/npm/dm/drawer-pulse.svg)](https://www.npmjs.com/package/drawer-pulse)
  [![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Donate-orange.svg)](https://www.buymeacoffee.com/atishpaul)

  **Smart Cash Drawer Control for Modern POS Systems**

  Professional Cordova app for opening cash drawers on iOS and Android devices
  Supports **Network (WiFi/Ethernet)** and **USB (Android only)** connections using ESC/POS protocol

  [Installation](#installation) • [Features](#features) • [Usage](#usage) • [API](#api-reference) • [Support](#support)

  <sub>Organized by [Flenco.in](https://flenco.in)</sub>
</div>

---

## Features

- **Multi-Protocol Support**: Standard ESC/POS, Epson, Star Micronics with auto-detection
- **Network Connection**: WiFi/Ethernet (iOS & Android)
- **USB Connection**: USB OTG (Android only)
- **Cross-Platform**: Optimized for both iOS and Android
- **Modern UI**: Clean Ubuntu-style grey theme
- **Comprehensive Error Handling**: Detailed troubleshooting messages
- **Production Ready**: Tested and battle-hardened

## Installation

### NPM Package

```bash
npm install drawer-pulse
```

### From Source

```bash
# Clone the repository
git clone https://github.com/flenco-in/drawer-pulse.git
cd drawer-pulse

# Install dependencies
npm install

# Setup platforms
npm run setup:android  # Add Android platform
npm run setup:ios      # Add iOS platform (macOS only)
```

## Prerequisites

- **Node.js** 16+ and npm
- **Cordova CLI**: `npm install -g cordova`
- **iOS**: Xcode 14+ (macOS only)
- **Android**: Android Studio with SDK 34+
- **Gradle**: Install via SDKMAN - `sdk install gradle 8.10.2`

## Quick Start

### Build & Run

```bash
# Android
npm run build:android    # Build APK
npm run run:android      # Build and run on device/emulator
npm run start:android    # Start emulator and run app

# iOS (macOS only)
npm run build:ios        # Build iOS app (device only)
npm run run:ios          # Build and run on device/simulator

# Important: iOS builds with Xcode 26 require using Xcode GUI
# See IOS_BUILD_NOTES.md for details

# Clean build cache (if build issues)
npm run clean
```

## Usage

### Network Connection (WiFi/Ethernet) - Recommended

1. Find printer IP address (check printer settings or router)
2. Open app → Select **"Network"**
3. Enter IP: `192.168.1.100` and Port: `9100`
4. Click **"Connect to Printer"**
5. Click **"OPEN DRAWER"** (auto-detects protocol)

### USB Connection (Android Only)

1. Connect printer via USB OTG cable
2. Open app → Select **"USB"**
3. Click **"Connect USB Device"**
4. Grant permissions → Select device
5. Click **"OPEN DRAWER"**

> **Note**: USB is disabled on iOS as it's not supported by the platform.

## Architecture

```
drawer-pulse/
├── www/
│   ├── index.html              # Main UI
│   ├── js/
│   │   ├── index.js            # App logic
│   │   ├── cash-drawer-api.js  # Unified API
│   │   └── modules/
│   │       ├── escpos-commands.js    # ESC/POS protocol
│   │       ├── usb-handler.js        # USB communication
│   │       └── network-handler.js    # Network communication
├── platforms/                  # iOS & Android
├── config.xml                  # Cordova configuration
└── package.json
```

## Supported Protocols

| Protocol | Description | Compatible Printers |
|----------|-------------|-------------------|
| **Standard ESC/POS** | Universal | Most ESC/POS printers |
| **Epson** | Epson TM series | TM-T88, TM-T20, etc. |
| **Star Micronics** | Star TSP series | TSP650, TSP700, etc. |

## API Reference

### CashDrawerAPI

```javascript
const api = new CashDrawerAPI();

// Connect via network
await api.connectNetwork('192.168.1.100', 9100);

// Connect via USB (Android only)
await api.connectUSB();

// Open drawer with auto-detection
await api.openDrawer('standard');  // 'epson', 'star', 'alt', 'all'

// Get status
const status = api.getStatus();

// Disconnect
await api.disconnect();
```

### ESCPOSCommands

```javascript
const escpos = new ESCPOSCommands();

// Generate commands
const cmd = escpos.openCashDrawer(0, 25, 250);
const epsonCmd = escpos.openCashDrawerEpson();

// Get all commands
const allCommands = escpos.getAllCommands();
```

## Troubleshooting

### iOS Issues

**Build fails with Xcode 26?**
- See [IOS_BUILD_NOTES.md](IOS_BUILD_NOTES.md) for detailed solutions
- Use Xcode GUI: `open platforms/ios/CashDrawerApp.xcworkspace`
- Or reinstall platform: `cordova platform add ios@7.1.1`

**App feels slow?**
- Clean build in Xcode (Cmd+Shift+K)
- Restart iPhone
- Check iOS version (requires 13.0+)

**USB not working?**
- USB is not supported on iOS (platform limitation)
- Use Network connection instead

### Android Issues

**Build fails with Gradle error?**
```bash
npm run clean
npm run setup:android
npm run build:android
```

**USB device not detected?**
- Check USB OTG cable
- Grant USB permissions when prompted
- Enable Developer mode on Android

**Network connection fails?**
- Verify printer IP address is correct
- Check device WiFi connection
- Try port 9100 (default for ESC/POS printers)

### Drawer Not Opening

- Click "OPEN DRAWER" button (auto-detects all protocols)
- Check drawer cable is connected to printer (RJ11/RJ12 port)
- Verify drawer has power
- Ensure printer is powered ON

## Configuration

### iOS Performance Settings (config.xml)

```xml
<platform name="ios">
    <preference name="WKWebViewOnly" value="true" />
    <preference name="SplashScreenDelay" value="500" />
    <preference name="DisallowOverscroll" value="true" />
    <preference name="deployment-target" value="13.0" />
</platform>
```

### Android Settings

```xml
<platform name="android">
    <preference name="android-minSdkVersion" value="24" />
    <preference name="android-targetSdkVersion" value="34" />
    <preference name="android-compileSdkVersion" value="34" />
    <preference name="AndroidXEnabled" value="true" />
</platform>
```

## Security

- Network connections use local HTTP/TCP
- No data stored or transmitted to external servers
- USB permissions requested at runtime
- All communication is local (device ↔ printer)

## Dependencies

```json
{
  "cordova-plugin-network-information": "^3.0.0",
  "cordova-plugin-android-permissions": "^1.1.5"
}
```

## NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run clean` | Clean build cache and temp files |
| `npm run setup:android` | Setup Android platform (v13) |
| `npm run setup:ios` | Setup iOS platform |
| `npm run build:android` | Build Android APK |
| `npm run build:ios` | Build iOS app |
| `npm run run:android` | Build and run on Android device/emulator |
| `npm run run:ios` | Build and run on iOS device/simulator |
| `npm run emulator:android` | Start Android emulator |
| `npm run start:android` | Start emulator and run app |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage |

## Supported Printers

- Epson TM series (TM-T88, TM-T20, etc.)
- Star TSP series (TSP650, TSP700, etc.)
- Bixolon SRP series
- Citizen CT series
- Custom VKP series
- Any ESC/POS compatible printer

## ESC/POS Commands

### Standard Command
```
Hex: 1B 70 00 19 FA
Description: ESC p 0 25 250
```

### Epson Command
```
Hex: 1B 70 00 32 FA
Description: ESC p 0 50 250
```

### Star Command
```
Hex: 07
Description: BEL (Bell)
```

## Platform Support

- **iOS**: 13.0+ (iPhone, iPad)
- **Android**: 7.0+ (API 24+)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Apache-2.0 - See [LICENSE](LICENSE) file for details

## Support

For issues:
1. Check troubleshooting section above
2. Verify device and printer compatibility
3. Test network/USB connection independently
4. Review console logs in browser dev tools
5. Open an issue on [GitHub](https://github.com/flenco-in/drawer-pulse/issues)

## Support the Project

If this project helped you, consider buying me a coffee!

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Donate-orange.svg?style=for-the-badge&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/atishpaul)

---

<div align="center">
  <sub>Built by <a href="https://github.com/atishpaul">Atish Paul</a></sub>
  <br>
  <sub>Organized by <a href="https://flenco.in">Flenco.in</a></sub>
  <br><br>
  <img src="https://flenco.in/wp-content/uploads/2023/09/cropped-flenco-2023.png" alt="Flenco" width="100"/>
  <br>
  <strong>Built with Apache Cordova for retail and POS systems</strong>
</div>
