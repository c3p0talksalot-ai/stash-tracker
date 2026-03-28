import { useState, useEffect } from "react"
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
} from "react-native"
import { useAppTheme } from "@/theme/context"
import { getItem, createItem, updateItem } from "@/services/items"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

type Props = AppStackScreenProps<"ItemEditor">

export function ItemEditorScreen({ navigation, route }: Props) {
  const { itemId } = route.params
  const { themed } = useAppTheme()
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

  useEffect(() => {
    if (itemId) {
      loadItem()
    }
  }, [itemId])

  const loadItem = async () => {
    try {
      const item = await getItem(itemId)
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

  return (
    <ScrollView style={[themed($container), styles.container]}>
      <View style={themed($header)}>
        <TouchableOpacity onPress={onCancel} style={themed($cancelButton)}>
          <Text style={themed($cancelText)}>Cancel</Text>
        </TouchableOpacity>
        <Text style={themed($headerTitle)}>{item ? "Edit Item" : "New Item"}</Text>
        <TouchableOpacity onPress={handleSave} style={themed($saveButton)}>
          <Text style={themed($saveText)}>Save</Text>
        </TouchableOpacity>
      </View>

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
  borderBottomWidth: 1,
  borderBottomColor: "border",
}

const $headerTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
}

const $cancelButton: ViewStyle = {
  padding: 8,
}

const $cancelText: TextStyle = {
  fontSize: 16,
  color: "text",
}

const $saveButton: ViewStyle = {
  padding: 8,
}

const $saveText: TextStyle = {
  fontSize: 16,
  color: "primary",
  fontWeight: "600",
}

const $content: ViewStyle = {
  padding: 16,
}

const $field: ViewStyle = {
  marginBottom: 24,
}

const $label: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  marginBottom: 8,
}

const $input: TextStyle = {
  padding: 12,
  borderRadius: 8,
  fontSize: 16,
  backgroundColor: "card",
  borderWidth: 1,
  borderColor: "border",
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})