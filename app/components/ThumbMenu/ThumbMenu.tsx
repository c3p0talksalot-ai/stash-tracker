import React, { useState } from "react"
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native"

import { Icon, IconTypes } from "../Icon"
import { Text } from "../Text"
import { useSettings } from "@/context/SettingsContext"
import { useAppTheme } from "@/theme/context"

export interface ThumbMenuAction {
  icon: IconTypes
  label: string
  onPress: () => void
}

export interface ThumbMenuProps {
  actions: ThumbMenuAction[]
  style?: ViewStyle
}

export const ThumbMenu: React.FC<ThumbMenuProps> = ({ actions, style }) => {
  const { handedness } = useSettings()
  const { theme } = useAppTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  const isLeftHanded = handedness === "left"

  const containerStyle: ViewStyle = {
    position: "absolute",
    [isLeftHanded ? "left" : "right"]: 8,
    bottom: 120,
    zIndex: 100,
  }

  const handlePress = (action: ThumbMenuAction) => {
    action.onPress()
    setIsExpanded(false)
  }

  return (
    <View style={[containerStyle, style]}>
      {/* Expanded menu */}
      {isExpanded && (
        <View
          style={[
            styles.menuContainer,
            {
              [isLeftHanded ? "right" : "left"]: 56,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {actions.map((action, index) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.menuItem]}
              onPress={() => handlePress(action)}
              activeOpacity={0.7}
            >
              <Icon
                icon={action.icon}
                size={24}
                color={theme.colors.text}
              />
              <Text
                size="xs"
                style={[
                  styles.menuLabel,
                  { color: theme.colors.text },
                  isLeftHanded && styles.menuLabelLeft,
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main button */}
      <TouchableOpacity
        style={[
          styles.mainButton,
          {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
          },
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <Text size="xl" style={{ color: theme.colors.background, fontWeight: "bold" }}>
          {isExpanded ? "✕" : "+"}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
  },
  menuContainer: {
    position: "absolute",
    top: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
  },
  menuLabel: {
    marginLeft: 10,
  },
  menuLabelLeft: {
    marginLeft: 0,
    marginRight: 10,
  },
})