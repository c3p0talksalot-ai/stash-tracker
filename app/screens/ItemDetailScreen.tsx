import { useState, useEffect } from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextStyle, ViewStyle, Alert } from "react-native"
import { useAppTheme } from "@/theme/context"
import { getItem, deleteItem } from "@/services/items"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import type { ThemedStyle } from "@/theme/types"

type Props = AppStackScreenProps<"ItemDetail">

interface ItemData {
  id: string
  name: string
  description?: string
  location?: string
  tags: string[]
  properties: { key: string; value: string; unit?: string }[]
  createdAt: number
}

export function ItemDetailScreen({ navigation, route }: Props) {
  const { itemId } = route.params || {}
  const { themed } = useAppTheme()
  const [item, setItem] = useState<ItemData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadItem()
  }, [itemId])

  const loadItem = async () => {
    try {
      const data = await getItem(itemId)
      setItem(data)
    } catch (e) {
      console.error("Failed to load item:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    navigation.navigate("ItemEditor", { itemId })
  }

  const handleDelete = () => {
    Alert.alert("Delete Item", `Are you sure you want to delete "${item?.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteItem(itemId)
          navigation.goBack()
        },
      },
    ])
  }

  const onBack = () => navigation.goBack()

  if (loading) {
    return (
      <View style={[themed($container), styles.container]}>
        <Text style={themed($loadingText)}>Loading...</Text>
      </View>
    )
  }

  if (!item) {
    return (
      <View style={[themed($container), styles.container]}>
        <TouchableOpacity onPress={onBack} style={themed($backButton)}>
          <Text style={themed($backText)}>← Back</Text>
        </TouchableOpacity>
        <Text style={themed($errorText)}>Item not found</Text>
      </View>
    )
  }

  return (
    <ScrollView style={[themed($container), styles.container]}>
      <View style={themed($header)}>
        <TouchableOpacity onPress={onBack} style={themed($backButton)}>
          <Text style={themed($backText)}>← Back</Text>
        </TouchableOpacity>
        <View style={themed($headerActions)}>
          <TouchableOpacity onPress={handleEdit} style={themed($editButton)}>
            <Text style={themed($editText)}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={themed($deleteButton)}>
            <Text style={themed($deleteText)}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={themed($content)}>
        <Text style={themed($itemName)}>{item.name}</Text>

        {item.description && (
          <View style={themed($section)}>
            <Text style={themed($sectionTitle)}>Description</Text>
            <Text style={themed($description)}>{item.description}</Text>
          </View>
        )}

        {item.location && (
          <View style={themed($locationRow)}>
            <Text style={themed($locationLabel)}>📍 Location:</Text>
            <Text style={themed($locationValue)}>{item.location}</Text>
          </View>
        )}

        <View style={themed($section)}>
          <Text style={themed($sectionTitle)}>Tags</Text>
          {item.tags.length > 0 ? (
            <View style={themed($tagsContainer)}>
              {item.tags.map((tag) => (
                <View key={tag} style={themed($tagBadge)}>
                  <Text style={themed($tagText)}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={themed($noProperties)}>No tags</Text>
          )}
        </View>

        <View style={themed($section)}>
          <Text style={themed($sectionTitle)}>Properties</Text>
          {item.properties.length > 0 ? (
            item.properties.map((prop, index) => (
              <View key={index} style={themed($propertyRow)}>
                <Text style={themed($propertyKey)}>{prop.key}:</Text>
                <Text style={themed($propertyValue)}>
                  {prop.value} {prop.unit && <Text style={themed($propertyUnit)}>({prop.unit})</Text>}
                </Text>
              </View>
            ))
          ) : (
            <Text style={themed($noProperties)}>No properties set</Text>
          )}
        </View>

        <View style={themed($section)}>
          <Text style={themed($sectionTitle)}>Created</Text>
          <Text style={themed($createdDate)}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $header: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 16,
  paddingTop: 48,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $backButton: ThemedStyle<ViewStyle> = () => ({
  padding: 8,
})

const $backText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.tint,
})

const $headerActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
})

const $editButton: ThemedStyle<ViewStyle> = () => ({
  padding: 8,
})

const $editText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.tint,
  fontWeight: "600",
})

const $deleteButton: ThemedStyle<ViewStyle> = () => ({
  padding: 8,
})

const $deleteText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.error,
})

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $itemName: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 28,
  fontWeight: "bold",
  marginBottom: spacing.md,
  color: colors.text,
})

const $locationRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  marginBottom: spacing.lg,
})

const $locationLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  marginRight: 8,
  color: colors.text,
})

const $locationValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  opacity: 0.8,
  color: colors.text,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  fontWeight: "600",
  marginBottom: spacing.sm,
  color: colors.text,
})

const $tagsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
})

const $tagBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
  backgroundColor: colors.tint,
})

const $tagText: ThemedStyle<TextStyle> = () => ({
  fontSize: 14,
  color: "white",
})

const $propertyRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $propertyKey: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "500",
  width: 100,
  color: colors.text,
})

const $propertyValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  flex: 1,
  color: colors.text,
})

const $propertyUnit: ThemedStyle<TextStyle> = ({ colors }) => ({
  opacity: 0.6,
  fontSize: 14,
  color: colors.text,
})

const $noProperties: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  opacity: 0.5,
  fontStyle: "italic",
  color: colors.text,
})

const $createdDate: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  opacity: 0.7,
  color: colors.text,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  textAlign: "center",
  marginTop: 40,
  opacity: 0.5,
  color: colors.text,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  textAlign: "center",
  marginTop: 40,
  opacity: 0.5,
  color: colors.error,
})

const $description: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  lineHeight: 24,
  color: colors.text,
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})