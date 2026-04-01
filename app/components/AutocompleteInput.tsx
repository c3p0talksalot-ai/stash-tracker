import { useState, useMemo, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  ViewStyle,
  TextStyle,
  Keyboard,
} from "react-native"
import { useAppTheme } from "@/theme/context"

export interface AutocompleteOption {
  id: string
  label: string
}

interface AutocompleteInputProps {
  value: string
  onChangeText: (text: string) => void
  onSelect?: (option: AutocompleteOption) => void
  suggestions: AutocompleteOption[]
  placeholder?: string
  label?: string
  hint?: string
  disabled?: boolean
  onBlur?: () => void
  onSubmitEditing?: () => void
  autoCapitalize?: "none" | "sentences" | "words" | "characters"
  inputStyle?: ViewStyle
  inputRef?: React.RefObject<TextInput>
  inline?: boolean  // If true, suggestions flow below input (not absolute positioned)
}

export function AutocompleteInput({
  value,
  onChangeText,
  onSelect,
  suggestions,
  placeholder,
  label,
  hint,
  disabled = false,
  onBlur,
  onSubmitEditing,
  autoCapitalize = "sentences",
  inputStyle,
  inputRef,
  inline = false,
}: AutocompleteInputProps) {
  const { theme } = useAppTheme()
  const { colors } = theme
  const { width } = useWindowDimensions()
  const [isFocused, setIsFocused] = useState(false)

  // Determine number of columns based on screen width
  const numColumns = useMemo(() => {
    if (width < 400) return 1
    if (width < 600) return 2
    return 3
  }, [width])

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!value.trim()) {
      console.log("[filter] empty value, returning first 10")
      return suggestions.slice(0, 10)
    }
    const lowerValue = value.toLowerCase()
    const filtered = suggestions
      .filter((s) => s.label.toLowerCase().includes(lowerValue))
      .slice(0, 10)
    console.log("[filter] value:", value, "lower:", lowerValue, "matched:", filtered.map(f => f.label))
    return filtered
  }, [value, suggestions])

  const showSuggestions = isFocused && filteredSuggestions.length > 0

  // Debug: log when suggestions change or focus changes
  useEffect(() => {
    console.log(`[AutocompleteInput] value="${value}", isFocused=${isFocused}, suggestions=${suggestions.length}, filtered=${filteredSuggestions.length}, show=${showSuggestions}`)
  }, [value, isFocused, suggestions.length, filteredSuggestions.length, showSuggestions])

  const handleSelect = (option: AutocompleteOption) => {
    console.log("[AutocompleteInput] handleSelect:", option.label, "onSelect exists:", !!onSelect)
    // If parent has onSelect, let it handle the selection
    if (onSelect) {
      console.log("[handleSelect] calling onSelect with:", option.label)
      onSelect(option)
      // Clear the input for next entry
      console.log("[handleSelect] clearing input")
      onChangeText("")
    } else {
      // Default behavior: set the value
      console.log("[handleSelect] setting value:", option.label)
      onChangeText(option.label)
    }
    setIsFocused(false)
    Keyboard.dismiss()
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          { backgroundColor: colors.backgroundCard, borderColor: colors.border, color: colors.text },
          isFocused && { borderColor: colors.primary },
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        autoCapitalize={autoCapitalize}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false)
          if (onBlur) onBlur()
        }}
        onSubmitEditing={onSubmitEditing}
        editable={!disabled}
      />
      {showSuggestions && (
        <View
          style={[
            styles.suggestionsContainer,
            { backgroundColor: "#1a1a1a", borderColor: colors.border },
            inline && styles.suggestionsContainerInline,
            numColumns > 1 && { flexDirection: "row", flexWrap: "wrap" },
          ]}
        >
          {/* DEBUG */}
          {console.log("[SUGGESTIONS_BLOCK] rendering, filtered count:", filteredSuggestions.length)}
          {filteredSuggestions.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.suggestionItem,
                { borderBottomColor: colors.border },
                numColumns > 1 && { width: `${100 / numColumns}%` },
                pressed && { backgroundColor: "#333" },
              ]}
              onPress={() => { console.log("[onPress] tapped:", item.label); handleSelect(item) }}
            >
              <Text style={[styles.suggestionText, { color: "#fff" }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {hint && (
        <Text style={[styles.hint, { color: colors.textDim }]}>{hint}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    position: "relative",
    zIndex: 100,
  } as ViewStyle,
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  } as TextStyle,
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
  } as ViewStyle & TextStyle,
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: -10,
    right: -10,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#1a1a1a",
    zIndex: 200,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    maxHeight: 200,
    minHeight: 44,
    overflow: "hidden",
  } as ViewStyle,
  suggestionsContainerInline: {
    position: "relative",
    top: 0,
    left: 0,
    right: 0,
    minHeight: 44,
  } as ViewStyle,
  suggestionsList: {
    maxHeight: 200,
    backgroundColor: "#1a1a1a",
  } as ViewStyle,
  suggestionItem: {
    padding: 12,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    justifyContent: "center",
  } as ViewStyle,
  suggestionText: {
    fontSize: 14,
    color: "#fff",
    flexWrap: "wrap",
    flex: 1,
  } as TextStyle,
  hint: {
    fontSize: 12,
    marginTop: 4,
  } as TextStyle,
})