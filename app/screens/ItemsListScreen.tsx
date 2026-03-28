import { useState, useEffect, useCallback } from "react"
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  TextStyle,
  ViewStyle,
  Alert,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { useAppTheme } from "@/theme/context"
import { getAllItems, searchItems, deleteItem } from "@/services/items"

export interface InventoryItem {
  id: string
  name: string
  tags: string[]
  properties: { key: string; value: string; unit?: string }[]
  location?: string
  createdAt: number
}

export function ItemsListScreen({ navigation }: any) {
  const { themed } = useAppTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      let loadedItems: InventoryItem[]
      if (searchQuery) {
        loadedItems = await searchItems(searchQuery)
      } else {
        loadedItems = await getAllItems()
      }
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

  const allTags = Array.from(new Set(items.flatMap((item) => item.tags)))

  const filteredItems = items.filter((item) => {
    const matchesTag = selectedTag ? item.tags.includes(selectedTag) : true
    return matchesTag
  })

  const handleDelete = (item: InventoryItem) => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteItem(item.id)
            loadItems()
          },
        },
      ]
    )
  }

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity
      style={themed($itemCard)}
      onPress={() => navigation.navigate("ItemDetail", { itemId: item.id })}
      onLongPress={() => handleDelete(item)}
    >
      <Text style={themed($itemName)}>{item.name}</Text>
      <View style={themed($tagsRow)}>
        {item.tags.map((tag) => (
          <View key={tag} style={themed($tagBadge)}>
            <Text style={themed($tagText)}>{tag}</Text>
          </View>
        ))}
      </View>
      {item.location && <Text style={themed($location)}>📍 {item.location}</Text>}
    </TouchableOpacity>
  )

  return (
    <View style={[themed($container), styles.container]}>
      <View style={themed($header)}>
        <Text style={themed($title)}>Inventory</Text>
        <TextInput
          style={themed($searchInput)}
          placeholder="Search items..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadItems}
        />
      </View>

      <View style={themed($filterRow)}>
        <TouchableOpacity
          style={[themed($filterChip), selectedTag === null && themed($filterChipActive)]}
          onPress={() => setSelectedTag(null)}
        >
          <Text style={[themed($filterChipText), selectedTag === null && themed($filterChipTextActive)]}>
            All
          </Text>
        </TouchableOpacity>
        {allTags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[themed($filterChip), selectedTag === tag && themed($filterChipActive)]}
            onPress={() => setSelectedTag(tag)}
          >
            <Text style={[themed($filterChipText), selectedTag === tag && themed($filterChipTextActive)]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={themed($emptyTextContainer)}>
          <Text style={themed($emptyText)}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={themed($listContent)}
          ListEmptyComponent={
            <Text style={themed($emptyText)}>
              {searchQuery ? "No items match your search" : "No items yet - tap + to add one"}
            </Text>
          }
        />
      )}
    </View>
  )
}

const $container: ViewStyle = {
  flex: 1,
  backgroundColor: "background",
}

const $header: ViewStyle = {
  padding: 16,
  paddingTop: 48,
}

const $title: TextStyle = {
  fontSize: 28,
  fontWeight: "bold",
  marginBottom: 12,
}

const $searchInput: TextStyle = {
  padding: 12,
  borderRadius: 8,
  fontSize: 16,
}

const $filterRow: ViewStyle = {
  flexDirection: "row",
  paddingHorizontal: 16,
  paddingBottom: 12,
  flexWrap: "wrap",
  gap: 8,
}

const $filterChip: ViewStyle = {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  backgroundColor: "gray4",
}

const $filterChipActive: ViewStyle = {
  backgroundColor: "primary",
}

const $filterChipText: TextStyle = {
  fontSize: 14,
}

const $filterChipTextActive: TextStyle = {
  color: "white",
  fontWeight: "600",
}

const $listContent: ViewStyle = {
  padding: 16,
}

const $itemCard: ViewStyle = {
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
  backgroundColor: "card",
}

const $itemName: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  marginBottom: 8,
}

const $tagsRow: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 8,
}

const $tagBadge: ViewStyle = {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  backgroundColor: "primary",
}

const $tagText: TextStyle = {
  fontSize: 12,
  color: "white",
}

const $location: TextStyle = {
  fontSize: 14,
  opacity: 0.7,
}

const $emptyTextContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}

const $emptyText: TextStyle = {
  textAlign: "center",
  marginTop: 40,
  fontSize: 16,
  opacity: 0.5,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})