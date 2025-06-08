# Equipment Manager

A React Native app for managing equipment checkout and inventory.

## Building for Android Studio

This app is built with Expo and can be compiled for Android Studio. To create an APK:

### Option 1: Using EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

### Option 2: Using Android Studio (Local Build)
```bash
# Generate native Android project
npx expo prebuild --platform android

# Open in Android Studio
# Navigate to the generated android/ folder and open in Android Studio
# Build APK from Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### Option 3: Local APK Build
```bash
# Generate native project
npx expo prebuild --platform android

# Build APK locally (requires Android SDK)
cd android
./gradlew assembleRelease
```

## Development

```bash
# Start development server
npm start

# Start for web
npm run start-web
```

## Features

- Equipment inventory management
- Member management
- Package tracking
- QR code scanning
- Checkout/return history
- CSV import/export