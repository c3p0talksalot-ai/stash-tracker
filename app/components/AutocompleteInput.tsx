import { useCallback, useMemo, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from "react-native"
import AutocompleteTags from "react-native-autocomplete-tags"
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
  multiline?: boolean
  autoCapitalize?: "none" | "sentences" | "words" | "characters"
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
  multiline = false,
  autoCapitalize = "sentences",
}: AutocompleteInputProps) {
  const { theme } = useAppTheme()
  const { colors } = theme
  const { width } = useWindowDimensions()

  const numColumns = useMemo(() => {
    if (width < 400) return 1
    if (width < 600) return 2
    return 3
  }, [width])

  const filteredSuggestions = useMemo(() => {
    if (!value.trim()) return suggestions
    const lowerValue = value.toLowerCase()
    return suggestions.filter((s) =>
      s.label.toLowerCase().includes(lowerValue)
    )
  }, [value, suggestions])

  const handleSuggestionPress = useCallback(
    (suggestion: AutocompleteOption) => {
      onChangeText(suggestion.label)
      if (onSelect) {
        onSelect(suggestion)
      }
    },
    [onChangeText, onSelect]
  )

  const renderSuggestion = useCallback(
    (suggestion: AutocompleteOption, onPress: (s: AutocompleteOption) => void) => (
      <TouchableOpacity
        style={[styles.suggestionItem, { backgroundColor: colors.backgroundCard }]}
        onPress={() => onPress(suggestion)}
      >
        <Text style={[styles.suggestionText, { color: colors.text }]}>
          {suggestion.label}
        </Text>
      </TouchableOpacity>
    ),
    [colors]
  )

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <AutocompleteTags
        tags={value.trim() ? [value] : []}
        onChangeTags={() => {}}
        labelExtractor={(tag: string) => tag}
        suggestions={filteredSuggestions}
        onSuggestionPress={handleSuggestionPress}
        suggestionExtractor={(suggestion: AutocompleteOption) => suggestion.label}
        containerStyle={styles.autocompleteContainer}
        inputStyle={{
          padding: 12,
          borderRadius: 8,
          fontSize: 16,
          borderWidth: 1,
          backgroundColor: colors.backgroundCard,
          borderColor: colors.border,
          color: colors.text,
          ...(multiline ? { minHeight: 80, textAlignVertical: "top" as const } : {}),
        }}
        flatListStyle={{
          marginTop: 4,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "transparent",
          maxHeight: 200,
          backgroundColor: colors.backgroundCard,
          ...(numColumns > 1 ? { flexDirection: "row", flexWrap: "wrap" } : {}),
        }}
        renderSuggestion={renderSuggestion}
        inputProps={{
          placeholder,
          placeholderTextColor: colors.textDim,
          value,
          onChangeText,
          autoCapitalize,
          onBlur,
          onSubmitEditing,
        }}
        allowCustomTags={false}
        parseChars={[]}
      />
      {hint && (
        <Text style={[styles.hint, { color: colors.textDim }]}>{hint}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
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
  autocompleteContainer: {
    borderWidth: 0,
  } as ViewStyle,
  flatListStyle: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    maxHeight: 200,
  } as ViewStyle,
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  } as ViewStyle,
  suggestionText: {
    fontSize: 14,
  } as TextStyle,
  hint: {
    fontSize: 12,
    marginTop: 4,
  } as TextStyle,
})