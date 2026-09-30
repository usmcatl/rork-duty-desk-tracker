import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAutoSync } from "@/store/syncStore";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  useAutoSync();
  // The app draws edge-to-edge: headers get the status bar inset from the
  // system, and detail screens are padded above Android's navigation bar so
  // bottom buttons stay reachable. The tab bar handles that inset itself.
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerTintColor: Colors.light.primary,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: Colors.light.background,
            paddingBottom: insets.bottom,
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.light.background },
          }}
        />
        <Stack.Screen
          name="equipment/[id]"
          options={{
            title: "Equipment Details",
            headerBackTitle: "Home",
          }}
        />
        <Stack.Screen
          name="checkout/[id]"
          options={{
            title: "Check Out Equipment",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="return/[id]"
          options={{
            title: "Return Equipment",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="add-equipment"
          options={{
            title: "Add New Equipment",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="edit-equipment/[id]"
          options={{
            title: "Edit Equipment",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="package/[id]"
          options={{
            title: "Package Details",
          }}
        />
        <Stack.Screen
          name="add-package"
          options={{
            title: "Add New Package",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="member/[id]"
          options={{
            title: "Member Details",
          }}
        />
        <Stack.Screen
          name="add-member"
          options={{
            title: "Add New Member",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="edit-member/[id]"
          options={{
            title: "Edit Member",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="tablet-changeover"
          options={{
            title: "Tablet Changeover",
            presentation: "modal",
            headerLeft: () => null,
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
}
