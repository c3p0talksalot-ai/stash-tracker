import { FC } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useSettings, type Handedness } from "@/context/SettingsContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"
import type { ThemedStyle } from "@/theme/types"
import { useHeader } from "@/utils/useHeader"

interface SettingsScreenProps extends AppStackScreenProps<"Settings"> {}

export const SettingsScreen: FC<SettingsScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { handedness, setHandedness } = useSettings()

  useHeader(
    {
      leftIcon: "back",
      onLeftPress: () => navigation.goBack(),
    },
    [navigation],
  )

  return (
    <Screen preset="scroll" contentContainerStyle={$styles.flex1}>
      <View style={themed($section)}>
        <Text preset="heading" style={themed($sectionTitle)}>Handedness</Text>
        <Text preset="subheading" style={themed($sectionDesc)}>
          Choose which hand you use to hold your phone
        </Text>
        
        <View style={themed($handednessRow)}>
          <PressableIcon
            icon="caretLeft"
            color={handedness === "left" ? theme.colors.tint : theme.colors.text}
            size={28}
            containerStyle={themed($handednessOption)}
            onPress={() => setHandedness("left")}
          />
          <Text 
            preset="heading" 
            style={themed($handednessLabel)}
          >
            {handedness === "left" ? "← Left" : "Right →"}
          </Text>
          <PressableIcon
            icon="caretRight"
            color={handedness === "right" ? theme.colors.tint : theme.colors.text}
            size={28}
            containerStyle={themed($handednessOption)}
            onPress={() => setHandedness("right")}
          />
        </View>

        <Text size="sm" style={themed($previewLabel)}>
          Preview (current): {handedness}-handed layout
        </Text>
      </View>
    </Screen>
  )
}

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $sectionDesc: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginBottom: spacing.lg,
  color: colors.text,
  opacity: 0.7,
})

const $handednessRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xl,
})

const $handednessOption: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $handednessLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  minWidth: 100,
  textAlign: "center",
})

const $previewLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  textAlign: "center",
  marginTop: spacing.lg,
  color: colors.text,
  opacity: 0.5,
})