import { StyleSheet, View, Text, TouchableOpacity, TextStyle, ViewStyle } from "react-native"
import { useAppTheme } from "@/theme/context"

export function HomeScreen({ navigation }: any) {
  const { themed } = useAppTheme()

  return (
    <View style={[themed($container), styles.centered]}>
      <Text style={themed($title)}>Stash Tracker 📦</Text>
      <Text style={themed($subtitle)}>Your inventory, organized</Text>
      
      <View style={themed($buttonRow)}>
        <TouchableOpacity
          style={themed($primaryButton)}
          onPress={() => navigation.navigate("ItemsList")}
        >
          <Text style={themed($buttonText)}>📋 View Items</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={themed($secondaryButton)}
          onPress={() => navigation.navigate("NewItemCameraScan")}
        >
          <Text style={themed($secondaryButtonText)}>📷 Scan Item</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={themed($secondaryButton)}
        onPress={() => navigation.navigate("ItemEditor", {})}
      >
        <Text style={themed($secondaryButtonText)}>+ Add Item Manually</Text>
      </TouchableOpacity>
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
  marginBottom: 40,
}

const $buttonRow: ViewStyle = {
  flexDirection: "row",
  gap: 12,
}

const $primaryButton: ViewStyle = {
  paddingHorizontal: 20,
  paddingVertical: 14,
  borderRadius: 12,
  backgroundColor: "primary",
}

const $buttonText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "white",
}

const $secondaryButton: ViewStyle = {
  paddingHorizontal: 20,
  paddingVertical: 14,
  borderRadius: 12,
  backgroundColor: "card",
  borderWidth: 1,
  borderColor: "primary",
}

const $secondaryButtonText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "primary",
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
})