import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react"
import { useMMKVString } from "react-native-mmkv"

export type Handedness = "left" | "right"

export type SettingsContextType = {
  handedness: Handedness
  setHandedness: (h: Handedness) => void
}

export const SettingsContext = createContext<SettingsContextType | null>(null)

export interface SettingsProviderProps {}

export const SettingsProvider: FC<PropsWithChildren<SettingsProviderProps>> = ({ children }) => {
  const [handedness, setHandedness] = useMMKVString("Settings.handedness") as [
    Handedness,
    (h: Handedness) => void
  ]

  // Default to right-handed if not set
  const effectiveHandedness = handedness || "right"

  const value = {
    handedness: effectiveHandedness,
    setHandedness: useCallback((h: Handedness) => setHandedness(h), [setHandedness]),
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) throw new Error("useSettings must be used within a SettingsProvider")
  return context
}