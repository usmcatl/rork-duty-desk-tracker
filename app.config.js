module.exports = {
  name: "Equipment Manager",
  slug: "equipment-manager",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.equipmentmanager"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.yourcompany.equipmentmanager"
  },
  web: {
    favicon: "./assets/images/favicon.png"
  },
  extra: {
    eas: {
      projectId: "your-project-id"
    }
  },
  plugins: [
    "expo-router"
  ],
  experiments: {
    tsconfigPaths: true
  }
};