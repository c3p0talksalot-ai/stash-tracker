import { FC, useMemo } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Icon, type IconTypes } from "@/components/Icon"
import { PressableIcon } from "@/components/Icon"
import { EpisodeProvider } from "@/context/EpisodeContext"
import { useSettings } from "@/context/SettingsContext"
import { translate } from "@/i18n/translate"
import { DemoCommunityScreen } from "@/screens/DemoCommunityScreen"
import { DemoDebugScreen } from "@/screens/DemoDebugScreen"
import { DemoPodcastListScreen } from "@/screens/DemoPodcastListScreen"
import { DemoShowroomScreen } from "@/screens/DemoShowroomScreen/DemoShowroomScreen"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import type { DemoTabParamList } from "./navigationTypes"

const Tab = createBottomTabNavigator<DemoTabParamList>()

/**
 * Bottom navigation bar with handedness support
 * Right-handed: [search] left, [settings] [+] right
 * Left-handed: mirrored
 */
const BottomNavBar: FC<{ navigation: any }> = ({ navigation }) => {
  const { handedness } = useSettings()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const isLeftHanded = handedness === "left"

  // Determine icon positions based on handedness
  const leftIcons: { icon: IconTypes; onPress: () => void }[] = useMemo(() => [
    { icon: "view", onPress: () => {} }, // search icon placeholder
  ], [])

  const rightIcons: { icon: IconTypes; onPress: () => void }[] = useMemo(() => [
    { icon: "settings", onPress: () => navigation.navigate("Settings") },
    { icon: "bell", onPress: () => {} }, // add/camera placeholder
  ], [navigation])

  return (
    <View style={themed($navBarContainer)}>
      <View style={themed($navBarSide)}>
        {leftIcons.map((item, index) => (
          <PressableIcon
            key={index}
            icon={item.icon}
            color={colors.text}
            size={28}
            containerStyle={themed($navIcon)}
            onPress={item.onPress}
          />
        ))}
      </View>

      <View style={themed($navBarSide)}>
        {rightIcons.map((item, index) => (
          <PressableIcon
            key={index}
            icon={item.icon}
            color={colors.text}
            size={28}
            containerStyle={themed($navIcon)}
            onPress={item.onPress}
          />
        ))}
      </View>
    </View>
  )
}

/**
 * This is the main navigator for the demo screens with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 * @returns {JSX.Element} The rendered `DemoNavigator`.
 */
export function DemoNavigator() {
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <EpisodeProvider>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: themed([$tabBar, { height: bottom + 70 }]),
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.text,
          tabBarLabelStyle: themed($tabBarLabel),
          tabBarItemStyle: themed($tabBarItem),
        }}
      >
        <Tab.Screen
          name="DemoShowroom"
          component={DemoShowroomScreen}
          options={{
            tabBarLabel: translate("demoNavigator:componentsTab"),
            tabBarIcon: ({ focused }) => (
              <Icon
                icon="components"
                color={focused ? colors.tint : colors.tintInactive}
                size={30}
              />
            ),
          }}
        />

        <Tab.Screen
          name="DemoCommunity"
          component={DemoCommunityScreen}
          options={{
            tabBarLabel: translate("demoNavigator:communityTab"),
            tabBarIcon: ({ focused }) => (
              <Icon
                icon="community"
                color={focused ? colors.tint : colors.tintInactive}
                size={30}
              />
            ),
          }}
        />

        <Tab.Screen
          name="DemoPodcastList"
          component={DemoPodcastListScreen}
          options={{
            tabBarAccessibilityLabel: translate("demoNavigator:podcastListTab"),
            tabBarLabel: translate("demoNavigator:podcastListTab"),
            tabBarIcon: ({ focused }) => (
              <Icon icon="podcast" color={focused ? colors.tint : colors.tintInactive} size={30} />
            ),
          }}
        />

        <Tab.Screen
          name="DemoDebug"
          component={DemoDebugScreen}
          options={{
            tabBarLabel: translate("demoNavigator:debugTab"),
            tabBarIcon: ({ focused }) => (
              <Icon icon="debug" color={focused ? colors.tint : colors.tintInactive} size={30} />
            ),
          }}
        />
      </Tab.Navigator>
    </EpisodeProvider>
  )
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderTopColor: colors.transparent,
})

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
})

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  color: colors.text,
})

// Bottom nav bar styles (for handedness-aware nav)
const $navBarContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-end",
  paddingHorizontal: spacing.xl,
  paddingBottom: spacing.lg,
  backgroundColor: "transparent",
})

const $navBarSide: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
})

const $navIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.sm,
})