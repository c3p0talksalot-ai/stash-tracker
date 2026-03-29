import { FC, useState } from "react"
import { FlatList, TextStyle, View, ViewStyle } from "react-native"

import { PressableIcon, type IconTypes } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useSettings } from "@/context/SettingsContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"
import type { ThemedStyle } from "@/theme/types"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"

interface ItemsListScreenProps extends AppStackScreenProps<"ItemsList"> {}

// TODO: Replace with actual data from WatermelonDB
interface ItemData {
  id: string
  name: string
  description?: string
  thumbnailUri?: string
}

const MOCK_ITEMS: ItemData[] = [
  { id: "1", name: "Sample Item 1", description: "Description here" },
  { id: "2", name: "Sample Item 2", description: "Description here" },
]

export const ItemsListScreen: FC<ItemsListScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { handedness } = useSettings()
  const [items] = useState<ItemData[]>(MOCK_ITEMS)

  const $containerInsets = useSafeAreaInsetsStyle(["bottom"])

  const isLeftHanded = handedness === "left"

  const handleSearch = () => {
    // TODO: Implement search - ticket #34
    console.log("Search pressed")
  }

  const handleAddNew = () => {
    // TODO: Implement camera flow - ticket #35
    console.log("Add new pressed")
  }

  const handleSettings = () => {
    navigation.navigate("Settings")
  }

  const renderItem = ({ item }: { item: ItemData }) => (
    <View style={themed($itemCard)}>
      <Text preset="heading">{item.name}</Text>
      {item.description && (
        <Text size="sm" style={themed($itemDesc)}>
          {item.description}
        </Text>
      )}
    </View>
  )

  // Left-handed: [+] [settings] | [search]
  // Right-handed: [search] | [settings] [+]
  const leftIcons = isLeftHanded ? (
    <>
      <PressableIcon
        icon="more"
        color={theme.colors.tint}
        size={32}
        containerStyle={themed($navIconAdd)}
        onPress={handleAddNew}
      />
      <PressableIcon
        icon="settings"
        color={theme.colors.text}
        size={28}
        containerStyle={themed($navIcon)}
        onPress={handleSettings}
      />
    </>
  ) : (
    <PressableIcon
      icon="view"
      color={theme.colors.text}
      size={28}
      containerStyle={themed($navIcon)}
      onPress={handleSearch}
    />
  )

  const rightIcons = isLeftHanded ? (
    <PressableIcon
      icon="view"
      color={theme.colors.text}
      size={28}
      containerStyle={themed($navIcon)}
      onPress={handleSearch}
    />
  ) : (
    <>
      <PressableIcon
        icon="settings"
        color={theme.colors.text}
        size={28}
        containerStyle={themed($navIcon)}
        onPress={handleSettings}
      />
      <PressableIcon
        icon="more"
        color={theme.colors.tint}
        size={32}
        containerStyle={themed($navIconAdd)}
        onPress={handleAddNew}
      />
    </>
  )

  return (
    <Screen preset="fixed" contentContainerStyle={[$styles.flex1, $containerInsets]}>
      {/* Header */}
      <View style={themed($header)}>
        <Text preset="heading">My Items</Text>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={themed($listContent)}
        ListEmptyComponent={
          <View style={themed($emptyState)}>
            <Text preset="subheading">No items yet</Text>
            <Text size="sm" style={themed($itemDesc)}>
              Tap + to add your first item
            </Text>
          </View>
        }
      />

      {/* Bottom Navigation Bar - flipped by handedness */}
      <View style={themed($bottomNav)}>
        <View style={themed($navSide)}>{leftIcons}</View>
        <View style={themed($navSide)}>{rightIcons}</View>
      </View>
    </Screen>
  )
}

const $header: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $itemCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  padding: spacing.md,
  borderRadius: 8,
  marginBottom: spacing.sm,
})

const $itemDesc: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  opacity: 0.7,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xl,
  alignItems: "center",
})

const $bottomNav: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.xl,
  paddingBottom: spacing.lg,
  backgroundColor: colors.background,
})

const $navSide: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
})

const $navIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.sm,
})

const $navIconAdd: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.sm,
})