import { FC, useState, useRef, useCallback } from "react"
import { FlatList, TextInput, TextStyle, View, ViewStyle, TouchableOpacity, Alert } from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import { Icon, PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useSettings } from "@/context/SettingsContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"
import type { ThemedStyle } from "@/theme/types"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import { getAllItems, deleteItem, searchItems } from "@/services/items"

interface ItemsListScreenProps extends AppStackScreenProps<"ItemsList"> {}

interface ItemData {
  id: string
  name: string
  description?: string
  location?: string
  tags: string[]
  properties: { key: string; value: string; unit?: string }[]
  createdAt: number
}

export const ItemsListScreen: FC<ItemsListScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { colors } = theme
  const { handedness } = useSettings()
  const [items, setItems] = useState<ItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchActive, setIsSearchActive] = useState(false)
  const searchInputRef = useRef<TextInput>(null)

  const $containerInsets = useSafeAreaInsetsStyle(["bottom"])

  const isLeftHanded = handedness === "left"

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      const loadedItems = searchQuery ? await searchItems(searchQuery) : await getAllItems()
      setItems(loadedItems)
    } catch (error) {
      console.error("Failed to load items:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useFocusEffect(
    useCallback(() => {
      loadItems()
    }, [loadItems])
  )

  const handleItemPress = (itemId: string) => {
    navigation.navigate("ItemEditor", { itemId })
  }

  const handleDeleteItem = (item: ItemData) => {
    Alert.alert("Delete Item", `Are you sure you want to delete "${item.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteItem(item.id)
          loadItems()
        },
      },
    ])
  }

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
    Alert.alert("Add New Item", "Choose how to add", [
      { text: "Camera", onPress: () => navigation.navigate("NewItemCameraScan") },
      { text: "Gallery", onPress: () => navigation.navigate("GalleryPicker", { mode: "single" }) },
      { text: "Manual Entry", onPress: () => navigation.navigate("ItemEditor", {}) },
      { text: "Cancel", style: "cancel" },
    ])
  }

  const handleSettings = () => {
    navigation.navigate("Settings")
  }

  const renderItem = ({ item }: { item: ItemData }) => (
    <TouchableOpacity
      style={themed($itemCard)}
      onPress={() => handleItemPress(item.id)}
      onLongPress={() => handleDeleteItem(item)}
    >
      <Text preset="heading">{item.name}</Text>
      {item.description && (
        <Text size="sm" style={themed($itemDesc)}>
          {item.description}
        </Text>
      )}
      {item.location && <Text size="sm">📍 {item.location}</Text>}
    </TouchableOpacity>
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
        onSubmitEditing={() => console.log("Search:", searchQuery)}
        returnKeyType="search"
              onBlur={() => {
                setSearchQuery("")
                setIsSearchActive(false)
              }}
        autoFocus
      />
    </View>
  )

  const renderLeftIcons = () => {
    if (isLeftHanded) {
      return (
        <View style={themed($navSideInner)}>
          <TouchableOpacity
            style={themed($addButton)}
            onPress={handleAddNew}
          >
            <PressableIcon icon="plus" color={theme.colors.textInverse} size={28} />
          </TouchableOpacity>
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
        <TouchableOpacity
          style={themed($addButton)}
          onPress={handleAddNew}
        >
          <PressableIcon icon="plus" color={theme.colors.textInverse} size={28} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={themed($rootContainer)}>
      <View style={themed($contentArea)}>
        <View style={themed($header)}>
          <Text preset="heading">My Items</Text>
          {isSearchActive && (
            <TextInput
              ref={searchInputRef}
              style={themed($headerSearchInput)}
              placeholder="Search..."
              placeholderTextColor={colors.text}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => console.log("Search:", searchQuery)}
              returnKeyType="search"
              autoFocus
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

      {/* Bottom Navigation Bar - vertical sidebar based on handedness */}
      <View style={[
        themed($bottomNav),
        isLeftHanded ? { left: 0, right: undefined } : { right: 0, left: undefined }
      ]}>
        {renderLeftIcons()}
        {renderRightIcons()}
      </View>
    </View>
  )
}

const $rootContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $contentArea: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingBottom: 80, // space for absolute positioned bottom nav
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
  backgroundColor: colors.card,
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
  backgroundColor: colors.card,
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
  backgroundColor: colors.card,
  borderRadius: 8,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  color: colors.text,
  fontSize: 16,
})

const $bottomNav: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  right: 0,
  bottom: 100, // Start 100px above soft buttons
  width: 64,
  height: 200, // Fixed height for menu area
  flexDirection: "column",
  justifyContent: "flex-end", // Start from bottom for thumb reach
  alignItems: "center",
  paddingVertical: spacing.lg,
  gap: spacing.md,
  backgroundColor: colors.background,
  zIndex: 999,
})

const $navSideInner: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "column",
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

const $addButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.sm,
  width: 44,
  height: 44,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.tint,
  borderRadius: 22,
  borderWidth: 2,
  borderColor: colors.border,
  zIndex: 1000,
})

const $navIconAdd: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.sm,
})