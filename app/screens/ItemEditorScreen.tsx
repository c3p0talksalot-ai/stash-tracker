import { useState, useEffect, useRef, useCallback } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  Alert,
  TextStyle,
  ViewStyle,
  Modal,
  Pressable,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useAppTheme } from "@/theme/context"
import { useSettings } from "@/context/SettingsContext"
import { getItem, createItem, updateItem, deleteItem, getAllItems, getLocationSuggestions, getPropertyKeySuggestions, getPropertyUnitSuggestions, getTagSuggestions, findOrCreateTag, getTagNames } from "@/services/items"
import { Icon } from "@/components/Icon"
import { AutocompleteInput, type AutocompleteOption } from "@/components/AutocompleteInput"
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
  const [tagNames, setTagNames] = useState<Record<string, string>>({})
  const [newTag, setNewTag] = useState("")
  const newTagRef = useRef("")
  const [properties, setProperties] = useState<{ key: string; value: string; unit?: string }[]>([])
  const [newPropKey, setNewPropKey] = useState("")
  const [newPropValue, setNewPropValue] = useState("")
  const [newPropUnit, setNewPropUnit] = useState("")
  const newPropValueInputRef = useRef<TextInput>(null)
  const newPropUnitInputRef = useRef<TextInput>(null)
  
  // Refs for property input values
  const newPropKeyRef = useRef("")
  const newPropValueRef = useRef("")
  const newPropUnitRef = useRef("")
  const [loading, setLoading] = useState(isEditing)
  const [menuVisible, setMenuVisible] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Autocomplete suggestions
  const [itemNameSuggestions, setItemNameSuggestions] = useState<AutocompleteOption[]>([])
  const [locationSuggestions, setLocationSuggestions] = useState<AutocompleteOption[]>([])
  const [propertyKeySuggestions, setPropertyKeySuggestions] = useState<AutocompleteOption[]>([])
  const [propertyUnitSuggestions, setPropertyUnitSuggestions] = useState<AutocompleteOption[]>([])
  const [tagSuggestions, setTagSuggestions] = useState<AutocompleteOption[]>([])
  
  const lastSaveTime = useRef(0)
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  const nameRef = useRef("")
  const locationRef = useRef("")
  const descriptionRef = useRef("")
  
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

  // Save on blur - defer slightly to let React flush state updates
  const handleBlur = useCallback(() => {
    const now = Date.now()
    if (now - lastSaveTime.current < 1000) {
      return
    }
    if (autosave && hasUnsavedChanges && !isSaving && isEditing && !isInitialLoad.current) {
      // Defer to next event loop tick so state has time to update
      setTimeout(() => {
        lastSaveTime.current = Date.now()
        handleSaveInternal()
      }, 0)
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

  // Load autocomplete suggestions on mount
  const [allTags, setAllTags] = useState<AutocompleteOption[]>([])
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const [locations, keys, units, tags, items] = await Promise.all([
          getLocationSuggestions(),
          getPropertyKeySuggestions(),
          getPropertyUnitSuggestions(),
          getTagSuggestions(),
          getAllItems(),
        ])
        setLocationSuggestions(locations)
        setPropertyKeySuggestions(keys)
        setPropertyUnitSuggestions(units)
        setAllTags(tags)
        // Filter out tags that are already added to this item
        const availableTags = tags.filter(t => !tags.includes(t.id))
        setTagSuggestions(availableTags)
        console.log("[loadSuggestions] tagSuggestions loaded:", availableTags.length, availableTags.map(t => t.label))
        setItemNameSuggestions(items.map((item) => ({ id: item.id, label: item.name })))
      } catch (e) {
        console.error("Failed to load suggestions:", e)
      }
    }
    loadSuggestions()
  }, [])

  // Update tag suggestions when tags change (remove already-added tags)
  useEffect(() => {
    const availableTags = allTags.filter(t => !tags.includes(t.id))
    setTagSuggestions(availableTags)
  }, [tags, allTags])

  const loadItem = async (id: string) => {
    try {
      const item = await getItem(id)
      if (item) {
        setName(item.name)
        setDescription(item.description || "")
        setLocation(item.location || "")
        setTags(item.tags)
        setProperties(item.properties)
        // Load tag names for display
        const names = await getTagNames(item.tags)
        setTagNames(names)
        // Sync refs with loaded data
        nameRef.current = item.name
        descriptionRef.current = item.description || ""
        locationRef.current = item.location || ""
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

  const addTag = async (tag: string) => {
    console.log("[addTag] Called with:", tag, "current tags:", tags)
    if (!tag) {
      console.log("[addTag] NOT adding - empty tag")
      setNewTag("")
      newTagRef.current = ""
      return
    }
    
    try {
      // Convert tag name to ID
      const tagId = await findOrCreateTag(tag)
      console.log("[addTag] Tag ID:", tagId)
      
      if (!tags.includes(tagId)) {
        console.log("[addTag] Adding tag ID:", tagId)
        const newTags = [...tags, tagId]
        setTags(newTags)
        setTagNames(prev => ({ ...prev, [tagId]: tag }))
        // Save after adding tag
        if (autosave && isEditing && !isSaving) {
          handleSaveInternal(false, newTags, undefined)
        }
      } else {
        console.log("[addTag] NOT adding - already exists:", tagId)
      }
    } catch (e) {
      console.error("[addTag] Failed to add tag:", e)
    }
    
    setNewTag("")
    newTagRef.current = ""
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const addProperty = () => {
    // Use ref values if state is empty (keyboard dismissed)
    const key = (newPropKey || newPropKeyRef.current).trim()
    const value = (newPropValue || newPropValueRef.current).trim()
    const unit = (newPropUnit || newPropUnitRef.current).trim()

    console.log("[addProperty] Called with:", { key, value, unit, isEditing, autosave, isSaving })

    // Key + Value or Key + Unit = save property
    if (key && (value || unit)) {
      console.log("[addProperty] Saving property:", { key, value, unit })
      const newProps = [...properties, { key, value: value || "", unit: unit || undefined }]
      setProperties(newProps)
      setNewPropKey("")
      setNewPropValue("")
      setNewPropUnit("")
      newPropKeyRef.current = ""
      newPropValueRef.current = ""
      newPropUnitRef.current = ""
      // Trigger save after adding property
      if (autosave && isEditing && !isSaving) {
        console.log("[addProperty] Calling handleSaveInternal with new properties")
        handleSaveInternal(false, undefined, newProps)
      }
    } else if (key && !value && !unit) {
      // Key only - show dialog
      console.log("[addProperty] Showing key-only dialog for:", key)
      Alert.alert(
        "Key Only",
        `You've entered a key "${key}" without a value or unit. What would you like to do?`,
        [
          { 
            text: "Add as Tag", 
            onPress: async () => {
              console.log("[addProperty] Adding key as tag:", key)
              try {
                // Find or create the tag in DB to get its ID
                const tagId = await findOrCreateTag(key)
                console.log("[addProperty] Tag ID:", tagId, "current tags:", tags)
                const newTags = tags.includes(tagId) ? tags : [...tags, tagId]
                console.log("[addProperty] New tags array:", newTags)
                setTags(newTags)
                setTagNames(prev => ({ ...prev, [tagId]: key }))
                setNewPropKey("")
                newPropKeyRef.current = ""
                // Force save with explicit tags array
                if (autosave && isEditing && !isSaving) {
                  handleSaveInternal(false, newTags, undefined)
                }
              } catch (e) {
                console.error("[addProperty] Failed to add tag:", e)
              }
            }
          },
          { 
            text: "Add Value", 
            onPress: () => {
              console.log("[addProperty] User chose Add Value, focusing value input")
              setTimeout(() => newPropValueInputRef.current?.focus(), 100)
            }
          },
          { 
            text: "Add Unit", 
            onPress: () => {
              console.log("[addProperty] User chose Add Unit, focusing unit input")
              setTimeout(() => newPropUnitInputRef.current?.focus(), 100)
            }
          },
        ]
      )
    } else {
      console.log("[addProperty] NOT SAVING - missing key/value/unit:", { key, value, unit })
    }
  }

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index))
  }

  // Internal save function used by autosave and manual save
  const handleSaveInternal = async (skipReload = false, overrideTags?: string[] | undefined, overrideProperties?: { key: string; value: string; unit?: string }[] | undefined) => {
    const tagsToSave = overrideTags !== undefined ? overrideTags : tags
    const propsToSave = overrideProperties !== undefined ? overrideProperties : properties
    console.log("[handleSaveInternal] Called. isEditing:", isEditing, "itemId:", itemId, "overrideTags:", overrideTags, "overrideProps:", overrideProperties, "tagsToSave:", tagsToSave, "propsToSave:", propsToSave)
    if (!name.trim()) {
      if (!autosave) {
        Alert.alert("Error", "Please enter an item name")
      }
      return
    }

    setIsSaving(true)
    try {
      if (isEditing && itemId) {
        const updateData = {
          name: nameRef.current || name,
          description: descriptionRef.current || description,
          location: locationRef.current || location,
          tags: tagsToSave,
          properties: propsToSave,
        }
        console.log("[handleSaveInternal] Updating item:", itemId, updateData)
        await updateItem(itemId, updateData)
      } else {
        const createData = {
          name: nameRef.current || name,
          description: descriptionRef.current || description,
          location: locationRef.current || location,
          tags: tagsToSave,
          properties: propsToSave,
        }
        console.log("[handleSaveInternal] Creating item:", createData)
        await createItem(createData)
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
          <AutocompleteInput
            value={name}
            onChangeText={(text) => { setName(text); nameRef.current = text; clearTimeout(debounceTimer.current); debounceTimer.current = setTimeout(() => { if (autosave && hasUnsavedChanges && !isSaving) handleSaveInternal() }, 1500) }}
            onBlur={handleBlur}
            onSubmitEditing={handleBlur}
            suggestions={itemNameSuggestions}
            placeholder="Enter item name"
            inputStyle={themed($input)}
          />
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Location</Text>
          <AutocompleteInput
            value={location}
            onChangeText={(text) => { setLocation(text); locationRef.current = text; clearTimeout(debounceTimer.current); debounceTimer.current = setTimeout(() => { if (autosave && hasUnsavedChanges && !isSaving) handleSaveInternal() }, 1500) }}
            onBlur={handleBlur}
            onSubmitEditing={handleBlur}
            suggestions={locationSuggestions}
            placeholder="e.g., Garage, Closet"
            inputStyle={themed($input)}
          />
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Description</Text>
          <TextInput
            style={[themed($input), { minHeight: 80, textAlignVertical: "top" }]}
            value={description}
            onChangeText={(text) => { setDescription(text); descriptionRef.current = text; clearTimeout(debounceTimer.current); debounceTimer.current = setTimeout(() => { if (autosave && hasUnsavedChanges && !isSaving) handleSaveInternal() }, 1500) } }
            placeholder="Enter description"
            placeholderTextColor={colors.textDim}
            multiline
            onBlur={handleBlur}
            onEndEditing={handleBlur}
            onSubmitEditing={handleBlur}
          />
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Tags</Text>
          <View style={themed($tagsContainer)}>
            {tags.map((tag, index) => (
              <TouchableOpacity key={`${tag}-${index}`} onPress={() => removeTag(tag)} style={themed($tagChip)}>
                <Icon icon="x" size={14} />
                <Text style={themed($tagChipText)}>{tagNames[tag] || tag}</Text>
              </TouchableOpacity>
            ))}
            <View style={themed($tagInputContainer)}>
              <AutocompleteInput
                value={newTag}
                onChangeText={(text) => { setNewTag(text); newTagRef.current = text }}
                suggestions={tagSuggestions}
                placeholder="+"
                inputStyle={themed($tagInputInline)}
                onSelect={(option) => {
                  console.log("[tag autocomplete] selected:", option.label)
                  addTag(option.label)
                }}
                onSubmitEditing={() => { addTag(newTag || newTagRef.current); setNewTag(""); newTagRef.current = "" }}
                onBlur={handleBlur}
              />
            </View>
          </View>
          <Text style={themed($hint)}>Suggestions: {availableTags.slice(0, 4).join(", ")}</Text>
        </View>

        <View style={[themed($field), { zIndex: 5, position: "relative" }]}>
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
            <View style={{ flex: 1, position: "relative", zIndex: 100 }}>
              <AutocompleteInput
                value={newPropKey}
                onChangeText={(text) => { setNewPropKey(text); newPropKeyRef.current = text }}
                suggestions={propertyKeySuggestions}
                placeholder="Key (e.g., brand)"
                inputStyle={{ flex: 1, marginRight: 8 }}
              />
            </View>
            <TextInput
              ref={newPropValueInputRef}
              style={[themed($input), { flex: 1, marginRight: 8 }]}
              value={newPropValue}
              onChangeText={(text) => { setNewPropValue(text); newPropValueRef.current = text }}
              placeholder="Value"
              placeholderTextColor={colors.textDim}
            />
          </View>
          <View style={themed($propertyInputRow)}>
            <View style={{ flex: 1, position: "relative", zIndex: 100 }}>
              <AutocompleteInput
                value={newPropUnit}
                onChangeText={(text) => { setNewPropUnit(text); newPropUnitRef.current = text }}
                suggestions={propertyUnitSuggestions}
                placeholder="Unit (optional)"
                inputStyle={{ flex: 1 }}
                inputRef={newPropUnitInputRef}
              />
            </View>
            <TouchableOpacity onPress={() => { Keyboard.dismiss(); addProperty(); }} style={themed($addButton)}>
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
  zIndex: 1,
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
  position: "relative",
  zIndex: 10,
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
  position: "relative",
  zIndex: 20,
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
  position: "relative",
  zIndex: 50,
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