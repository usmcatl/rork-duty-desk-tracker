# Equipment Manager App

## Environment Setup

This application requires environment variables to be set up correctly for the backend API connection.

### Development Setup

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```

2. For development with Rork tunnel, the default configuration should work:
   ```
   EXPO_PUBLIC_RORK_API_BASE_URL=https://c719klaq6of7ag0uymb5h.rork.app
   ```

3. Start the development server:
   ```
   npm start
   ```

### Production Setup

For building an APK or deploying to app stores:

1. Deploy your backend to a production server
2. Update `.env` with your production backend URL:
   ```
   EXPO_PUBLIC_RORK_API_BASE_URL=https://your-production-backend.com
   ```

3. Build your app using EAS Build or expo build commands

## Building an APK

To build an APK for Android:

1. Make sure your environment variables are configured correctly in `.env`
2. Use EAS Build to create your APK:
   ```
   eas build -p android --profile preview
   ```

3. Or use the traditional Expo build command:
   ```
   expo build:android
   ```

## Features

- Equipment management
- Member management
- Package tracking
- CSV import for members
- Shift management