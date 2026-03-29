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
import { useNavigation } from "@react-navigation/native"
import { useAppTheme } from "@/theme/context"
import { useSettings } from "@/context/SettingsContext"
import { getItem, createItem, updateItem, deleteItem } from "@/services/items"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import type { ThemedStyle } from "@/theme/types"

type Props = AppStackScreenProps<"ItemEditor">

export function ItemEditorScreen({ navigation, route }: Props) {
  const { itemId } = route.params || {}
  const { themed, theme } = useAppTheme()
  const { colors } = theme
  const { autosave } = useSettings()
  const navigationInstance = useNavigation()
  
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const lastSaveTime = useRef(0)
  
  const isInitialLoad = useRef(true)
  const originalItemData = useRef<string>("")

  // Generate hash of current data for change detection
  const getCurrentDataHash = useCallback(() => {
    return JSON.stringify({ name, description, location, tags, properties })
  }, [name, description, location, tags, properties])

  // Track unsaved changes
  useEffect(() => {
    if (!isInitialLoad.current && !loading && isEditing) {
      const currentHash = getCurrentDataHash()
      setHasUnsavedChanges(currentHash !== originalItemData.current)
    }
  }, [name, description, location, tags, properties, loading, isEditing, getCurrentDataHash])

  // Save on blur - no debounce, save immediately when field loses focus
  const handleBlur = useCallback(() => { console.log("!!! BLUR FIRED, name currently:", name)
    // Debounce: prevent saves within 1 second of each other
    const now = Date.now()
    if (now - lastSaveTime.current < 1000) {
      console.log("handleBlur blocked - too soon after last save")
      return
    }
    console.log("handleBlur called", { autosave, hasUnsavedChanges, isSaving, isEditing, isInitialLoad: isInitialLoad.current, timeSinceLastSave: now - lastSaveTime.current })
    if (autosave && hasUnsavedChanges && !isSaving && isEditing && !isInitialLoad.current) {
      console.log("-> calling handleSaveInternal")
      lastSaveTime.current = now
      handleSaveInternal()
    }
  }, [autosave, hasUnsavedChanges, isSaving, isEditing])

  // Navigation warning for unsaved changes
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
              onPress: () => navigationInstance.dispatch(e.data.action),
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
    if (itemId) {
      loadItem(itemId)
    }
  }, [itemId])

  const loadItem = async (id: string) => {
    console.log("loadItem", id)
    try {
      const item = await getItem(id)
      if (item) {
        console.log("loadItem data:", JSON.stringify(item))
        setName(item.name)
        setDescription(item.description || "")
        setLocation(item.location || "")
        setTags(item.tags)
        setProperties(item.properties)
        // Store original data hash
        originalItemData.current = JSON.stringify({
          name: item.name,
          description: item.description || "",
          location: item.location || "",
          tags: item.tags,
          properties: item.properties,
        })
      }
    } catch (e) {
      console.error("Failed to load item:", e)
    } finally {
      setLoading(false)
      isInitialLoad.current = false
    }
  }

  const availableTags = ["hardware", "plumbing", "electronics", "tools", "lighting", "outdoor", "kitchen", "automotive"]

  const onCancel = () => {
    // When autosave is ON, just reset to original values
    if (autosave && isEditing && hasUnsavedChanges) {
      if (originalItemData.current) {
        const original = JSON.parse(originalItemData.current)
        setName(original.name)
        setDescription(original.description || "")
        setLocation(original.location || "")
        setTags(original.tags)
        setProperties(original.properties)
        setHasUnsavedChanges(false)
      }
    } else {
      navigation.goBack()
    }
  }

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag])
    }
    setNewTag("")
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const addProperty = () => {
    if (newPropKey && newPropValue) {
      setProperties(prev => [...prev, { key: newPropKey, value: newPropValue, unit: newPropUnit || undefined }])
      setNewPropKey("")
      setNewPropValue("")
      setNewPropUnit("")
      // Trigger save after adding property
      console.log("addProperty, triggering save", { autosave, isEditing, isSaving })
      if (autosave && isEditing && !isSaving) {
        handleSaveInternal()
      }
    }
  }

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index))
  }

  // Internal save function used by autosave and manual save
  const handleSaveInternal = async (skipReload = false) => {
    console.log("handleSaveInternal", { nameVal: name, descVal: description, locVal: location, isEditing, itemId, name, description, location, tags, properties })
    if (!name.trim()) {
      if (!autosave) {
        Alert.alert("Error", "Please enter an item name")
      }
      return
    }

    setIsSaving(true)
    try {
      if (isEditing && itemId) {
        console.log("updateItem called with", { name }); console.log("!!! UPDATE CALL, name:", name); await updateItem(itemId, {
          name: name,
          description: description,
          location: location,
          tags,
          properties,
        })
      } else {
        await createItem({
          name: name,
          description: description,
          location: location,
          tags,
          properties,
        })
      }
      // Update original data hash after save
      originalItemData.current = getCurrentDataHash()
      setHasUnsavedChanges(false)
      if (!skipReload && isEditing && itemId) {
        await loadItem(itemId)
      }
      if (!isEditing) {
        navigation.goBack()
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

  const handleSave = async () => {
    await handleSaveInternal()
  }

  const handleDelete = () => {
    setMenuVisible(false)
    Alert.alert("Delete Item", `Are you sure you want to delete "${name}"?`, [
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

  if (loading) {
    return (
      <View style={[themed($container), styles.container]}>
        <Text style={themed($loadingText)}>Loading...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={[themed($container), styles.container]}>
      <View style={themed($header)}>
        <TouchableOpacity onPress={onCancel} style={themed($iconButton)}>
          <Icon icon="back" size={24} />
        </TouchableOpacity>
        <View style={themed($headerTitleContainer)}>
          <Text style={themed($headerTitle)}>{isEditing ? "Edit Item" : "New Item"}</Text>
          {autosave && isEditing && hasUnsavedChanges && (
            <Text style={themed($savingText)}>{isSaving ? "Saving..." : "Unsaved"}</Text>
          )}
        </View>
        {/* Show save button when: new item OR autosave is OFF */}
        {!isEditing || !autosave ? (
          <TouchableOpacity onPress={handleSave} style={themed($iconButton)}>
            <Icon icon="check" size={24} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={toggleMenu} style={themed($iconButton)}>
            <Icon icon="more" size={24} />
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
            onChangeText={(text) => { console.log("!!! TYPING name:", text); setName(text) }}
            placeholder="Enter item name"
            placeholderTextColor={colors.textDim}
            onEndEditing={handleBlur}
          />
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Location</Text>
          <TextInput
            style={themed($input)}
            value={location}
            onChangeText={(text) => { console.log("!!! TYPING location:", text); setLocation(text) }}
            placeholder="e.g., Garage, Closet"
            placeholderTextColor={colors.textDim}
            onEndEditing={handleBlur}
          />
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Description</Text>
          <TextInput
            style={[themed($input), { minHeight: 80, textAlignVertical: "top" }]}
            value={description}
            onChangeText={(text) => { console.log("!!! TYPING description:", text); setDescription(text) }}
            placeholder="Enter description"
            placeholderTextColor={colors.textDim}
            multiline
            onEndEditing={handleBlur}
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
                onSubmitEditing={() => { addTag(newTag); handleBlur(); }}
                onEndEditing={handleBlur}
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

const $headerTitleContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.text,
})

const $savingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
  marginTop: 2,
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

const $tagChip: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingLeft: 10,
  paddingRight: 8,
  paddingVertical: 6,
  borderRadius: 16,
  backgroundColor: colors.tint,
  gap: 4,
})

const $tagChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textInverse,
})

const $tagInputContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  borderStyle: "dashed",
  minWidth: 40,
  alignItems: "center",
  justifyContent: "center",
})

const $tagInputInline: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.text,
  padding: 0,
  minWidth: 30,
})

const $tagInputRow: ViewStyle = {
  flexDirection: "row",
  gap: 8,
}

const $tagInput: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  padding: 12,
  borderRadius: 8,
  fontSize: 16,
  backgroundColor: colors.backgroundCard,
  borderWidth: 1,
  borderColor: colors.border,
})

const $hint: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
  marginTop: 4,
})

const $addButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 8,
  backgroundColor: colors.tint,
})

const $addButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textInverse,
  fontWeight: "600",
})

const $propertyRow: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 12,
  borderRadius: 8,
  backgroundColor: colors.backgroundCard,
  marginBottom: 8,
})

const $propertyText: TextStyle = {
  fontSize: 16,
}

const $removeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.error,
})

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

const $loadingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.textDim,
  textAlign: "center",
  marginTop: 100,
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})