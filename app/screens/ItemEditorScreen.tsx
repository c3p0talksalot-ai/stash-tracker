import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextStyle,
  ViewStyle,
  Modal,
  Pressable,
} from "react-native"
import { useAppTheme } from "@/theme/context"
import { getItem, createItem, updateItem, deleteItem } from "@/services/items"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import type { ThemedStyle } from "@/theme/types"

type Props = AppStackScreenProps<"ItemEditor">

export function ItemEditorScreen({ navigation, route }: Props) {
  const { itemId } = route.params || {}
  const { themed, theme } = useAppTheme()
  const isEditing = !!itemId

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [properties, setProperties] = useState<{ key: string; value: string; unit?: string }[]>([])
  const [newPropKey, setNewPropKey] = useState("")
  const [newPropValue, setNewPropValue] = useState("")
  const [newPropUnit, setNewPropUnit] = useState("")
  const [loading, setLoading] = useState(isEditing)
  const [menuVisible, setMenuVisible] = useState(false)

  useEffect(() => {
    if (itemId) {
      loadItem(itemId)
    }
  }, [itemId])

  const loadItem = async (id: string) => {
    try {
      const item = await getItem(id)
      if (item) {
        setName(item.name)
        setDescription(item.description || "")
        setLocation(item.location || "")
        setTags(item.tags)
        setProperties(item.properties)
      }
    } catch (e) {
      console.error("Failed to load item:", e)
    } finally {
      setLoading(false)
    }
  }

  const availableTags = ["hardware", "plumbing", "electronics", "tools", "lighting", "outdoor", "kitchen", "automotive"]

  const onCancel = () => navigation.goBack()

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setNewTag("")
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const addProperty = () => {
    if (newPropKey && newPropValue) {
      setProperties([...properties, { key: newPropKey, value: newPropValue, unit: newPropUnit || undefined }])
      setNewPropKey("")
      setNewPropValue("")
      setNewPropUnit("")
    }
  }

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an item name")
      return
    }

    try {
      if (isEditing && itemId) {
        await updateItem(itemId, {
          name: name.trim(),
          description: description.trim(),
          location: location.trim(),
          tags,
          properties,
        })
      } else {
        await createItem({
          name: name.trim(),
          description: description.trim(),
          location: location.trim(),
          tags,
          properties,
        })
      }
      navigation.goBack()
    } catch (e) {
      console.error("Failed to save item:", e)
      Alert.alert("Error", "Failed to save item")
    }
  }

  const handleDelete = () => {
    setMenuVisible(false)
    Alert.alert("Delete Item", `Are you sure you want to delete this item?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (itemId) {
            await deleteItem(itemId)
          }
          navigation.goBack()
        },
      },
    ])
  }

  const handleEdit = () => {
    setMenuVisible(false)
    // Already in edit mode, no action needed
  }

  const toggleMenu = () => {
    setMenuVisible(!menuVisible)
  }

  return (
    <ScrollView style={[themed($container), styles.container]}>
      <View style={themed($header)}>
        <TouchableOpacity onPress={onCancel} style={themed($iconButton)}>
          <Icon icon="back" size={24} />
        </TouchableOpacity>
        <Text style={themed($headerTitle)}>{isEditing ? "Edit Item" : "New Item"}</Text>
        {isEditing ? (
          <TouchableOpacity onPress={toggleMenu} style={themed($iconButton)}>
            <Icon icon="more" size={24} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSave} style={themed($iconButton)}>
            <Icon icon="check" size={24} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={themed($modalOverlay)} onPress={() => setMenuVisible(false)}>
          <View style={themed($menuContainer)}>
            <TouchableOpacity style={themed($menuItem)} onPress={onCancel}>
              <Icon icon="back" size={20} />
            </TouchableOpacity>
            <View style={themed($menuDivider)} />
            <TouchableOpacity style={themed($menuItem)} onPress={handleEdit}>
              <Icon icon="settings" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={themed($menuItem)} onPress={handleDelete}>
              <Icon icon="bell" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <View style={themed($content)}>
        <View style={themed($field)}>
          <Text style={themed($label)}>Name *</Text>
          <TextInput
            style={themed($input)}
            value={name}
            onChangeText={setName}
            placeholder="Enter item name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Location</Text>
          <TextInput
            style={themed($input)}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Garage, Closet"
            placeholderTextColor="#999"
          />
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Description</Text>
          <TextInput
            style={[themed($input), { minHeight: 80, textAlignVertical: "top" }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Tags</Text>
          <View style={themed($tagsContainer)}>
            {tags.map((tag) => (
              <TouchableOpacity key={tag} onPress={() => removeTag(tag)} style={themed($tagChip)}>
                <Text style={themed($tagChipText)}>{tag} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={themed($tagInputRow)}>
            <TextInput
              style={themed($tagInput)}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add tag"
              placeholderTextColor="#999"
              onSubmitEditing={() => addTag(newTag)}
            />
            <TouchableOpacity onPress={() => addTag(newTag)} style={themed($addButton)}>
              <Text style={themed($addButtonText)}>Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={themed($hint)}>Suggestions: {availableTags.slice(0, 4).join(", ")}</Text>
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Properties</Text>
          {properties.map((prop, index) => (
            <View key={index} style={themed($propertyRow)}>
              <Text style={themed($propertyText)}>
                {prop.key}: {prop.value} {prop.unit && `(${prop.unit})`}
              </Text>
              <TouchableOpacity onPress={() => removeProperty(index)}>
                <Text style={themed($removeText)}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={themed($propertyInputRow)}>
            <TextInput
              style={[themed($input), { flex: 1, marginRight: 8 }]}
              value={newPropKey}
              onChangeText={setNewPropKey}
              placeholder="Key (e.g., brand)"
              placeholderTextColor="#999"
            />
            <TextInput
              style={[themed($input), { flex: 1, marginRight: 8 }]}
              value={newPropValue}
              onChangeText={setNewPropValue}
              placeholder="Value"
              placeholderTextColor="#999"
            />
          </View>
          <View style={themed($propertyInputRow)}>
            <TextInput
              style={[themed($input), { flex: 1 }]}
              value={newPropUnit}
              onChangeText={setNewPropUnit}
              placeholder="Unit (optional)"
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={addProperty} style={themed($addButton)}>
              <Text style={themed($addButtonText)}>Add</Text>
            </TouchableOpacity>
          </View>
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

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.text,
})

const $cancelButton: ThemedStyle<ViewStyle> = () => ({
  padding: 8,
})

const $cancelText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.text,
})

const $saveButton: ThemedStyle<ViewStyle> = () => ({
  padding: 8,
})

const $saveText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.tint,
  fontWeight: "600",
})

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $field: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $label: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  marginBottom: 8,
  color: colors.text,
})

const $input: ThemedStyle<TextStyle> = ({ colors }) => ({
  padding: 12,
  borderRadius: 8,
  fontSize: 16,
  backgroundColor: colors.backgroundCard,
  borderWidth: 1,
  borderColor: colors.border,
  color: colors.text,
})

const $tagsContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 8,
}

const $tagChip: ViewStyle = {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  backgroundColor: "primary",
}

const $tagChipText: TextStyle = {
  fontSize: 14,
  color: "white",
}

const $tagInputRow: ViewStyle = {
  flexDirection: "row",
  gap: 8,
}

const $tagInput: TextStyle = {
  flex: 1,
  padding: 12,
  borderRadius: 8,
  fontSize: 16,
  backgroundColor: "card",
  borderWidth: 1,
  borderColor: "border",
}

const $hint: TextStyle = {
  fontSize: 12,
  opacity: 0.5,
  marginTop: 4,
}

const $addButton: ViewStyle = {
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 8,
  backgroundColor: "primary",
}

const $addButtonText: TextStyle = {
  fontSize: 14,
  color: "white",
  fontWeight: "600",
}

const $propertyRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 12,
  borderRadius: 8,
  backgroundColor: "card",
  marginBottom: 8,
}

const $propertyText: TextStyle = {
  fontSize: 16,
}

const $removeText: TextStyle = {
  fontSize: 16,
  color: "error",
}

const $propertyInputRow: ViewStyle = {
  flexDirection: "row",
  gap: 8,
  marginTop: 8,
}

const $iconButton: ThemedStyle<ViewStyle> = () => ({
  padding: 8,
})

const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
})

const $menuContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.backgroundCard,
  borderRadius: 12,
  paddingVertical: 8,
  paddingHorizontal: 16,
  minWidth: 150,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
})

const $menuItem: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
  paddingHorizontal: 8,
}

const $menuItemText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  marginLeft: 12,
  color: colors.text,
})

const $menuDivider: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 1,
  backgroundColor: colors.border,
  marginVertical: 4,
})

const $menuIcon: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $deleteIcon: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})