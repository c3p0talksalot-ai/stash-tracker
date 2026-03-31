import { useState, useMemo } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  
  TouchableOpacity,
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
    if (!value.trim()) return suggestions.slice(0, 10)
    const lowerValue = value.toLowerCase()
    return suggestions
      .filter((s) => s.label.toLowerCase().includes(lowerValue))
      .slice(0, 10)
  }, [value, suggestions])

  const showSuggestions = isFocused && filteredSuggestions.length > 0

  const handleSelect = (option: AutocompleteOption) => {
    console.log("[AutocompleteInput] handleSelect:", option.label)
    onChangeText(option.label)
    if (onSelect) {
      onSelect(option)
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
            { backgroundColor: colors.backgroundCard, borderColor: colors.border },
            numColumns > 1 && { flexDirection: "row", flexWrap: "wrap" },
          ]}
        >
          {filteredSuggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.suggestionItem,
                { borderBottomColor: colors.border },
                numColumns > 1 && { width: `${100 / numColumns}%` },
              ]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.suggestionText, { color: colors.text }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
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
    marginBottom: 16,
    zIndex: 1000,
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
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    maxHeight: 200,
  } as ViewStyle,
  suggestionsList: {
    maxHeight: 200,
  } as ViewStyle,
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  } as ViewStyle,
  suggestionText: {
    fontSize: 14,
  } as TextStyle,
  hint: {
    fontSize: 12,
    marginTop: 4,
  } as TextStyle,
})