import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native"
import * as MediaLibrary from "expo-media-library"
import { useAppTheme } from "@/theme/context"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

type Props = AppStackScreenProps<"GalleryPicker">

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const NUM_COLUMNS = 3
const ITEM_MARGIN = 2
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS

export function GalleryPickerScreen({ navigation, route }: Props) {
  const { themed } = useAppTheme()
  const { mode } = route.params
  
  const [permission, requestPermission] = MediaLibrary.usePermissions()
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    if (!permission?.granted) {
      const result = await requestPermission()
      if (!result?.granted) {
        Alert.alert("Permission Required", "Please grant photo library access")
        navigation.goBack()
        return
      }
    }

    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        first: 100,
        sortBy: ["creationTime"],
      })
      setAssets(media.assets)
    } catch (error) {
      console.error("Failed to load photos:", error)
      Alert.alert("Error", "Failed to load photos")
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (uri: string) => {
    if (mode === "single") {
      setSelected(new Set([uri]))
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(uri)) {
          next.delete(uri)
        } else {
          next.add(uri)
        }
        return next
      })
    }
  }

  const handleDone = () => {
    const selectedArray = Array.from(selected)
    if (selectedArray.length === 0) {
      Alert.alert("No Selection", "Please select at least one photo")
      return
    }

    if (mode === "single") {
      // Go to crop for single image
      navigation.replace("Crop", {
        imageUri: selectedArray[0],
        mode: "single",
      })
    } else {
      // Multi: go to crop for each image sequentially
      navigation.replace("Crop", {
        imageUri: selectedArray[0],
        mode: "multi",
        images: selectedArray,
        currentIndex: 0,
      })
    }
  }

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => {
    const isSelected = selected.has(item.uri)
    
    return (
      <TouchableOpacity
        style={themed($itemContainer)}
        onPress={() => toggleSelect(item.uri)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.uri }} style={themed($itemImage)} />
        {isSelected && (
          <View style={themed($checkOverlay)}>
            <View style={themed($checkCircle)}>
              <Text style={themed($checkIcon)}>✓</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  if (!permission) {
    return (
      <View style={themed($container)}>
        <Text style={themed($loadingText)}>Checking permissions...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={themed($container)}>
        <Text style={themed($permissionText)}>Photo library permission is required</Text>
        <TouchableOpacity onPress={requestPermission} style={themed($permissionButton)}>
          <Text style={themed($permissionButtonText)}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={themed($container)}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={themed($header)}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={themed($headerButton)}>
          <Text style={themed($headerButtonText)}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={themed($headerTitle)}>
          {mode === "single" ? "Select Photo" : `${selected.size} Selected`}
        </Text>
        
        <TouchableOpacity
          onPress={handleDone}
          style={[themed($headerButton), { opacity: selected.size > 0 ? 1 : 0.5 }]}
          disabled={selected.size === 0}
        >
          <Text style={themed($doneText)}>Done</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={themed($loadingContainer)}>
          <Text style={themed($loadingText)}>Loading photos...</Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={themed($grid)}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const $container: ViewStyle = {
  flex: 1,
  backgroundColor: "background",
}

const $header: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 48,
  paddingBottom: 12,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: "border",
}

const $headerButton: ViewStyle = {
  padding: 8,
  minWidth: 60,
}

const $headerButtonText: TextStyle = {
  fontSize: 16,
  color: "text",
}

const $headerTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  color: "text",
}

const $doneText: TextStyle = {
  fontSize: 16,
  color: "primary",
  fontWeight: "600",
  textAlign: "right",
}

const $grid: ViewStyle = {
  padding: ITEM_MARGIN,
}

const $itemContainer: ViewStyle = {
  width: ITEM_SIZE,
  height: ITEM_SIZE,
  margin: ITEM_MARGIN,
  borderRadius: 4,
  overflow: "hidden",
}

const $itemImage: ImageStyle = {
  width: "100%",
  height: "100%",
}

const $checkOverlay: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(0, 122, 255, 0.3)",
  justifyContent: "center",
  alignItems: "center",
}

const $checkCircle: ViewStyle = {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: "#007AFF",
  justifyContent: "center",
  alignItems: "center",
}

const $checkIcon: TextStyle = {
  fontSize: 14,
  color: "white",
  fontWeight: "bold",
}

const $loadingContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}

const $loadingText: TextStyle = {
  fontSize: 16,
  color: "text",
}

const $permissionText: TextStyle = {
  fontSize: 16,
  color: "text",
  textAlign: "center",
  marginBottom: 20,
}

const $permissionButton: ViewStyle = {
  backgroundColor: "#007AFF",
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
  alignSelf: "center",
}

const $permissionButtonText: TextStyle = {
  fontSize: 16,
  color: "white",
  fontWeight: "600",
}