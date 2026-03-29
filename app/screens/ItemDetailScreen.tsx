import { useState, useEffect } from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextStyle, ViewStyle, Alert } from "react-native"
import { useAppTheme } from "@/theme/context"
import { getItem, deleteItem } from "@/services/items"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

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

const $container: ViewStyle = {
  flex: 1,
  backgroundColor: "background",
}

const $header: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 16,
  paddingTop: 48,
}

const $backButton: ViewStyle = {
  padding: 8,
}

const $backText: TextStyle = {
  fontSize: 16,
  color: "primary",
}

const $headerActions: ViewStyle = {
  flexDirection: "row",
  gap: 16,
}

const $editButton: ViewStyle = {
  padding: 8,
}

const $editText: TextStyle = {
  fontSize: 16,
  color: "primary",
  fontWeight: "600",
}

const $deleteButton: ViewStyle = {
  padding: 8,
}

const $deleteText: TextStyle = {
  fontSize: 16,
  color: "error",
}

const $content: ViewStyle = {
  padding: 16,
}

const $itemName: TextStyle = {
  fontSize: 28,
  fontWeight: "bold",
  marginBottom: 16,
}

const $locationRow: ViewStyle = {
  flexDirection: "row",
  marginBottom: 24,
}

const $locationLabel: TextStyle = {
  fontSize: 16,
  marginRight: 8,
}

const $locationValue: TextStyle = {
  fontSize: 16,
  opacity: 0.8,
}

const $section: ViewStyle = {
  marginBottom: 24,
}

const $sectionTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  marginBottom: 12,
}

const $tagsContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
}

const $tagBadge: ViewStyle = {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
  backgroundColor: "primary",
}

const $tagText: TextStyle = {
  fontSize: 14,
  color: "white",
}

const $propertyRow: ViewStyle = {
  flexDirection: "row",
  paddingVertical: 8,
  borderBottomWidth: 1,
  borderBottomColor: "border",
}

const $propertyKey: TextStyle = {
  fontSize: 16,
  fontWeight: "500",
  width: 100,
}

const $propertyValue: TextStyle = {
  fontSize: 16,
  flex: 1,
}

const $propertyUnit: TextStyle = {
  opacity: 0.6,
  fontSize: 14,
}

const $noProperties: TextStyle = {
  fontSize: 16,
  opacity: 0.5,
  fontStyle: "italic",
}

const $createdDate: TextStyle = {
  fontSize: 16,
  opacity: 0.7,
}

const $loadingText: TextStyle = {
  fontSize: 16,
  textAlign: "center",
  marginTop: 40,
  opacity: 0.5,
}

const $errorText: TextStyle = {
  fontSize: 16,
  textAlign: "center",
  marginTop: 40,
  opacity: 0.5,
  color: "error",
}

const $description: TextStyle = {
  fontSize: 16,
  lineHeight: 24,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})