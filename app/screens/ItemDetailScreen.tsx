import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextStyle, ViewStyle } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { InventoryItem } from "./ItemsListScreen"

interface ItemDetailScreenProps {
  item: InventoryItem
  onBack: () => void
  onEdit: () => void
}

export function ItemDetailScreen({ item, onBack, onEdit }: ItemDetailScreenProps) {
  const { themed } = useAppTheme()

  return (
    <ScrollView style={[themed($container), styles.container]}>
      <View style={themed($header)}>
        <TouchableOpacity onPress={onBack} style={themed($backButton)}>
          <Text style={themed($backText)}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onEdit} style={themed($editButton)}>
          <Text style={themed($editText)}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={themed($content)}>
        <Text style={themed($itemName)}>{item.name}</Text>

        {item.location && (
          <View style={themed($locationRow)}>
            <Text style={themed($locationLabel)}>📍 Location:</Text>
            <Text style={themed($locationValue)}>{item.location}</Text>
          </View>
        )}

        <View style={themed($section)}>
          <Text style={themed($sectionTitle)}>Tags</Text>
          <View style={themed($tagsContainer)}>
            {item.tags.map((tag) => (
              <View key={tag} style={themed($tagBadge)}>
                <Text style={themed($tagText)}>{tag}</Text>
              </View>
            ))}
          </View>
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

const $editButton: ViewStyle = {
  padding: 8,
}

const $editText: TextStyle = {
  fontSize: 16,
  color: "primary",
  fontWeight: "600",
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})