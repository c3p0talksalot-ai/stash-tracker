import { useState, useEffect, useRef, useCallback } from "react"
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
import { useSettings } from "@/context/SettingsContext"
import { useFocusEffect } from "@react-navigation/native"

type Props = AppStackScreenProps<"ItemEditor">

export function ItemEditorScreen({ navigation, route }: Props) {
  const { itemId } = route.params || {}
  const { themed, theme } = useAppTheme()
  const { colors } = theme
  const { autosave } = useSettings()
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
  const [hasChanges, setHasChanges] = useState(false)
  const initialDataRef = useRef<{ name: string; description: string; location: string; tags: string[]; properties: { key: string; value: string; unit?: string }[] }>({ name: "", description: "", location: "", tags: [], properties: [] })

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
        // Store initial data for change detection
        initialDataRef.current = {
          name: item.name,
          description: item.description || "",
          location: item.location || "",
          tags: item.tags,
          properties: item.properties,
        }
      }
    } catch (e) {
      console.error("Failed to load item:", e)
    } finally {
      setLoading(false)
    }
  }

  // Track changes and autosave for editing existing items
  useEffect(() => {
    if (!isEditing) return undefined
    
    const currentData = { name, description, location, tags, properties }
    const initial = initialDataRef.current
    const changed = 
      currentData.name !== initial.name ||
      currentData.description !== initial.description ||
      currentData.location !== initial.location ||
      JSON.stringify(currentData.tags) !== JSON.stringify(initial.tags) ||
      JSON.stringify(currentData.properties) !== JSON.stringify(initial.properties)
    
    setHasChanges(changed)

    if (autosave && changed && itemId) {
      // Debounced autosave
      const timeoutId = setTimeout(() => {
        updateItem(itemId, {
          name: name.trim(),
          description: description.trim(),
          location: location.trim(),
          tags,
          properties,
        })
        initialDataRef.current = currentData
        setHasChanges(false)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
    return undefined
  }, [name, description, location, tags, properties, autosave, itemId, isEditing])

  // Track changes for new items
  useEffect(() => {
    if (isEditing) return undefined
    
    // For new items, any non-empty field counts as a change
    const hasAnyData = Boolean(name || description || location || tags.length > 0 || properties.length > 0)
    setHasChanges(hasAnyData)

    if (autosave && hasAnyData && !isEditing) {
      const timeoutId = setTimeout(() => {
        createItem({
          name: name.trim() || "Untitled",
          description: description.trim(),
          location: location.trim(),
          tags,
          properties,
        })
        setHasChanges(false)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
    return undefined
  }, [name, description, location, tags, properties, autosave, isEditing])

  const availableTags = ["hardware", "plumbing", "electronics", "tools", "lighting", "outdoor", "kitchen", "automotive"]

  // Warn before navigating away with unsaved changes
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener("beforeRemove", (e) => {
        // Skip if autosave is on (changes already saved) or no changes
        if (autosave || !hasChanges) return

        // Prevent default navigation
        e.preventDefault()

        // Show confirmation dialog
        Alert.alert(
          "Unsaved Changes",
          "You have unsaved changes. Do you want to save before leaving?",
          [
            {
              text: "Save & Exit",
              onPress: async () => {
                if (isEditing && itemId) {
                  await updateItem(itemId, {
                    name: name.trim(),
                    description: description.trim(),
                    location: location.trim(),
                    tags,
                    properties,
                  })
                }
                navigation.dispatch(e.data.action)
              },
            },
            {
              text: "Discard & Exit",
              style: "destructive",
              onPress: () => navigation.dispatch(e.data.action),
            },
            {
              text: "Stay",
              style: "cancel",
            },
          ],
        )
      })

      return unsubscribe
    }, [navigation, autosave, hasChanges, isEditing, itemId, name, description, location, tags, properties]),
  )

  const onCancel = () => {
    if (!autosave && hasChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Do you want to save before leaving?",
        [
          {
            text: "Save & Exit",
            onPress: async () => {
              await handleSave()
            },
          },
          {
            text: "Discard & Exit",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
          {
            text: "Stay",
            style: "cancel",
          },
        ],
      )
    } else {
      navigation.goBack()
    }
  }

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

  const handleAddTagFromMenu = () => {
    setMenuVisible(false)
    if (newTag.trim()) {
      addTag(newTag.trim())
    }
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
          !autosave && hasChanges ? (
            <TouchableOpacity onPress={handleSave} style={themed($iconButton)}>
              <Icon icon="check" size={24} color={theme.colors.tint} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={toggleMenu} style={themed($iconButton)}>
              <Icon icon="more" size={24} />
            </TouchableOpacity>
          )
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
            <TouchableOpacity style={themed($menuItem)} onPress={handleAddTagFromMenu}>
              <Icon icon="check" size={20} />
            </TouchableOpacity>
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
            placeholderTextColor={colors.textDim}
          />
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Location</Text>
          <TextInput
            style={themed($input)}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Garage, Closet"
            placeholderTextColor={colors.textDim}
          />
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Description</Text>
          <TextInput
            style={[themed($input), { minHeight: 80, textAlignVertical: "top" }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor={colors.textDim}
            multiline
          />
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Tags</Text>
          <View style={themed($tagsContainer)}>
            {tags.map((tag) => (
              <TouchableOpacity key={tag} onPress={() => removeTag(tag)} style={themed($tagChip)}>
                <Icon icon="x" size={14} />
                <Text style={themed($tagChipText)}>{tag}</Text>
              </TouchableOpacity>
            ))}
            <View style={themed($tagInputContainer)}>
              <TextInput
                style={themed($tagInputInline)}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="+"
                placeholderTextColor={colors.textDim}
                onSubmitEditing={() => addTag(newTag)}
              />
            </View>
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
              placeholderTextColor={colors.textDim}
            />
            <TextInput
              style={[themed($input), { flex: 1, marginRight: 8 }]}
              value={newPropValue}
              onChangeText={setNewPropValue}
              placeholder="Value"
              placeholderTextColor={colors.textDim}
            />
          </View>
          <View style={themed($propertyInputRow)}>
            <TextInput
              style={[themed($input), { flex: 1 }]}
              value={newPropUnit}
              onChangeText={setNewPropUnit}
              placeholder="Unit (optional)"
              placeholderTextColor={colors.textDim}
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
  flexDirection: "row",
  alignItems: "center",
  paddingLeft: 10,
  paddingRight: 8,
  paddingVertical: 6,
  borderRadius: 16,
  backgroundColor: "primary",
  gap: 4,
}

const $tagChipText: TextStyle = {
  fontSize: 14,
  color: "white",
}

const $tagInputContainer: ViewStyle = {
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "border",
  borderStyle: "dashed",
  minWidth: 40,
  alignItems: "center",
  justifyContent: "center",
}

const $tagInputInline: TextStyle = {
  fontSize: 14,
  color: "text",
  padding: 0,
  minWidth: 30,
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
<<<<<<< Updated upstream
  color: colors.text,
  borderColor: colors.border,
})
=======
  backgroundColor: "card",
  borderWidth: 1,
  borderColor: "border",
>>>>>>> Stashed changes
}

const $hint: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
  marginTop: 4,
})
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