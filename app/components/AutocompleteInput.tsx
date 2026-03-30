import { useState, useCallback, useMemo } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
  TextStyle,
} from "react-native"
import AutocompleteTags, { AutocompleteTag } from "react-native-autocomplete-tags"
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

  // Determine number of columns based on screen width
  const numColumns = useMemo(() => {
    if (width < 400) return 1
    if (width < 600) return 2
    return 3
  }, [width])

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!value.trim()) return suggestions
    const lowerValue = value.toLowerCase()
    return suggestions.filter((s) =>
      s.label.toLowerCase().includes(lowerValue)
    )
  }, [value, suggestions])

  // Convert to AutocompleteTag format
  const tags: AutocompleteTag[] = useMemo(() => {
    if (!value.trim()) return []
    // Only show as tag if exact match exists in suggestions
    const exactMatch = suggestions.find(
      (s) => s.label.toLowerCase() === value.toLowerCase()
    )
    if (exactMatch) {
      return [{ id: exactMatch.id, text: exactMatch.label }]
    }
    return []
  }, [value, suggestions])

  const handleTagPress = useCallback(
    (tag: AutocompleteTag) => {
      // User selected a suggestion from autocomplete
      onChangeText(tag.text)
      if (onSelect) {
        onSelect({ id: tag.id, label: tag.text })
      }
    },
    [onChangeText, onSelect]
  )

  const handleTextChange = useCallback(
    (text: string) => {
      onChangeText(text)
    },
    [onChangeText]
  )

  const renderSuggestionItem = useCallback(
    ({ item }: { item: AutocompleteOption }) => (
      <View
        style={[
          styles.suggestionItem,
          { backgroundColor: colors.backgroundCard },
        ]}
      >
        <Text style={[styles.suggestionText, { color: colors.text }]}>
          {item.label}
        </Text>
      </View>
    ),
    [colors]
  )

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <AutocompleteTags
        tags={tags}
        inputValue={value}
        onChangeText={handleTextChange}
        onTagPress={handleTagPress}
        suggestions={filteredSuggestions}
        suggestionRowHeight={44}
        flatListStyle={[
          styles.flatListStyle,
          { backgroundColor: colors.backgroundCard },
          numColumns > 1 && { flexDirection: "row", flexWrap: "wrap" },
        ]}
        renderSuggestionItem={renderSuggestionItem}
        inputStyles={[
          styles.input,
          {
            backgroundColor: colors.backgroundCard,
            borderColor: colors.border,
            color: colors.text,
          },
          multiline && { minHeight: 80, textAlignVertical: "top" as const },
        ]}
        tagContainerStyles={[
          styles.tagContainer,
          { backgroundColor: colors.tint },
        ]}
        tagTextStyles={[styles.tagText, { color: colors.textInverse }]}
        removeTagIconColor={colors.textInverse}
        placeholderTextColor={colors.textDim}
        placeholder={placeholder}
        disabled={disabled}
        autoCapitalize={autoCapitalize}
        // Disable auto-add of tags - user must explicitly select
        createTagOn={[]}
        // Don't filter suggestions automatically - we handle it
        disableAutoFilter={true}
      />
      {hint && (
        <Text style={[styles.hint, { color: colors.textDim }]}>{hint}</Text>
      )}
    }
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
  tagContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  } as ViewStyle,
  tagText: {
    fontSize: 14,
    marginLeft: 4,
  } as TextStyle,
})