import { useState, useEffect, useCallback, useRef } from "react"
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
import { useNavigation } from "@react-navigation/native"
import { useAppTheme } from "@/theme/context"
import { useSettings } from "@/context/SettingsContext"
import { getItem, createItem, updateItem, deleteItem } from "@/services/items"
import { Icon } from "@/components/Icon"
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
  const { themed, theme } = useAppTheme()
  const { autosave } = useSettings()
  const navigationInstance = useNavigation()
  
  const [item, setItem] = useState<ItemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const isInitialLoad = useRef(true)
  const originalItemData = useRef<string>("")

  // Edit form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [properties, setProperties] = useState<{ key: string; value: string; unit?: string }[]>([])
  const [newPropKey, setNewPropKey] = useState("")
  const [newPropValue, setNewPropValue] = useState("")
  const [newPropUnit, setNewPropUnit] = useState("")

  // Track original data to detect changes
  const getCurrentDataHash = useCallback(() => {
    return JSON.stringify({ name, description, location, tags, properties })
  }, [name, description, location, tags, properties])

  // Check for unsaved changes
  useEffect(() => {
    if (!isInitialLoad.current && !loading && item) {
      const currentHash = getCurrentDataHash()
      setHasUnsavedChanges(currentHash !== originalItemData.current)
    }
  }, [name, description, location, tags, properties, loading, item, getCurrentDataHash])

  // Autosave when fields change (with debounce)
  useEffect(() => {
    if (!isInitialLoad.current && autosave && hasUnsavedChanges && !isSaving && !loading && item) {
      const timer = setTimeout(async () => {
        if (autosave && hasUnsavedChanges && !isSaving) {
          await handleSaveInternal()
        }
      }, 1000) // 1 second debounce for autosave
      return () => clearTimeout(timer)
    }
    return undefined
  }, [autosave, hasUnsavedChanges, isSaving, loading, item])

  // Warn before navigating away with unsaved changes
  useEffect(() => {
    const unsubscribe = navigationInstance.addListener("beforeRemove", (e) => {
      if (hasUnsavedChanges && !isSaving) {
        e.preventDefault()
        Alert.alert(
          "Unsaved Changes",
          "You have unsaved changes. Do you want to save before leaving?",
          [
            { text: "Continue Editing", style: "cancel" },
            {
              text: "Discard Changes",
              style: "destructive",
              onPress: () => {
                navigationInstance.dispatch(e.data.action)
              },
            },
            {
              text: "Save & Exit",
              onPress: async () => {
                await handleSaveInternal(true)
                navigationInstance.dispatch(e.data.action)
              },
            },
          ]
        )
      }
    })
    return unsubscribe
  }, [hasUnsavedChanges, isSaving, navigationInstance])

  useEffect(() => {
    loadItem()
  }, [itemId])

  const loadItem = async () => {
    try {
      const data = await getItem(itemId)
      setItem(data)
      if (data) {
        setName(data.name)
        setDescription(data.description || "")
        setLocation(data.location || "")
        setTags(data.tags)
        setProperties(data.properties)
        // Store original data hash for change detection
        originalItemData.current = JSON.stringify({
          name: data.name,
          description: data.description || "",
          location: data.location || "",
          tags: data.tags,
          properties: data.properties,
        })
        // If autosave is on, go directly to edit mode
        if (autosave) {
          setIsEditing(true)
        }
      }
    } catch (e) {
      console.error("Failed to load item:", e)
    } finally {
      isInitialLoad.current = false
      setLoading(false)
    }
  }

  const startEdit = () => {
    setIsEditing(true)
  }

  const cancelEdit = () => {
    // When autosave is on, just reset to original values but stay in edit mode
    if (autosave) {
      if (item) {
        setName(item.name)
        setDescription(item.description || "")
        setLocation(item.location || "")
        setTags(item.tags)
        setProperties(item.properties)
        originalItemData.current = getCurrentDataHash()
        setHasUnsavedChanges(false)
      }
    } else {
      // When autosave is off, revert and exit edit mode
      if (item) {
        setName(item.name)
        setDescription(item.description || "")
        setLocation(item.location || "")
        setTags(item.tags)
        setProperties(item.properties)
      }
      setIsEditing(false)
    }
  }

  // Internal save function used by autosave and manual save
  const handleSaveInternal = async (skipReload = false) => {
    if (!name.trim()) {
      if (!autosave) {
        Alert.alert("Error", "Please enter an item name")
      }
      return
    }

    setIsSaving(true)
    try {
      await updateItem(itemId, {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        tags,
        properties,
      })
      // Update original data hash after save
      originalItemData.current = getCurrentDataHash()
      setHasUnsavedChanges(false)
      if (!skipReload) {
        await loadItem()
      }
    } catch (e) {
      console.error("Failed to save item:", e)
      if (!autosave) {
        Alert.alert("Error", "Failed to save item")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const saveEdit = async () => {
    await handleSaveInternal()
  }

  // Autosave handler - saves immediately when autosave is on
  const handleAutosave = useCallback(async () => {
    if (autosave && hasUnsavedChanges && !isSaving) {
      await handleSaveInternal()
    }
  }, [autosave, hasUnsavedChanges, isSaving])

  const handleDelete = () => {
    setMenuVisible(false)
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

  const toggleMenu = () => {
    setMenuVisible(!menuVisible)
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

  const onBack = () => navigation.goBack()

  const availableTags = ["hardware", "plumbing", "electronics", "tools", "lighting", "outdoor", "kitchen", "automotive"]

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
          <Icon icon="back" size={24} />
          <Text style={themed($backText)}>Back</Text>
        </TouchableOpacity>
        <Text style={themed($errorText)}>Item not found</Text>
      </View>
    )
  }

  // Edit Mode
  if (isEditing) {
    return (
      <ScrollView style={[themed($container), styles.container]}>
        <View style={themed($header)}>
          <TouchableOpacity onPress={cancelEdit} style={themed($iconButton)}>
            <Icon icon="back" size={24} />
          </TouchableOpacity>
          <View style={themed($headerTitleContainer)}>
            <Text style={themed($headerTitle)}>Edit Item</Text>
            {autosave && hasUnsavedChanges && (
              <Text style={themed($savingText)}>{isSaving ? "Saving..." : "Unsaved"}</Text>
            )}
          </View>
          {/* Always show save button for manual save (even when autosave is on) */}
          <TouchableOpacity onPress={saveEdit} style={themed($iconButton)}>
            <Icon icon="check" size={24} />
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
                  placeholderTextColor="#999"
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
                  <Icon icon="x" size={16} />
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

  // View Mode
  return (
    <ScrollView style={[themed($container), styles.container]}>
      <View style={themed($header)}>
        <TouchableOpacity onPress={onBack} style={themed($iconButton)}>
          <Icon icon="back" size={24} />
        </TouchableOpacity>
        <Text style={themed($headerTitle)}>{item.name}</Text>
        <TouchableOpacity onPress={toggleMenu} style={themed($iconButton)}>
          <Icon icon="more" size={24} />
        </TouchableOpacity>
      </View>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={themed($modalOverlay)} onPress={() => setMenuVisible(false)}>
          <View style={themed($menuContainer)}>
            <TouchableOpacity style={themed($menuItem)} onPress={startEdit}>
              <Icon icon="settings" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={themed($menuItem)} onPress={handleDelete}>
              <Icon icon="bell" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <View style={themed($content)}>
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

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.text,
  flex: 1,
  textAlign: "center",
})

const $headerTitleContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
})

const $savingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.tint,
  marginTop: 2,
})

const $iconButton: ThemedStyle<ViewStyle> = () => ({
  padding: 8,
})

const $backButton: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  padding: 8,
})

const $backText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.tint,
  marginLeft: 4,
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

const $tagsContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 8,
}

const $tagBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
  backgroundColor: colors.tint,
})

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

const $tagText: ThemedStyle<TextStyle> = () => ({
  fontSize: 14,
  color: "white",
})

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
  flex: 1,
}

const $propertyInputRow: ViewStyle = {
  flexDirection: "row",
  gap: 8,
  marginTop: 8,
}

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

// Menu styles
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

const $menuDivider: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 1,
  backgroundColor: colors.border,
  marginVertical: 4,
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})