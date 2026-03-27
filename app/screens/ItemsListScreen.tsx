import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  TextStyle,
  ViewStyle,
} from "react-native"
import { useAppTheme } from "@/theme/context"

export interface InventoryItem {
  id: string
  name: string
  tags: string[]
  properties: { key: string; value: string; unit?: string }[]
  location?: string
  createdAt: string
}

const mockItems: InventoryItem[] = [
  {
    id: "1",
    name: "Power Drill",
    tags: ["hardware", "tools"],
    properties: [{ key: "brand", value: "DeWalt" }, { key: "voltage", value: "20", unit: "V" }],
    location: "Garage",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Hose Fitting Set",
    tags: ["plumbing", "outdoor"],
    properties: [{ key: "pieces", value: "12" }],
    location: "Garden Shed",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "LED Light Strips",
    tags: ["electronics", "lighting"],
    properties: [{ key: "length", value: "5", unit: "m" }, { key: "color", value: "RGB" }],
    location: "Closet",
    createdAt: "2024-03-10",
  },
]

export function ItemsListScreen() {
  const { themed } = useAppTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = Array.from(new Set(mockItems.flatMap((item) => item.tags)))

  const filteredItems = mockItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = selectedTag ? item.tags.includes(selectedTag) : true
    return matchesSearch && matchesTag
  })

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity style={themed($itemCard)}>
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

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={themed($listContent)}
        ListEmptyComponent={<Text style={themed($emptyText)}>No items found</Text>}
      />
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