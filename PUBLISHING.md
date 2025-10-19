# Publishing Guide

This document explains how to publish the `drawer-pulse` package to npm.

## Prerequisites

1. **npm account**: Create one at https://www.npmjs.com/signup
2. **npm login**: Run `npm login` and enter your credentials
3. **Verify package name**: Ensure `drawer-pulse` is available on npm

## Pre-Publishing Checklist

Before publishing, ensure:

- [x] All tests pass: `npm test`
- [x] Android builds successfully: `npm run build:android`
- [x] iOS platform configured (optional)
- [x] README.md is complete and npm-ready
- [x] package.json has correct metadata
- [x] Version number is correct
- [x] LICENSE file is present
- [x] .npmignore is configured

## Publishing Steps

### 1. Verify Package Contents

```bash
# Dry run to see what will be published
npm pack --dry-run
```

Review the output to ensure only necessary files are included.

### 2. Test Package Installation Locally

```bash
# Create tarball
npm pack

# In a test directory
mkdir test-install && cd test-install
npm install ../cordova-cash-drawer-1.0.0.tgz

# Verify it works
node -e "const API = require('cordova-cash-drawer'); console.log('OK');"
```

### 3. Login to npm

```bash
npm login
# Enter your username, password, and email
```

### 4. Publish Package

```bash
# For first-time publishing
npm publish

# For scoped packages (if using @yourusername/cordova-cash-drawer)
npm publish --access public
```

### 5. Verify Publication

```bash
# Check on npm
npm view cordova-cash-drawer

# Or visit
# https://www.npmjs.com/package/cordova-cash-drawer
```

## Version Management

### Updating Versions

Follow semantic versioning (semver):

- **Patch** (1.0.0 → 1.0.1): Bug fixes
  ```bash
  npm version patch
  ```

- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
  ```bash
  npm version minor
  ```

- **Major** (1.0.0 → 2.0.0): Breaking changes
  ```bash
  npm version major
  ```

After bumping version:
```bash
npm publish
git push && git push --tags
```

## Publishing Checklist

Complete this before each publish:

```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Run tests
npm test

# 3. Build Android
npm run build:android

# 4. Update version
npm version patch  # or minor/major

# 5. Publish
npm publish

# 6. Push to GitHub
git push && git push --tags

# 7. Create GitHub release
# Go to: https://github.com/atishpaul/cash-drawer/releases/new
```

## Troubleshooting

### Package Name Already Taken

If `cordova-cash-drawer` is taken:
1. Use scoped package: `@atishpaul/cordova-cash-drawer`
2. Update `package.json`: `"name": "@atishpaul/cordova-cash-drawer"`
3. Publish with: `npm publish --access public`

### Authentication Errors

```bash
# Clear npm cache
npm cache clean --force

# Re-login
npm logout
npm login
```

### 402 Payment Required

This means the package name is reserved. Choose a different name.

### File Size Too Large

npm has a 100MB upload limit. Check:
```bash
npm pack
ls -lh cordova-cash-drawer-1.0.0.tgz
```

If too large, update `.npmignore` to exclude unnecessary files.

## Post-Publishing

1. **Update README badges**: npm version badge will now work
2. **Create GitHub Release**: Tag the version on GitHub
3. **Announce**: Share on social media, forums
4. **Monitor**: Watch for issues on GitHub

## Unpublishing (Use with Caution!)

```bash
# Unpublish specific version (within 72 hours)
npm unpublish cordova-cash-drawer@1.0.0

# Unpublish entire package (within 72 hours)
npm unpublish cordova-cash-drawer --force
```

**Warning**: Unpublishing is permanent and can break dependents!

## Maintenance

### Deprecating a Version

```bash
npm deprecate cordova-cash-drawer@1.0.0 "Version 1.0.0 has critical bugs. Please upgrade to 1.0.1+"
```

### Adding Maintainers

```bash
npm owner add <username> cordova-cash-drawer
```

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm CLI Documentation](https://docs.npmjs.com/cli/v9/commands/npm-publish)

---

**Ready to publish?**

```bash
npm login
npm test
npm run build:android
npm publish
```

Good luck! 🚀
