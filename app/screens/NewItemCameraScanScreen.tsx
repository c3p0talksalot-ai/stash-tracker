import { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ViewStyle,
  TextStyle,
} from "react-native"
import { CameraView, CameraType, useCameraPermissions, FlashMode } from "expo-camera"
import { useAppTheme } from "@/theme/context"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

type Props = AppStackScreenProps<"NewItemCameraScan">

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const CAPTURE_BUTTON_SIZE = 72
const CONTROL_BUTTON_SIZE = 44

export function NewItemCameraScanScreen({ navigation }: Props) {
  const { themed } = useAppTheme()
  const cameraRef = useRef<CameraView>(null)
  
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<CameraType>("back")
  const [flash, setFlash] = useState<FlashMode>("off")
  const [zoom, setZoom] = useState(0)
  const [isCameraReady, setIsCameraReady] = useState(false)

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission()
    }
  }, [])

  const handleCapture = async () => {
    if (!cameraRef.current || !isCameraReady) return
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      })
      
      if (photo?.uri) {
        navigation.navigate("Crop", {
          imageUri: photo.uri,
          mode: "single",
        })
      }
    } catch (error) {
      console.error("Failed to capture photo:", error)
      Alert.alert("Error", "Failed to capture photo")
    }
  }

  const handleOpenGallery = () => {
    navigation.navigate("GalleryPicker", { mode: "single" })
  }

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"))
  }

  const cycleFlash = () => {
    setFlash((current) => {
      if (current === "off") return "on"
      if (current === "on") return "auto"
      return "off"
    })
  }

  const handleZoomIn = () => {
    setZoom((current) => Math.min(current + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom((current) => Math.max(current - 0.2, 0))
  }

  const getFlashIcon = () => {
    switch (flash) {
      case "on": return "⚡"
      case "auto": return "A⚡"
      default: return "⚡-off"
    }
  }

  if (!permission) {
    return (
      <View style={themed($container)}>
        <Text style={themed($permissionText)}>Checking camera permission...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={themed($container)}>
        <Text style={themed($permissionText)}>Camera permission is required</Text>
        <TouchableOpacity onPress={requestPermission} style={themed($permissionButton)}>
          <Text style={themed($permissionButtonText)}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={themed($cancelButton)}>
          <Text style={themed($cancelText)}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={themed($container)}>
      <StatusBar hidden />
      
      <CameraView
        ref={cameraRef}
        style={themed($camera)}
        facing={facing}
        flash={flash}
        zoom={zoom}
        onMountError={(error) => {
          console.error("Camera mount error:", error)
        }}
      >
        <View style={themed($overlay)}>
          {/* Top controls */}
          <View style={themed($topControls)}>
            <TouchableOpacity
              style={[themed($controlButton), { opacity: flash === "off" ? 0.5 : 1 }]}
              onPress={cycleFlash}
            >
              <Text style={themed($controlIcon)}>{getFlashIcon()}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[themed($controlButton), { opacity: isCameraReady ? 1 : 0.3 }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={themed($controlIcon)}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Zoom controls */}
          <View style={themed($zoomControls)}>
            <TouchableOpacity
              style={[themed($controlButton), { opacity: zoom > 0 ? 1 : 0.3 }]}
              onPress={handleZoomOut}
            >
              <Text style={themed($controlIcon)}>−</Text>
            </TouchableOpacity>
            <Text style={themed($zoomLabel)}>{Math.round(zoom * 100)}%</Text>
            <TouchableOpacity
              style={[themed($controlButton), { opacity: zoom < 3 ? 1 : 0.3 }]}
              onPress={handleZoomIn}
            >
              <Text style={themed($controlIcon)}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom controls */}
          <View style={themed($bottomControls)}>
            <TouchableOpacity style={themed($galleryButton)} onPress={handleOpenGallery}>
              <Text style={themed($galleryIcon)}>🖼</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={themed($captureButton)}
              onPress={handleCapture}
              disabled={!isCameraReady}
            >
              <View style={themed($captureButtonInner)} />
            </TouchableOpacity>
            
            <TouchableOpacity style={themed($flipButton)} onPress={toggleFacing}>
              <Text style={themed($flipIcon)}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          zoom={zoom}
        />
      </CameraView>
    </View>
  )
}

const $container: ViewStyle = {
  flex: 1,
  backgroundColor: "black",
}

const $camera: ViewStyle = {
  flex: 1,
}

const $overlay: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  justifyContent: "space-between",
}

const $topControls: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingTop: 48,
  paddingHorizontal: 16,
}

const $zoomControls: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
}

const $bottomControls: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  paddingBottom: 48,
  paddingHorizontal: 16,
}

const $controlButton: ViewStyle = {
  width: CONTROL_BUTTON_SIZE,
  height: CONTROL_BUTTON_SIZE,
  borderRadius: CONTROL_BUTTON_SIZE / 2,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
}

const $controlIcon: TextStyle = {
  fontSize: 18,
  color: "white",
}

const $zoomLabel: TextStyle = {
  fontSize: 14,
  color: "white",
  minWidth: 50,
  textAlign: "center",
}

const $captureButton: ViewStyle = {
  width: CAPTURE_BUTTON_SIZE,
  height: CAPTURE_BUTTON_SIZE,
  borderRadius: CAPTURE_BUTTON_SIZE / 2,
  backgroundColor: "white",
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 4,
  borderColor: "rgba(255, 255, 255, 0.5)",
}

const $captureButtonInner: ViewStyle = {
  width: CAPTURE_BUTTON_SIZE - 16,
  height: CAPTURE_BUTTON_SIZE - 16,
  borderRadius: (CAPTURE_BUTTON_SIZE - 16) / 2,
  backgroundColor: "white",
}

const $galleryButton: ViewStyle = {
  width: CONTROL_BUTTON_SIZE,
  height: CONTROL_BUTTON_SIZE,
  justifyContent: "center",
  alignItems: "center",
}

const $galleryIcon: TextStyle = {
  fontSize: 28,
}

const $flipButton: ViewStyle = {
  width: CONTROL_BUTTON_SIZE,
  height: CONTROL_BUTTON_SIZE,
  justifyContent: "center",
  alignItems: "center",
}

const $flipIcon: TextStyle = {
  fontSize: 24,
}

const $permissionText: TextStyle = {
  fontSize: 16,
  color: "white",
  textAlign: "center",
  marginBottom: 20,
}

const $permissionButton: ViewStyle = {
  backgroundColor: "#007AFF",
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
  marginBottom: 16,
}

const $permissionButtonText: TextStyle = {
  fontSize: 16,
  color: "white",
  fontWeight: "600",
}

const $cancelButton: ViewStyle = {
  padding: 16,
}

const $cancelText: TextStyle = {
  fontSize: 16,
  color: "white",
}