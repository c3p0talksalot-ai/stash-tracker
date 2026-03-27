import { StyleSheet, View, Text, TextStyle, ViewStyle } from "react-native"
import { useAppTheme } from "@/theme/context"

export function HomeScreen() {
  const { themed } = useAppTheme()

  return (
    <View style={[themed($container), styles.centered]}>
      <Text style={themed($title)}>Stash Tracker 📦</Text>
      <Text style={themed($subtitle)}>Your inventory, organized</Text>
    </View>
  )
}

const $container: ViewStyle = {
  flex: 1,
}

const $title: TextStyle = {
  fontSize: 28,
  fontWeight: "bold",
  textAlign: "center",
  marginBottom: 8,
}

const $subtitle: TextStyle = {
  fontSize: 16,
  textAlign: "center",
  opacity: 0.7,
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
})