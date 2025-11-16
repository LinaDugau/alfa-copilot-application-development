import 'dotenv/config';

export default {
  expo: {
    name: "Альфа-бизнес помощник",
    slug: "Alfa-biz-assistant",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "alfa-biz-assistant",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.xx.bizassistant",
      usesIcloudStorage: true
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.xx.bizassistant",
      permissions: [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET"
      ]
    },

    web: {
      favicon: "./assets/images/favicon.png"
    },

    plugins: [
      [
        "expo-router",
        {
          origin: "https://example.com/"
        }
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-document-picker",
        {
          iCloudContainerEnvironment: "Production"
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#DC2626"
        }
      ]
    ],

    experiments: {
      typedRoutes: true
    },

    updates: {
      enabled: false
    },

    extra: {
      LLM_API_URL: process.env.LLM_API_URL,
      LLM_MODEL: process.env.LLM_MODEL,
    }
  }
};
