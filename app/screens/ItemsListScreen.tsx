import { FC, useState, useRef } from "react"
import { FlatList, TextInput, TextStyle, View, ViewStyle } from "react-native"

import { PressableIcon } from "@/components/Icon"
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
  const { colors } = theme
  const { handedness } = useSettings()
  const [items] = useState<ItemData[]>(MOCK_ITEMS)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchActive, setIsSearchActive] = useState(false)
  const searchInputRef = useRef<TextInput>(null)

  const $containerInsets = useSafeAreaInsetsStyle(["bottom"])

  const isLeftHanded = handedness === "left"

  const handleSearchToggle = () => {
    if (!isSearchActive) {
      setIsSearchActive(true)
      setTimeout(() => searchInputRef.current?.focus(), 100)
    } else {
      setSearchQuery("")
      setIsSearchActive(false)
    }
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

  const renderSearchInput = () => (
    <View style={themed($searchInputContainer)}>
      <TextInput
        ref={searchInputRef}
        style={themed($searchInput)}
        placeholder="Search..."
        placeholderTextColor={theme.colors.text}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onBlur={() => !searchQuery && setIsSearchActive(false)}
        autoFocus
      />
    </View>
  )

  const renderLeftIcons = () => {
    if (isLeftHanded) {
      return (
        <View style={themed($navSideInner)}>
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
        </View>
      )
    }
    if (isSearchActive) {
      return renderSearchInput()
    }
    return (
      <PressableIcon
        icon="view"
        color={theme.colors.text}
        size={28}
        containerStyle={themed($navIcon)}
        onPress={handleSearchToggle}
      />
    )
  }

  const renderRightIcons = () => {
    if (isLeftHanded) {
      if (isSearchActive) {
        return renderSearchInput()
      }
      return (
        <PressableIcon
          icon="view"
          color={theme.colors.text}
          size={28}
          containerStyle={themed($navIcon)}
          onPress={handleSearchToggle}
        />
      )
    }
    return (
      <View style={themed($navSideInner)}>
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
      </View>
    )
  }

  return (
    <Screen preset="fixed" contentContainerStyle={[$styles.flex1, $containerInsets]}>
      {/* Scrollable content area */}
      <View style={themed($contentArea)}>
        <View style={themed($header)}>
          <Text preset="heading">My Items</Text>
          {isSearchActive ? (
            <TextInput
              ref={searchInputRef}
              style={themed($headerSearchInput)}
              placeholder="Search..."
              placeholderTextColor={colors.text}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onBlur={() => !searchQuery && setIsSearchActive(false)}
              autoFocus
            />
          ) : (
            <PressableIcon
              icon="view"
              color={theme.colors.text}
              size={24}
              containerStyle={themed($searchIcon)}
              onPress={handleSearchToggle}
            />
          )}
        </View>

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
      </View>

      {/* Bottom Navigation Bar */}
      <View style={themed($bottomNav)}>
        {renderLeftIcons()}
        {renderRightIcons()}
      </View>
    </Screen>
  )
}

const $contentArea: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingBottom: spacing.md,
})

const $header: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $headerSearchInput: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  flex: 1,
  marginLeft: spacing.md,
  backgroundColor: colors.palette.neutral200,
  borderRadius: 8,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  color: colors.text,
  fontSize: 16,
})

const $searchIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
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

const $searchInputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  maxWidth: 180,
})

const $searchInput: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderRadius: 8,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  color: colors.text,
  fontSize: 16,
})

const $bottomNav: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  // position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.lg,
  backgroundColor: "red", // DEBUG - bright red to see if it renders
})

const $navSideInner: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
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